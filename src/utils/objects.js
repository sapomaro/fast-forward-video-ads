export function isPlainObject(item) {
    if (typeof item !== 'object' || item === null) {
        return false;
    }
    const prototype = Object.getPrototypeOf(item);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null);
}

export function isArray(item) {
    return Array.isArray(item);
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (isPlainObject(target) && isPlainObject(source)) {
        for (const key in source) {
            if (isPlainObject(source[key])) {
                if (!isPlainObject(target[key])) {
                    target[key] = {};
                }
                mergeDeep(target[key], source[key]);
            } else if (isArray(source[key])) {
                if (!isArray(target[key])) {
                    target[key] = [];
                }
                mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    } else if (isArray(target) && isArray(source)) {
        for (let key = 0; key < source.length; ++key) {
            if (isPlainObject(source[key])) {
                if (!isPlainObject(target[key])) {
                    target[key] = {};
                }
                mergeDeep(target[key], source[key]);
            } else if (isArray(source[key])) {
                if (!isArray(target[key])) {
                    target[key] = [];
                }
                mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return mergeDeep(target, ...sources);
}
