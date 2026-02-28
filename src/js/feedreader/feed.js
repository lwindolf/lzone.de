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
import { Settings } from '../models/Settings.js';
import { linkAutoDiscover } from './parsers/autodiscover.js';

export class Feed {
    // state
    id;
    error;
    orig_source;
    last_updated = 0;
    last_updated_favicon = 0;
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
    type = 'feed';

    // non-persisted state
    feedStatusMsg;              // provides a feedback message during updates (undefined otherwise)

    // error code constants
    static ERROR_NONE       = 0;
    static ERROR_AUTH       = 1 << 0;
    static ERROR_NET_CORS   = 1 << 1;
    static ERROR_NET        = 1 << 2;
    static ERROR_DISCOVER   = 1 << 3;
    static ERROR_XML        = 1 << 4;

    constructor(defaults = {}) {
        Object.keys(defaults).forEach((k) => { this[k] = defaults[k] });

        if(this.source && !this.source.includes('://'))
            this.source = 'https://' + this.source;

        // Ensure we do not loose the original source URL on bogus HTTP redirects
        if (!this.orig_source)
            this.orig_source = this.source;
    }

    serialize() {
        return {
            id               : this.id,
            title            : this.title,
            description      : this.description,
            homepage         : this.homepage,
            icon             : this.icon,
            source           : this.source,
            orig_source      : this.orig_source,
            last_updated     : this.last_updated,
            last_updated_favicon : this.last_updated_favicon,
            unreadCount      : this.unreadCount,
            metadata         : this.metadata,
            type             : this.type
        };
    }

    #updateStatus(msg) {
        console.log(`Feed status update(${this.source}): ${msg}`);
        this.feedStatusMsg = msg;
        ev.dispatch('feedUpdating', { id: this.id });
    }

    async update(force = false) {
        let updateInterval = await Settings.get('feedreader:::refreshInterval');
        const updateIntervalUnit = await Settings.get('feedreader:::refreshIntervalUnit');

        console.log(`Feed update(${this.source}, force=${force}) with interval ${updateInterval} ${updateIntervalUnit}`);

        if (updateIntervalUnit === 'hours') {
            updateInterval *= 60 * 60;
        } else if (updateIntervalUnit === 'days') {
            updateInterval *= 60 * 60 * 24;
        } else {
            console.error(`Unknown update interval unit: ${updateIntervalUnit}`);
            return;
        }

        // Force update by resetting last_updated
        if (force) {
            this.#updateStatus(`Forcing update of ${this.source}`);
            this.last_updated = 0;
            this.last_updated_favicon = 0;
        }
        
        // Do not update too often
        if (this.last_updated && (Date.now() / 1000 - this.last_updated < updateInterval)) {
            console.log(`Feed Skipping update of ${this.source} (last updated ${Math.ceil(Date.now() / 1000 - this.last_updated)}s ago)`);
            return;
        }

        let f = await FeedUpdater.fetch(this.source);
        if (Feed.ERROR_DISCOVER == f.error) {
            console.log(`Feed trying autodiscovery for original source ${this.orig_source}`);
            const text = await fetch(this.orig_source).then((resp) => resp.text());
            const links = linkAutoDiscover(text, this.orig_source);
            if (links.length > 0) {
                console.log(`Feed changing source to ${links[0]}`);
                this.source = links[0];
                f = await FeedUpdater.fetch(this.source);
            } else {
                this.#updateStatus(`Feed update failed: Source is not a feed`);
                return;
            }
        }
        if (Feed.ERROR_NONE == f.error) {
            let added = 0;

            this.title = f.title;
            this.source = f.source;
            this.homepage = f.homepage;
            this.description = f.description;
            this.metadata = f.metadata;
            this.icon = f.icon;
            this.iconData = f.iconData;

            let items = await this.getItems();           

            for (const i of f.newItems) {
                const isDuplicate = items.some(x => 
                    x.sourceId === i.sourceId || 
                    x.source === i.source || 
                    x.title === i.title
                );
                if (isDuplicate)
                    return;

                added++;

                const newItem = new Item(i);
                newItem.read = false;
                newItem.nodeId = this.id;
                await newItem.save();
            }

            items = await this.getItems();
            this.updateUnread(items.filter((i) => !i.read).length - this.unreadCount);
            
            if(added > 0)
                ev.dispatch('itemsAdded', this);

            // FIXME: truncate set of items to match max per-feed cache size

            // Do not update too often (hard-coded 30 * updateInterval)
            if ((Date.now() / 1000 - this.last_updated_favicon > 30*updateInterval)) {
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
                        this.setIcon(data);
                        console.log(`Favicon update for ${this.source} (${this.icon}) was successful`);
                    } else {
                        console.warn(`Favicon update for feed ${this.id} failed`);
                    }
                    this.last_updated_favicon = Date.now() / 1000;
                } else {
                    console.warn(`Favicon response for feed ${this.id} failed`);
                }
            } else {
                console.info(`Favicon ${this.id} does need no update`);
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
        if (!item.time)
            item.time = Date.now();

        // FIXME: set an id if sourceId is missing
        
        this.newItems.push(item);
    }

    updateUnread(count) {
        this.unreadCount += count;
        if (this.unreadCount < 0)
            this.unreadCount = 0;

        if(this.parent.updateUnread)
            this.parent.updateUnread(count);

        ev.dispatch('nodeUpdated', this);
    }

    async markAllRead() {
        const items = await this.getItems();
        items.forEach((i) => i.setRead(true));
        this.updateUnread(-this.unreadCount);
    }

    setIcon(data) {
        this.iconData = data;
        DB.set('aggregator', 'favicons', `feed_${this.id}`, data);
    }

    async loadIcon() {
        if (this.iconData)
            return;

        this.iconData = await DB.get('aggregator', 'favicons', `feed_${this.id}`, undefined);
        console.log(this);
    }
}