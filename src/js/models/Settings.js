// vim: set ts=4 sw=4:

import { DB } from './DB.js';

/* Persistent settings using IndexedDB 
 *
 * - emits settings-changed event
 */

export class Settings {
    static #schema = {};     // schema that can supply default values e.g. 
                             // { 'feedreader:::refreshInterval': { default: 24, "description": "The default refresh interval for the feed reader" } }

    // FIXME: enforce schema and do not allow other values

    static async initialize() {
        this.#schema = await DB.get("settings", "settings", "schema", {});
        console.log("Settings schema:", this.#schema);
    }

    static async addSchema(definitions) {
        this.#schema = { ...this.#schema, ...definitions };
        await DB.set("settings", "settings", "schema", this.#schema, false /* no event */);
    }

    // get a key with a given default value or the optional default as defined by schema
    static get = async (name, defaultValue) =>
        await DB.get("settings", "settings", name, defaultValue?defaultValue:this.#schema[name]?.default);

    static async set(name, value, event = true) {
        await DB.set("settings", "settings", name, value, event);
        if (event)       
            document.dispatchEvent(new CustomEvent('settings-changed', { detail: { name, value } }));
    }

    static remove = async (name) => 
        await DB.remove("settings", "settings", name);
}

Settings.initialize();