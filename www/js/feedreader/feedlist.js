// vim: set ts=4 sw=4:

// Managing a tree of folders and feeds that are served by different
// subscriptions (e.g. local, Google Reader API, ...)

import { DB } from './db.js'
import { Feed } from './feed.js';
import { SimpleSubscriptionDialog } from './dialogs/simpleSubscription.js';
import { template, render } from '../helpers/render.js';
import * as ev from '../helpers/events.js';

export class FeedList {
    // hierarchical list of children
    static root = { children: [] };

    // id to node lookup map
    static #nodeById = {};

    // currently selected node
    static #selected;

    // currently known max feed id
    static maxId = 0;

    // Return selected node id
    static getSelectedId = () => FeedList.#selected.id;

    // Return node by id
    static getNodeById = (id) =>id?FeedList.#nodeById[id]:undefined;

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

    static #nodeUpdated(feed) {
        // FIXME: folder recursion
        feed.unreadCount = feed.items.filter((i) => {
            return (i.read === false);
        }).length;

        render(`.feed[data-id="${feed.id}"]`, FeedList.feedTemplate, { feed: feed });
        DB.set('settings', 'feedlist', this.root);
    }

    // Add a new node (e.g. on subscribing)
    static add(f, update = true) {
        this.root.children.push(f);

        if(f.id > FeedList.maxId)
            FeedList.maxId = f.id;

        FeedList.#nodeById[f.id] = f;

        // FIXME: belong into DB mapper code
        for(const i of f.items) {
            i.node = f;
        }

        if(update)
            f.update();
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

        [...document.querySelectorAll('.feed.selected')]
            .forEach((n) => n.classList.remove('selected'));
        document.querySelector(`.feed[data-id="${id}"]`).classList.add('selected');

        ev.dispatch('feedSelected', { id });
    }

    static #getDefaultFeeds() {
        return {
            children: [
                { id: 0, title: "LZone Blog",       source: "https://lzone.de/feed/devops.xml" },
                { id: 1, title: "Liferea Blog",     source: "https://lzone.de/liferea/blog/feed.xml" }
            ]
        };
    }

    // Load folders/feeds from DB
    static async setup() {
        for(const f of (await DB.get('settings', 'feedlist', this.#getDefaultFeeds())).children) {
            this.add(new Feed(f), false);
        }

        // Run initial fetch
        this.update();
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