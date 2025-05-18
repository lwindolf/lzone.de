// vim: set ts=4 sw=4:

import { Section } from "./Section.js";
import { Settings } from "./Settings.js";

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

    static async getDocs() {
        const tree = Section.getTree()
        let docs = {};

        // Create index for all group childs
        if (tree.nodes)
            Object.values(tree.nodes).forEach((node) => {
                docs = { ...docs, ...SearchIndex.#index(node) };
            });

        return docs;
    }

    // Create lunr index for a node
    static #index(node) {
        let docs = {};

        if(node.nodes)
            Object.values(node.nodes).forEach((s) => {
                console.log(`Adding index for ${s.id}`);
                // Add entry for section title
                const path = `${s.id.replace(/:::/g, '/')}`;
                docs[path] = {
                    doc: path,
                    id: s.id,
                    title: s.name,
                    content: s.content,
                    relUrl: '#/'+path
                }

                // Recursion
                docs = { ...docs, ...SearchIndex.#index(s) };
            });

        return docs;
    }

    static async update() {
        const docs = await SearchIndex.getDocs();
        let results = {
            docs,
            index: lunr(function () {
                this.ref('id');
                this.field('title', { boost: 200 });
                this.field('content', { boost: 2 });
                this.field('relUrl');
                this.metadataWhitelist = ['position']
          
                for (let id in docs) {
                  this.add({
                    id,
                    title: docs[id].title,
                    content: docs[id].content,
                    relUrl: docs[id].relUrl
                  });
                }
            })
        };
        SearchIndex.setCache({ index: JSON.stringify(results.index), docs: results.docs });
        return results;
      }
}