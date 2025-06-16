// vim: set ts=4 sw=4:

import { Settings } from './Settings.js';

/* Handling the installed cheat sheet sections tree and documents leaves in IndexedDB */

export class Section {
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

    // persist changes and emit update event
    static async #update(root) {
        await Settings.set('sections', root);
        document.dispatchEvent(new CustomEvent("sections-updated"));
    }

    static async remove(group, name) {
        let root = await this.getTree();
        let s = root.nodes[group].nodes[name];
        if(!s)
            return;

        for(const n of Object.keys(s.nodes))
            Settings.remove(`document:::${name}:::${n}`);
        await Settings.remove(`section:::${name}`);

        delete root.nodes[group].nodes[name];
        this.#update(root);
    }

    static async removeGroup(group) {
        let root = await this.getTree();
        let g = root.nodes[group];
        if(!g)
            return;

        for(const n of Object.keys(g.nodes))
            await this.remove(group, n);

        delete root.nodes[group];
        this.#update(root);
    }

    // add or update
    static async add(group, name, s) {
        let root = await this.getTree();
        if(!root.nodes[group])
            root.nodes[group] = { nodes: {}};
        root.nodes[group].nodes[name] = Section.#buildTree(group, name, s);
        this.#update(root);
    }

    // get details of a node by path
    static async get(path) {
        let node = await this.getTree();
        for (const p of path.split(/:::/)) {
            if(!node.nodes[p])
                return undefined;
            node = node.nodes[p];
        }
        return node;
    }

    // get the tree of all sections
    static getTree = async () => await Settings.get('sections', { nodes: {}});

    // get document details
    static getDocument = async (path) => await Settings.get(`document:::${path}`, {});

    // add or update a document
    static addDocument = async (group, section, path, data) => await Settings.set(`document:::${group}:::${section}:::${path}`, data);
}