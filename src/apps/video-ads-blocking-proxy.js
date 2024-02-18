import express from 'express';
import { config } from '../utils/config.js';
import { logger } from '../middlewares/logger.js';
import { proxy } from '../middlewares/proxy.js';

export function runVideoAdsBlockingProxy() {
    const { IP, PORT_MAIN, HOST_MAIN, PATH_MAIN, PORT_CDN, HOST_CDN } = config();

    const mainProxyServer = express();
    mainProxyServer.use(express.json());

    mainProxyServer.use('/*', logger('<MAIN-PROXY>'), proxy({
        target: HOST_MAIN,
        destination: IP,
        pathRewrite: { '^/go': PATH_MAIN },
        amendIncomingHtml: `
            <script>
                function trimVideoIframe() {
                    const collection = document.getElementsByTagName('iframe') || [];
                    for (const item of collection) {
                        if (item.src?.includes('${HOST_CDN}'.replace(/^.+\\.([A-Za-z0-9]+\\.[A-Za-z]+\\/?)$/, '$1'))) {
                            const newSrc = item.src.replace(/https:\\/\\/[^/]+\\//g, 'http://${IP}:${PORT_CDN}/');
                            document.body.innerHTML = '<iframe id="video_iframe" width="560" height="400" src="' + newSrc + '" frameborder="0" allowfullscreen=""></iframe>';
                            break;
                        }
                    }
                    document.body.setAttribute('style', 'background: #000 !important; min-height: 100vh !important; display: flex !important; align-items: center !important; justify-content: center !important;');
                }

                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(trimVideoIframe, 1000);
                });
            </script>
        `,
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
                function fastForwardVideoAds() {
                    const collection = document.getElementsByTagName('video') || [];
                    for (const video of collection) {
                        if (!video) { continue; }
                        const isVideoShort = video.duration < 60;
                        const isVideoPlaying = !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
                        if (isVideoShort && isVideoPlaying) {
                            video.currentTime = video.currentTime + video.duration;
                        }
                    }
                }

                document.addEventListener('DOMContentLoaded', () => {
                    setInterval(fastForwardVideoAds, 200);
                });
            </script>
        `,
    }));

    cdnProxyServer.listen(PORT_CDN, () => {
        console.log(`CDN PROXY RUNNING: http://${IP}:${PORT_CDN}`);
    });
}
