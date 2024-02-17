export function logger(preMessage = '', postMessage = '') {
    return (req, res, next) => {
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        console.log(res.statusCode, preMessage, req.method, fullUrl, postMessage);
        next();
    };
}
