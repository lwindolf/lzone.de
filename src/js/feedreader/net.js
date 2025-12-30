// vim: set ts=4 sw=4:

// Simple fetch modification to allow for automatic CORS proxy

import { Settings } from '../models/Settings.js';

if (!window.originalFetch) {
    window.originalFetch = window.fetch;

    // Fetch and URL normally or via CORS proxy
    //
    // Same signature as fetch, only difference is that you can pass
    // options.allowCorsProxy = true to enforce using the CORS proxy.
    // If options.allowCorsProxy is not set the global setting will be 
    // checked.
    window.fetch = async function(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        options.signal = controller.signal;

        try {
            let allowCorsProxy = options.allowCorsProxy;

            // CORS might be enabled selectively (via CORS param or globally via settings)
            if (!allowCorsProxy)
                allowCorsProxy = await Settings.get('allowCorsProxy', false);

            if (!allowCorsProxy)
                return await window.originalFetch(url, options);

            // We expect only CORS proxy URLs where we just need to add the encoded URL
            return await window.originalFetch(window.Config.corsProxy+encodeURI(url), options);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}