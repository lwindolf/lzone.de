// vim: set ts=4 sw=4:

// DAO for feeds
//
// emits
// - nodeUpdated(node)
// - itemsAdded(node)

import { DB } from '../models/DB.js';
import { FeedUpdater } from './feedupdater.js';
import { Item } from './item.js';
import * as ev from '../helpers/events.js';

export class Feed {
    // state
    id;
    error;
    orig_source;
    last_updated = 0;
    last_updated_favicon = 0;
    allowCorsProxy = false;   // whether the user allowed CORS proxy for this feed
    newItems = [];            // temporarily set to items discovered during update
    unreadCount = 0;          // number of unread items in this feed

    // Note: no etag/last_modified state here, as this is done by the browser networking.

    // feed content
    title;
    source;
    description;
    icon;                       // icon URL
    iconData;                   // icon data as data URL
    metadata = {};

    // non-persisted state
    feedStatusMsg;              // provides a feedback message during updates (undefined otherwise)

    // error code constants
    static ERROR_NONE = 0;
    static ERROR_AUTH = 1 << 0;
    static ERROR_NET = 1 << 1;
    static ERROR_DISCOVER = 1 << 2;
    static ERROR_XML = 1 << 3;

    constructor(defaults = {}) {
        Object.keys(defaults).forEach((k) => { this[k] = defaults[k] });

        // Ensure we do not loose the original source URL on bogus HTTP redirects
        this.orig_source = this.source;
    }

    serialize() {
        return {
            id               : this.id,
            title            : this.title,
            description      : this.description,
            homepage         : this.homepage,
            icon             : this.icon,
            iconData         : this.iconData,
            source           : this.source,
            last_updated     : this.last_updated,
            last_updated_favicon : this.last_updated_favicon,
            allowCorsProxy   : this.allowCorsProxy,
            unreadCount      : this.unreadCount,
            metadata         : this.metadata
        };
    }

    #updateStatus(msg) {
        this.feedStatusMsg = msg;
        ev.dispatch('feedUpdating', { id: this.id });
    }

    async update(force = false) {
        // Force update by resetting last_updated
        if (force) {
            this.#updateStatus(`Forcing update of ${this.source}`);
            this.last_updated = 0;
            this.last_updated_favicon = 0;
        }
        
        // Do not update too often (for now hard-coded 1h)
        if (this.last_updated && (Date.now() / 1000 - this.last_updated < 60*60)) {
            this.#updateStatus(`Skipping update of ${this.source} (last updated ${Math.ceil(Date.now() / 1000 - this.last_updated)}s ago)`);
            return;
        }

        const f = await FeedUpdater.fetch(this.source, this.allowCorsProxy);
        if (Feed.ERROR_NONE == f.error) {
            let added = 0;

            this.title = f.title;
            this.source = f.source;
            this.homepage = f.homepage;
            this.description = f.description;
            this.metadata = f.metadata;
            this.icon = f.icon;
            this.iconData = f.iconData;

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

            // Do not update too often (for now hard-coded 30d)
            if ((Date.now() / 1000 - this.last_updated_favicon > 30*24*60*60)) {
                this.#updateStatus(`Updating favicon for ${this.source} (${this.icon})`);

                // See also https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/
                const response = await fetch(this.icon);
                if (response.ok) {                       
                    const blob = await response.blob();
                    const data = await new Promise((resolve, reject) => {
                        try {
                            const reader = new FileReader();
                            reader.onload = function() { resolve(this.result); };
                            reader.readAsDataURL(blob);
                        } catch(e) {
                            reject(e);
                        }
                    });
                    if (data && data.startsWith('data:image')) {
                        this.iconData = data;
                        console.log(`Favicon update for ${this.source} (${this.icon}) was successful`);
                    } else {
                        console.warn(`Favicon update for feed ${this.id} failed`);
                    }
                    this.last_updated_favicon = Date.now() / 1000;
                } else {
                    console.warn(`Favicon response for feed ${this.id} failed`);
                }
            } else {
                console.warn(`Favicon fetch for feed ${this.id} failed`);
            }
            this.#updateStatus(undefined);
        } else {
            this.#updateStatus(`Feed update failed: ${f.error}`);
        }

        this.last_updated = f.last_updated;
        this.error = f.error;
        ev.dispatch('nodeUpdated', this);
    }

    getItems = async () => 
        (await DB.getByIndexOnly('aggregator', 'items', 'nodeId', this.id))
        .map((i) => new Item({ id: i.id, ...i.value }));

    // Return the next unread item after the given id
    async getNextUnread(id) {
        let item, idx = 0;

        if (!id)
            return undefined;

        // search forward in feed items starting from id
        const items = await this.getItems();
        items.find((i) => { idx++; return (i.id === id); });   // find current item index
        item = items.slice(idx).find((i) => !i.read);     // find next unread item

        console.log('feed getNextUnread find forward result:', item);
        if (item)
            return item;

        // if nothing found search from start of feed
        item = items.find((i) => !i.read);
        console.log('feed getNextUnread find from start result:', item);
        return item;
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