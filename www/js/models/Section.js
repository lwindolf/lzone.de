// vim: set ts=4 sw=4:

import { Settings } from './Settings.js';

/* Handling the installed cheat sheet sections tree and documents leaves in IndexedDB */

export class Section {
    static #sections;

    static async init() {
        // FIXME: schema migration
        this.#sections = await Settings.get('sections', { nodes: {}});
        console.log("Initializing sections");
        console.log(this.#sections);
    }

    // Helper to convert children path list to a tree
    // Takes a section object + name and creates a document tree from it
    static #buildTree(group, name, s) {
        let root = {
            name,
            parent_id : group,
            id        : group + ':::' + name,
            runbook   : s.runbook,
            url       : s.url,
            author    : s.author,
            license   : s.license,
            homepage  : s.homepage,
            nodes     : {}
        };

        s.children.forEach((id) => {
            console.log(`Adding ${id} to group ${group} section ${name}`);
            const path = id.split(/:::/);
            let parent = root;
            for(let i = 0; i < path.length - 1; i++) {
                const name = path[i];
                // create parents as needed
                if(!parent.nodes[name])
                    parent.nodes[name] = {
                        name      : name,
                        id        : parent.id + ':::' + name,
                        parent_id : parent.id,
                        nodes     : {}
                    };
                parent = parent.nodes[name];
            }
            parent.nodes[path[path.length - 1]] = {
                name      : path[path.length - 1],
                id        : parent.id + ':::' + path[path.length - 1],
                parent_id : parent.id,
                type      : s.type
            };
        });
/*
        // Reduce single leaves (1 pass only, so only one level)
        s.children.sort()
        .filter((id) => {
            let node = tree.nodes[id];

            if(!node?.parent_id)
                return false;

            if(tree.nodes[node.parent_id].children.length == 1)
                return true;

            return false;
        })
        .forEach((id) => {
            let node = tree.nodes[id];
            let parent = tree.nodes[node.parent_id];
            let grandparent = tree.nodes[parent?.parent_id] || tree;

            // Reparent the leaf node to it's grand parent
            grandparent.children = grandparent.children.map((id) => {
                if(id == parent.id)
                    return node.id;
                return id;
            });

            if (node.name =~ /^(index|README|Readme)$/)
                node.name = parent.name;
            else
                node.name = parent.name + ' / ' + node.name;

            delete tree.nodes[parent.id];
        });
*/
        console.info(root)
        return root;
    }

    static async remove(group, name) {
        let s = await Section.get(name);

        for(const n of Object.keys(s.nodes))
            Settings.remove(`document:::${name}:::${n}`);
        await Settings.remove(`section:::${name}`);

        delete this.#sections.nodes[group].nodes[name];
        await Settings.set('sections', this.#sections);
    }

    // add or update
    static async add(group, name, s) {
        if(!this.#sections.nodes[group])
            this.#sections.nodes[group] = { nodes: {}};
        this.#sections.nodes[group].nodes[name] = Section.#buildTree(group, name, s);

        await Settings.set('sections', this.#sections);
    }

    // get details of a section
    static get = async (name) => this.#sections.nodes[name];

    // get the tree of all sections
    static getTree = () => this.#sections;

    // get document details
    static getDocument = (path) => Settings.get(`document:::${path}`, {});

    // add or update a document
    static addDocument = (group, section, path, data) => Settings.set(`document:::${group}:::${section}:::${path}`, data);
}