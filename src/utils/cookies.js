export function parseCookies(cookiesInput) {
    if (typeof cookiesInput === 'string') {
        const cookiesObject = {};
        const cookiesList = cookiesInput.split(';');
        for (const cookiesPair of cookiesList) {
            const [cookieKey, cookieValue] = cookiesPair.split('=');
            if (cookieKey.trim()) {
                cookiesObject[cookieKey.trim()] = (cookieValue || '').trim();
            }
        }
        return cookiesObject;
    } if (typeof cookiesInput === 'object') {
        return cookiesInput;
    }
    return null;
}

export function stringifyCookies(cookiesInput) {
    if (typeof cookiesInput === 'object') {
        return Object.entries(cookiesInput).map(([key, value]) => `${key}=${value}`).join('; ');
    } if (typeof cookiesInput === 'string') {
        return cookiesInput;
    }
    return '';
}
