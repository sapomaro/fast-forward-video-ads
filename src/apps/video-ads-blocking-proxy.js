import express from 'express';
import { config } from '../utils/config.js';
import { logger } from '../middlewares/logger.js';
import { proxy } from '../middlewares/proxy.js';

export function runVideoAdsBlockingProxy() {
    const { IP, PORT_MAIN, HOST_MAIN, PATH_MAIN, PORT_CDN, HOST_CDN } = config();

    const FIRST_LOAD_DELAY_MS = 1000;
    const SHORT_VIDEO_SCAN_INTERVAL_MS = 200;
    const SHORT_VIDEO_DURATION_MAX_S = 120;

    const mainProxyServer = express();
    mainProxyServer.use(express.json());

    mainProxyServer.use('/*', logger('<MAIN-PROXY>'), proxy({
        target: HOST_MAIN,
        destination: IP,
        pathRewrite: { '^/go': PATH_MAIN },
        followRedirects: false,
        amendIncomingHtml: (html) => {
            let headIndex = html.indexOf('<head>');
            if (headIndex === -1) {
                headIndex = 0;
            } else {
                headIndex += 6;
            }

            const firstPart = html.slice(0, headIndex) + `
                <script>
                    function trimMainVideoIframe() {
                        const collection = document.getElementsByTagName('iframe') || [];
                        for (const item of collection) {
                            if (item.src?.includes('${HOST_CDN}'.replace(/^.+\\.([A-Za-z0-9]+\\.[A-Za-z]+\\/?)$/, '$1'))) {
                                const newSrc = item.src.replace(/https:\\/\\/[^/]+\\//g, 'http://${IP}:${PORT_CDN}/');
                                document.body.innerHTML = '<iframe id="video_iframe" width="840" height="600" src="' + newSrc + '" frameborder="0" allowfullscreen=""></iframe>';
                                break;
                            }
                        }
                        document.body.setAttribute('style', 'background: #000 !important; min-height: 100vh !important; display: flex !important; align-items: center !important; justify-content: center !important;');
                    }

                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(trimMainVideoIframe, ${FIRST_LOAD_DELAY_MS});
                    });

                    window.onbeforeunload = function(){
                        return 'Are you sure you want to redirect?';
                    };

                    window.location_ = {};
                </script>
            `;

            const secondPart = html.slice(headIndex)
                .replace(/([^a-z0-9_])(location)([^a-z0-9_])/gi, '$1$2_$3')
                .replace(/([^a-z0-9_])(throw)([^a-z0-9_])/gi, '$1$2_=$3');

            return firstPart + secondPart;
        },
    }));

    mainProxyServer.listen(PORT_MAIN, () => {
        console.log(`MAIN PROXY RUNNING: http://${IP}:${PORT_MAIN}`);
    });

    const cdnProxyServer = express();
    cdnProxyServer.use(express.json());

    cdnProxyServer.use('/*', logger('<CDN-PROXY>'), proxy({
        target: HOST_CDN,
        destination: IP,
        followRedirects: false,
        amendIncomingHtml: `
            <script>
                function fastForwardShortVideo(video) {
                    const isVideoShort = video.duration < ${SHORT_VIDEO_DURATION_MAX_S};
                    const isVideoPlaying = !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
                    if (isVideoShort && isVideoPlaying) {
                        video.currentTime = video.currentTime + video.duration;
                    }
                }

                function traverseShortVideosElements(documentElement) {
                    const collection = documentElement.getElementsByTagName('video') || [];
                    for (const video of collection) {
                        if (video) {
                            fastForwardShortVideo(video);
                        }
                    }
                }

                function traverseShortVideosIframes() {
                    traverseShortVideosElements(document);
                    const collection = document.getElementsByTagName('iframe') || [];
                    for (const iframe of collection) {
                        if (iframe?.contentDocument) {
                            traverseShortVideosElements(iframe.contentDocument);
                        }
                    }
                }

                document.addEventListener('DOMContentLoaded', () => {
                    setInterval(traverseShortVideosIframes, ${SHORT_VIDEO_SCAN_INTERVAL_MS});
                });
            </script>
        `,
    }));

    cdnProxyServer.listen(PORT_CDN, () => {
        console.log(`CDN PROXY RUNNING: http://${IP}:${PORT_CDN}`);
    });
}
