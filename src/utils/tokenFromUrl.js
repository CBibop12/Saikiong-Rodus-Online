export function popTokenFromUrl() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token) {
        // убираем параметр из адресной строки, чтобы он
        //   • не попадал в историю,
        //   • не утёк реферером на другой домен.
        url.searchParams.delete('token');
        const newUrl = `${window.location.origin}${url.pathname}${url.search}`;
        window.history.replaceState({}, '', newUrl);
    }

    return token; // либо строка, либо null
}