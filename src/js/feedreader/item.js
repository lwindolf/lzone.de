// vim: set ts=4 sw=4:

import { DB } from '../models/DB.js';
import * as ev from '../helpers/events.js';

// DAO for items
//
// emits
// - itemUpdated(item)

export class Item {
    // state
    id = undefined;
    nodeId = 0;
    read = false;
    starred = false;

    // item content
    title;
    description;
    time;
    source;
    sourceId;
    media = [];     // list of media content attached
    metadata = {};

    constructor(defaults) {
        Object.keys(defaults).forEach((k) => { this[k] = defaults[k] });
    }

    /**
     * Add a media enclosure to the item
     * 
     * @param {*} url       valid URL
     * @param {*} mime      MIME type or 'audio' or 'video'
     * @param {*} length    (optional) duration in [s]
     */
    addMedia(url, mime, length = NaN) {
        let l = NaN;
        
        try {
            l = parseInt(length, 10);
        // eslint-disable-next-line no-empty
        } catch { }

        if(!url || !mime)
            return;

        /* gravatars are often supplied as media:content with medium='image'
            so we do not treat such occurences as enclosures */
        if (-1 !== url.indexOf('www.gravatar.com'))
            return;

        /* Never add enclosures for images already contained in the description */
        if (this.description && -1 !== this.description.indexOf(url))
            return;

        this.media.push({ url, mime, length: l });
    }

    async setRead(read) {
        if (this.read === read)
            return;

        this.read = read;
        await this.save();
        ev.dispatch('itemUpdated', this);
    }

    async setStarred(starred) {
        if (this.starred === starred)
            return;

        this.starred = starred;
        await this.save();
        ev.dispatch('itemUpdated', this);
    }

    static async getById(itemId) {
        const data = await DB.getById('aggregator', 'items', itemId);
        if (!data)
            throw new Error(`item with id ${itemId} not found`);

        return new Item(data);
    }

    async save() {
        if(!this.nodeId)
            console.error("item save(): nodeId is not set!", this);

        try {
            const resultId = await DB.set('aggregator', 'items', this.id, {
                nodeId      : this.nodeId,
                read        : this.read,
                starred     : this.starred,
                title       : this.title,
                description : this.description,
                time        : this.time,
                source      : this.source,
                sourceId    : this.sourceId,
                media       : this.media,
                metadata    : this.metadata
            });
            if(!this.id)
                this.id = resultId;
        } catch (error) {
            console.error("item save(): error saving item", error);
        }
    }
}