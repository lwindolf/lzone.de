// vim: set ts=4 sw=4:

// Managing a tree of folders and feeds that are served by different
// subscriptions (e.g. local, Google Reader API, ...)
//
// FIXME: implement the tree (currently only flat list of feeds) 

import { Config } from '../config.js';
import { DB } from './db.js'
import { Feed } from './feed.js';
import * as ev from '../helpers/events.js';

export class FeedList {
    // hierarchical list of children
    static root = { children: [] };

    // id to node lookup map
    static #nodeById = {};

    // currently selected node
    static #selected;

    // currently known max feed id
    static maxId = 1;

    // Return selected node id
    static getSelectedId = () => FeedList.#selected.id;

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
        console.log("Saving feed list to DB");
        DB.set('feedlist', 'tree', FeedList.root.children);
    }

    static #nodeUpdated(feed) {
        // FIXME: folder recursion
        feed.unreadCount = feed.items.filter((i) => {
            return (i.read === false);
        }).length;
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

        // FIXME: belong into DB mapper code
        for(const i of f.items) {
            i.node = f;
        }

        if(update)
            await f.update();

        ev.dispatch('feedlistUpdated', undefined);
    }

    static remove(id) {
        let node = FeedList.getNodeById(id);
        if(!node)
            return;

        if(node === FeedList.#selected)
            FeedList.select(undefined);

        node.parent.children = node.parent.children.filter((n) => n.id !== id);

        delete FeedList.#nodeById[id];
        FeedList.#save();

        ev.dispatch('nodeRemoved', id);
    }

    // recursively mark all read on node and its children
    static markAllRead(id) {
        let node = FeedList.getNodeById(id);

        // FIXME: support recursion

        node.items.forEach((i) => {
            if(i.read)
                return;

            i.read = true;
            if(node === FeedList.#selected)
                ev.dispatch('itemUpdated', i);
        })
        ev.dispatch('nodeUpdated', node);
    }

    static select(id) {
        FeedList.#selected = FeedList.getNodeById(id);

        if(id)
            ev.dispatch('feedSelected', { id });
    }

    // Load folders/feeds from DB
    static async setup() {
        document.addEventListener('feedlistUpdated', FeedList.#save);
        document.addEventListener('nodeUpdated', (e) => FeedList.#nodeUpdated(e.detail));

        for(const f of (await DB.get('feedlist', 'tree', Config.groups.Feeds.defaultFeeds))){
            await this.add(new Feed(f), true);
        }

        FeedList.#save();
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