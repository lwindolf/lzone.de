// vim: set ts=4 sw=4:

// Simple fetch wrapper to allow for automatic CORS proxy

import { Config } from '../config.js';
import { Settings } from '../models/Settings.js';

// Fetch and URL normally or via CORS proxy
async function pfetch(url, options = {}, CORS = false) {
    // CORS might be enabled selectively (via CORS param or globally via settings)
    if (!CORS)
        CORS = await Settings.get('allowCorsProxy', false)

    if (!CORS)
        return await fetch(url, options);

    // We expect only CORS proxy URLs where we just need to add the encoded URL
    return await fetch(Config.corsProxy+encodeURI(url), options);
}

export { pfetch };