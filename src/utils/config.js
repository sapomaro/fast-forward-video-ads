import dotenv from 'dotenv';
import { getIp } from './ip.js';

dotenv.config();

export function config() {
    process.env.IP = getIp();
    return process.env;
}
