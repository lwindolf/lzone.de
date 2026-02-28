// vim: set ts=4 sw=4:

// Managing a tree of folders and feeds that are served by different
// subscriptions (e.g. local, Google Reader API, ...)
//
// emits
// - nodeRemoved(id)
// 
// FIXME: convert the feed list to a generic AggregatorTree

import { Feed } from './feed.js';
import { Folder } from './folder.js';

import { DB } from '../models/DB.js'
import { Settings } from '../models/Settings.js';
import * as ev from '../helpers/events.js';

export class FeedList {
    // hierarchical list of children
    static root = { children: [], unreadCount: 0 };

    // id to node lookup map
    static #nodeById = {};

    // currently known max feed id
    static maxId = 1;

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
        console.log('feedlist save');

        function serializeNode(node) {
            const serialized = node.serialize();
            if (node.children)
                serialized.children = node.children.map(serializeNode);

            return serialized;
        }

        DB.set('aggregator', 'tree', 'tree', FeedList.root.children.map(serializeNode));
    }

    static allowCorsProxy(id, allow) {
        FeedList.#nodeById[id].allowCorsProxy = allow;
        FeedList.#save();
    }

    // interactive folder adding
    static addNewFolder(selectedId) {
        const title = prompt('New folder title:');
        if (title) {
            // lookup parent folder by selectedId which is either a feed or a folder
            let parent = FeedList.getNodeById(selectedId);
            if(!parent || !parent.children)
                parent = FeedList.root; // FIXME: support nested folders!
            const folder = new Folder({ id: ++FeedList.maxId, title, children: [] });
            parent.children.push(folder);
            FeedList.#nodeById[folder.id] = folder;
            FeedList.#save();

            ev.dispatch('nodeUpdated', folder);

            console.log(`feedlist Added new folder: ${title}`, parent, FeedList.root);
        }
    }

    // Add a node
    // 
    // 1. on subscribing
    // 2. on feed list loading
    static async add(f, update = true) {
        console.log('feedlist add', f);

        if(!f.id)
            f.id = FeedList.maxId + 1;
        if(f.id > FeedList.maxId)
            FeedList.maxId = f.id;

        FeedList.#nodeById[f.id] = f;
        if(!f.parent)
            f.parent = FeedList.root;
        f.parent.children.push(f);

        if(update)
            await f.update();

        FeedList.#save();
    }

    static remove(id) {
        console.log('feedlist remove(' + id + ')');

        let node = FeedList.getNodeById(id);
        if(!node)
            return;

        node.parent.children = node.parent.children.filter((n) => n.id !== id);

        delete FeedList.#nodeById[id];
        FeedList.#save();

        ev.dispatch('nodeRemoved', id);
    }

    // recursively mark all read on node and its children
    static markAllRead(id) {
        let node = FeedList.getNodeById(id);
        if(node.children)
            node.children.forEach((n) => this.markAllRead(n.id));
        node.markAllRead();
    }

    // initially loads deserializes feed list data
    static async #loadNodes(nodes, parent) {
        for(const n of nodes) {
            try {
                const id = parseInt(n.id);
                if(!id)
                    return;
                if(FeedList.maxId < id)
                    FeedList.maxId = id;

                if(n.type === 'folder') {
                    const folder = new Folder(n);
                    folder.parent = parent;
                    folder.children = [];
                    FeedList.#nodeById[id] = folder;
                    parent.children.push(folder);
                    console.log("feedlist loadNodes() Add folder", n);
                    await this.#loadNodes(n.children, folder);
                }
                if (n.type === 'feed' || !n.type) {
                    const feed = new Feed(n);
                    feed.parent = parent;
                    FeedList.#nodeById[id] = feed;
                    parent.children.push(feed);

                    // Always force update unread count
                    const items = await feed.getItems();
                    feed.unreadCount = 0;
                    await feed.loadIcon();
                    feed.updateUnread(items.filter((i) => !i.read).length);

                    console.log("feedlist loadNodes() Add feed", n)
                }
            } catch (e) {
                console.error("feedlist loadNodes() Error", e)
            }
        }
    }

    // Load folders/feeds from DB
    static async setup() {
        console.log('feedlist setup')

        const children = await DB.get('aggregator', 'tree', 'tree', window.Config.groups.Feeds.defaultFeeds);
        await this.#loadNodes(children, FeedList.root);

        // Trigger sidebar update
        document.dispatchEvent(new CustomEvent('sections-updated'));

        document.addEventListener('nodeUpdated', () => FeedList.#save());

        if(FeedList.root.children.length > 0)
            FeedList.#save();   // to allow for ad-hoc schema changes

        if (Settings.get("feedreader:::updateAllOnStartup"))
            FeedList.update();

        // Cleanup orphaned feed items
        if(FeedList.#nodeById.length > 0)
            DB.removeOrphans('aggregator', 'items', 'nodeId', Object.keys(FeedList.#nodeById).map((id) => parseInt(id)));

        console.log('feedlist setup done')
    }

    // Recursively update a node
    static updateNode(node, force = false) {
        console.log('feedlist updateNode', node, force)

        if(!node.children) {
            if (node instanceof Feed)
                node.update(force);
            return;
        }

        node.children.forEach(child => {
            this.updateNode(child, force);
        });
    }

    static update() {
        this.updateNode(this.root);
    }
}