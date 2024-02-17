import { networkInterfaces } from 'os';

export function getIp() {
    return [].concat(...Object.values(networkInterfaces()))
        .find((item) => !item.internal && item.family === 'IPv4')?.address;
}
