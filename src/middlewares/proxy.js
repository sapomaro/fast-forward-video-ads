import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { parseJson, stringifyJson } from '../utils/json.js';
import { mergeDeep } from '../utils/objects.js';
import { parseCookies, stringifyCookies } from '../utils/cookies.js';

export function proxy(config = {}) {
    const {
        target,
        destination,
        followRedirects,
        headers,
        amendOutgoingCookies,
        amendOutgoingJson,
        amendIncomingCookies,
        amendIncomingJson,
        amendIncomingHtml,
        pathRewrite,
        ...restConfig
    } = config;

    const host = (new URL(target)).host;
    const protocol = (new URL(target)).protocol + '//';
    let referer = Object.values(pathRewrite || {})?.[0] || '/';
    if (referer[0] !== '/') {
        referer = '/' + referer;
    }

    return createProxyMiddleware({
        target: target,
        secure: true,
        changeOrigin: true,
        cookieDomainRewrite: destination,
        followRedirects,
        headers: {
            host,
            referer: protocol + host + referer,
            ...headers,
        },
        onProxyReq: (proxyReq, req) => {
            const contentType = proxyReq.getHeader('Content-Type') || '';
            if (amendOutgoingCookies) {
                let newCookiesString = '';
                if (typeof amendOutgoingCookies === 'function') {
                    newCookiesString = amendOutgoingCookies(req.headers.cookie);
                } else {
                    newCookiesString = stringifyCookies({
                        ...(parseCookies(req.headers.cookie) || {}),
                        ...(parseCookies(amendOutgoingCookies) || {}),
                    });
                }
                if (newCookiesString) {
                    proxyReq.setHeader('cookie', newCookiesString);
                }
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

            if (amendIncomingCookies) {
                let newCookiesString = '';
                if (typeof amendIncomingCookies === 'function') {
                    newCookiesString = amendIncomingCookies(proxyRes.headers?.cookie);
                } else {
                    newCookiesString = stringifyCookies({
                        ...(parseCookies(proxyRes.headers?.cookie) || {}),
                        ...(parseCookies(amendIncomingCookies) || {}),
                    });
                }
                if (newCookiesString) {
                    res.setHeader('cookie', newCookiesString);
                }
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
        ...pathRewrite,
        ...restConfig,
    });
};
