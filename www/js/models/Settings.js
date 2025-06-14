// vim: set ts=4 sw=4:

import { DB } from './DB.js';

/* Persistent settings using IndexedDB 
 *
 * TODO: Also implements a simple settings schema model
 */

export class Settings {
    static get = async (name, defaultValue) =>
        DB.get("settings", "settings", name, defaultValue);

    static async set(name, value, event = true) {
        await DB.set("settings", "settings", name, value, event);
        document.dispatchEvent(new CustomEvent('settings-changed', { detail: { name, value } }));
    }

    static remove = async (name) => 
        DB.remove("settings", "settings", name);
}
