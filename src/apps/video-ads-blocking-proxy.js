import express from 'express';
import { config } from '../utils/config.js';
import { logger } from '../middlewares/logger.js';
import { proxy } from '../middlewares/proxy.js';

export function runVideoAdsBlockingProxy() {
    const { IP, PORT1, HOST1, PATH1, PORT2, HOST2 } = config();

    const app1 = express();
    app1.use(express.json());

    app1.use('/*', logger('<APP1-PROXY>'), proxy({
        target: HOST1,
        destination: IP,
        pathRewrite: { '^/site': PATH1 },
        amendIncomingHtml: `
            <script>
                function trimVideoIframe() {
                    const collection = document.getElementsByTagName('iframe') || [];
                    for (const item of collection) {
                        if (item.src?.includes('${HOST2}'.replace(/^.+\\.([A-Za-z0-9]+\\.[A-Za-z]+\\/?)$/, '$1'))) {
                            const newSrc = item.src.replace(/https:\\/\\/[^/]+\\//g, 'http://${IP}:${PORT2}/');
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

    app1.listen(PORT1, () => {
        console.log(`APP1 RUNNING: http://${IP}:${PORT1}`);
    });

    const app2 = express();
    app2.use(express.json());

    app2.use('/*', logger('<APP2-PROXY>'), proxy({
        target: HOST2,
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

    app2.listen(PORT2, () => {
        console.log(`APP2 RUNNING: http://${IP}:${PORT2}`);
    });
}
