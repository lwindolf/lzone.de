// vim: set ts=4 sw=4:

// Simple fetch wrapper to allow for automatic CORS proxy

import { Settings } from '../models/Settings.js';

// Fetch and URL normally or via CORS proxy
async function pfetch(url, options = {}, CORS = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    options.signal = controller.signal;

    try {
        // CORS might be enabled selectively (via CORS param or globally via settings)
        if (!CORS)
            CORS = await Settings.get('allowCorsProxy', false)

        if (!CORS)
            return await fetch(url, options);

        // We expect only CORS proxy URLs where we just need to add the encoded URL
        return await fetch(window.Config.corsProxy+encodeURI(url), options);
    } catch (error) {
        console.error('Fetch error:', error);
    } finally {
        clearTimeout(timeoutId);
    }
}

export { pfetch };