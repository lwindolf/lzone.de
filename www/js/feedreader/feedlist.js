// vim: set ts=4 sw=4:

// Managing a tree of folders and feeds that are served by different
// subscriptions (e.g. local, Google Reader API, ...)
//
// emits
// - feedlistUpdated
// - nodeRemoved(id)
// - feedSelected(id)
// 
// FIXME: implement the tree (currently only flat list of feeds) 
// FIXME: convert the feed list to a generic AggregatorTree

import { Config } from '../config.js';
import { DB } from '../models/DB.js'
import { Feed } from './feed.js';
import * as ev from '../helpers/events.js';

export class FeedList {
    // hierarchical list of children
    static root = { children: [] };

    // id to node lookup map
    static #nodeById = {};

    // id of currently selected node
    static #selectedId;

    // currently known max feed id
    static maxId = 1;

    // Return selected node id
    static getSelectedId = () => FeedList.#selectedId;

    // Return node by id
    static getNodeById = (id) =>id?FeedList.#nodeById[parseInt(id)]:undefined;

    // Return the next unread node after the given node id
    static getNextUnreadNode(id) {
        let node, idx = 0;

        // search forward in feed list starting from id
        // FIXME: support folder recursion
        if(id) {
            this.root.children.find((n) => { idx++; return (n.id === id); });   // find current feed index
            node = this.root.children.slice(idx).find((n) => n.unreadCount > 0);          // find next unread item
            if(node)
                return node;
        }

        // if nothing found search from start of feed
        return this.root.children.find((n) => n.unreadCount > 0);
    }

    static #save() {     
        function serializeNode(node) {
            const serialized = node.serialize();
            if (node.children)
                serialized.children = node.children.map(serializeNode);

            return serialized;
        }

        DB.set('aggregator', 'tree', 'tree', FeedList.root.children.map(serializeNode));
    }

    static allowCorsProxy(id, allow) {
        FeedList.#nodeById[id].corsProxyAllowed = allow;
        FeedList.#save();
    }

    // Add a new node (e.g. on subscribing)
    static async add(f, update = true) {
        this.root.children.push(f);

        if(!f.id)
            f.id = FeedList.maxId + 1;
        if(f.id > FeedList.maxId)
            FeedList.maxId = f.id;

        FeedList.#nodeById[f.id] = f;
        f.parent = FeedList.root; // set parent to root

        if(update)
            await f.update();

        FeedList.#save();
        ev.dispatch('feedlistUpdated', undefined);
    }

    static remove(id) {
        let node = FeedList.getNodeById(id);
        if(!node)
            return;

        if(id === FeedList.#selectedId)
            FeedList.select(undefined);

        node.parent.children = node.parent.children.filter((n) => n.id !== id);

        delete FeedList.#nodeById[id];
        FeedList.#save();

        ev.dispatch('nodeRemoved', id);
    }

    // recursively mark all read on node and its children
    static markAllRead(id) {
        let node = FeedList.getNodeById(id);
        node.children.forEach((n) => this.markAllRead(n.id));
        node.markAllRead();
    }

    static select(id) {
        FeedList.#selectedId = id;

        if(id)
            ev.dispatch('feedSelected', id);
    }

    // Load folders/feeds from DB
    static async setup() {
        document.addEventListener('nodeUpdated', () => FeedList.#save());

        for(const f of (await DB.get('aggregator', 'tree', 'tree', Config.groups.Feeds.defaultFeeds))){
            await this.add(new Feed(f), true);
        }
    }

    constructor() {
        FeedList.setup();
    }

    // Recursively update folder
    static #updateFolder(folder) {
        if(!folder.children)
            return;

        folder.children.forEach(node => {
            if(node.constructor.name === "Feed") {
                node.update();
            } else {
                this.#updateFolder(node);
            }
        });
    }

    static update = () => this.#updateFolder(this.root);
}