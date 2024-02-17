import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { parseJson, stringifyJson } from '../utils/json.js';
import { mergeDeep } from '../utils/objects.js';
import { parseCookies } from '../utils/cookies.js';

export function proxy(config = {}) {
    const {
        target,
        destination,
        followRedirects,
        amendOutgoingCookies,
        amendOutgoingJson,
        amendIncomingJson,
        amendIncomingHtml,
        ...restConfig
    } = config;

    return createProxyMiddleware({
        target: target,
        secure: true,
        changeOrigin: true,
        cookieDomainRewrite: destination,
        followRedirects,
        onProxyReq: (proxyReq, req) => {
            const contentType = proxyReq.getHeader('Content-Type') || '';

            if (amendOutgoingCookies) {
                let newCookiesString = '';
                if (typeof amendOutgoingCookies === 'function') {
                    newCookiesString = amendOutgoingCookies(req.headers.cookie);
                } else if (amendOutgoingCookies) {
                    newCookiesString = stringifyJson(
                        (parseCookies(req.headers.cookie) || {}),
                        (parseCookies(amendOutgoingCookies) || {}),
                    );
                }
                proxyReq.setHeader('cookie', newCookiesString);
            }

            if (contentType.includes('application/json')) {
                let dataObject = req.body || {};
                if (amendOutgoingJson) {
                    if (typeof amendOutgoingJson === 'function') {
                        dataObject = amendOutgoingJson(dataObject);
                    } else if (amendOutgoingJson) {
                        dataObject = mergeDeep(dataObject, amendOutgoingJson);
                    }
                }
                const dataString = stringifyJson(dataObject);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(dataString));
                proxyReq.write(dataString);
            }
        },
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
            const contentType = res.getHeader('Content-Type') || '';

            if (followRedirects === false) {
                res.removeHeader('location');
            }

            if (contentType.includes('application/json') && amendIncomingJson) {
                let jsonObject = parseJson(responseBuffer.toString('utf8'));
                if (typeof amendIncomingJson === 'function') {
                    jsonObject = amendIncomingJson(jsonObject);
                } else if (typeof amendIncomingJson === 'object') {
                    jsonObject = mergeDeep(jsonObject, amendIncomingJson);
                }
                return stringifyJson(jsonObject);
            }

            if (contentType.includes('text/html') && amendIncomingHtml) {
                let htmlString = responseBuffer.toString('utf8');
                if (typeof amendIncomingHtml === 'function') {
                    htmlString = amendIncomingHtml(htmlString);
                } else if (amendIncomingHtml) {
                    htmlString += amendIncomingHtml;
                }
                return htmlString;
            }

            return responseBuffer;
        }),
        ...restConfig,
    });
};
