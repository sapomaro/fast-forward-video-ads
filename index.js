function fastForwardVideoAds(root) {
    const collection = root.getElementsByTagName('video') || [];
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
    setInterval(() => {
        fastForwardVideoAds(document);
    }, 200);
    document.body.style.borderTop = '10px solid red';
});
