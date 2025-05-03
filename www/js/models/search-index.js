// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { Section } from "./section.js";
import { Settings } from "./settings.js";

// Persistent index of all installed documents. Cached to avoid recomputing

export class SearchIndex {
    static #cacheName = 'SearchCache';

    static async getCache() {
        return await Settings.get(SearchIndex.#cacheName, undefined);
    }

    static async setCache(cache) {
        await Settings.set(SearchIndex.#cacheName, cache);
    }

    static async clearCache() {
        await Settings.delete(SearchIndex.#cacheName);
    }

    // Load search index for site specific cheat sheets
    // Automatically cached by PWA worker
    static async getDefault() {
        return await fetch(Config.cheatSheetIndexUrl)
            .then((response) => response.json());
    }

    static async getDocs() {
        let sections = await Section.getAll();
        let docs = {};

        for (const s of sections) {
            docs = { ...docs, ...this.#index_section(s) };
        }
        return docs;
    }

    // Create lunr index for a section
    static #index_section(s) {
        let docs = {};

        // Add entry for section title
        const spath = `/#/${s.name}`;
        docs[spath] = {
            doc: s.name,
            id: spath,
            title: s.name,
            content: "",
            relUrl: spath
        }

        // Add 1st level child entries
        s?.children.forEach((c) => {
            const path = `/#/${s.name}/${c}`;
            docs[path] = {
                doc: s.name,
                id: path,
                title: c,
                content: "",
                relUrl: path
            }
        });

        return docs;
    }
}