// vim: set ts=4 sw=4:

// Simple fetch wrapper to allow for automatic CORS proxy

// Fetch and URL normally or via CORS proxy
async function pfetch(url, options = {}, CORS = true) {
    if (!CORS)
        return await fetch(url, options);

    // FIXME: allow user to configure proxy
    return await fetch('https://corsproxy.io/?url='+encodeURI(url), options);
}

export { pfetch };