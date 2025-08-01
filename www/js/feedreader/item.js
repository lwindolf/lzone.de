// vim: set ts=4 sw=4:

import { DB } from '../models/DB.js';
import * as ev from '../helpers/events.js';

// DAO for items
//
// emits
// - itemUpdated(item)

export class Item {
        // maximum id currently used
        static maxId = 0;

        // state
        id = 0;
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

                if(Number.isInteger(this.id) && this.id > Item.maxId)
                    Item.maxId = this.id;

                if(0 === this.id) {
                    Item.maxId++;
                    this.id = Item.maxId;
                }
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

        setRead(read) {
            if (this.read === read)
                return;

            this.read = read;
            this.save();
            ev.dispatch('itemUpdated', this);
        }

        static getById = async (itemId) => new Item(await DB.get('aggregator', 'items', itemId));

        save = async () => await DB.set('aggregator', 'items', this.id, {
            id          : this.id,
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
}