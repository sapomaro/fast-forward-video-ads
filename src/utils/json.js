export function parseJson(jsonString) {
    if (typeof jsonString !== 'string') {
        return null;
    }
    try {
        return JSON.parse(jsonString.replace(/([{,][ ]*)(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '$1"$3": '));
    } catch(error) {
        console.error(error, jsonString);
        return null;
    }
}

export function stringifyJson(jsonObject) {
    try {
        return JSON.stringify(jsonObject);
    } catch(error) {
        console.error(error, value);
        return '';
    }
}
