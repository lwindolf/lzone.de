// vim: set ts=4 sw=4:

import { Settings } from './settings.js';
import { buildTree } from './doctree.js';

/* -------------------------------------------------------------------------
   Lifecycle of installable extra cheat sheet sections and their children
   in IndexedDB
   ------------------------------------------------------------------------- */

class Section {

    static async remove(name) {
        let extraSections = await this.#getNames();
        extraSections.splice(extraSections.indexOf(name), 1);
        await Settings.set('extraSections', extraSections);
        await Section.get(name).then(async (s) => {
            for(const n of Object.keys(s.nodes))
                Settings.remove(`document:::${name}:::${n}`);
            await Settings.remove(`section:::${name}`);
        });

        return;
    }

    // add or update
    static async add(name, s) {
        let extraSections = await this.#getNames();
        if(!extraSections.includes(name)) {
            extraSections.push(name);
            await Settings.set('extraSections', extraSections);
        }
        await Settings.set(`section:::${name}`, s);

        return;
    }

    static async get(name) {
        return buildTree((await Settings.get(`section:::${name}`, { children: [] })), name);
    }

    static async #getNames() {
        return (await Settings.get('extraSections', []))
            .filter((value, index, array) => array.indexOf(value) === index);
    }

    static async getAll() {
        let sections = [];

        for(const s of (await Section.#getNames()).sort()) {
            try {
                sections.push(await Section.get(s));
            } catch(e) {
                console.error(e)
            }
        }

        return sections;
    }

    static getDocument(path) {
        return Settings.get(`document:::${path}`, {});
    }
}

export { Section };