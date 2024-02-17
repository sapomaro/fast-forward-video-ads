export function delay(time) {
    return (_req, _res, next) => setTimeout(next, time);
}
