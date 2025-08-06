// vim: set ts=4 sw=4:

// DAO for feeds
//
// emits
// - nodeUpdated(node)
// - itemsAdded(node)

import { AggregatorNode } from '../models/AggregatorNode.js';
import { DB } from '../models/DB.js';
import { FeedUpdater } from './feedupdater.js';
import { Item } from './item.js';
import * as ev from '../helpers/events.js';

export class Feed extends AggregatorNode {
    // state
    id;
    error;
    orig_source;
    last_updated;
    etag;
    corsProxyAllowed = false; // whether the user allowed CORS proxy for this feed
    newItems = [];            // temporarily set to items discovered during update
    unreadCount = 0;          // number of unread items in this feed

    // feed content
    title;
    source;
    description;
    icon;
    metadata = {};

    // error code constants
    static ERROR_NONE = 0;
    static ERROR_AUTH = 1 << 0;
    static ERROR_NET = 1 << 1;
    static ERROR_DISCOVER = 1 << 2;
    static ERROR_XML = 1 << 3;

    constructor(defaults = {}) {
        super("Feed");

        Object.keys(defaults).forEach((k) => { this[k] = defaults[k] });

        // Ensure we do not loose the original source URL on bogus HTTP redirects
        this.orig_source = this.source;
    }

    serialize() {
        return {...super.serialize(), ...{
            id               : this.id,
            title            : this.title,
            description      : this.description,
            homepage         : this.homepage,
            icon             : this.icon,
            source           : this.source,
            last_updated     : this.last_updated,
            corsProxyAllowed : this.corsProxyAllowed,
            unreadCount      : this.unreadCount,
            metadata         : this.metadata
        }};
    }

    async update() {
        // Do not update too often (for now hard-coded 1h)
        if (this.last_updated && (Date.now() / 1000 - this.last_updated < 60*60)) {
            console.info(`Skipping update of ${this.source} (last updated ${Math.ceil(Date.now() / 1000 - this.last_updated)}s ago)`);
            return;
        }

        const f = await FeedUpdater.fetch(this.source, this.corsProxyAllowed);
        if (Feed.ERROR_NONE == f.error) {
            let added = 0;

            this.title = f.title;
            this.source = f.source;
            this.homepage = f.homepage;
            this.description = f.description;
            this.metadata = f.metadata;

            const items = await this.getItems();
            this.unreadCount = items.filter((i) => !i.read).length;

            f.newItems.forEach((i) => {
                // If item already exists, skip it
                if (items.find((x) => (x.sourceId?(x.sourceId === i.sourceId):
                                      (x.source?(x.source === i.source):
                                      x.title === i.title))))
                    return;

                added++;
                this.unreadCount++;
                i.nodeId = this.id;
                i.save();
            })
            
            if(added > 0)
                ev.dispatch('itemsAdded', this);

            // FIXME: truncate set of items to match max per-feed cache size

            // feed provided favicon should always win
            if (f.icon)
                this.icon = this.corsProxyAllowed?`https://corsproxy.io/?${f.icon}`:f.icon;

        }

        this.last_updated = f.last_updated;
        this.error = f.error;
        ev.dispatch('nodeUpdated', this);
    }

    forceUpdate() {
        // Force update by resetting last_updated
        this.last_updated = 0;
        this.update();
    }

    getItems = async () => 
        (await DB.getByIndexOnly('aggregator', 'items', 'nodeId', this.id))
        .map((i) => new Item(i.value));

    // Return the next unread item after the given id
    async getNextUnread(id) {
        let item, idx = 0;

        if (!id)
            return undefined;

        // search forward in feed items starting from id
        const items = await this.getItems();
        items.find((i) => { idx++; return (i.id === id); });   // find current item index
        item = items.slice(idx).find((i) => !i.read);     // find next unread item
        if (item)
            return item;

        // if nothing found search from start of feed
        return items.find((i) => !i.read);
    }  

    // Only used during parsing time
    // FIXME: maybe should go to another class (e.g. FeedParser)
    addItem(item) {
        // Finally some guessing
        if (!item.time)
            item.time = Date.now();

        // FIXME: set an id if sourceId is missing
        
        this.newItems.push(item);
    }

    updateUnread(count) {
        this.unreadCount += count;
        if (this.unreadCount < 0)
            this.unreadCount = 0;

        ev.dispatch('nodeUpdated', this);
    }

    async markAllRead() {
        const items = await this.getItems();
        items.forEach((i) => i.setRead(true));
        this.updateUnread(-this.unreadCount);
    }
}