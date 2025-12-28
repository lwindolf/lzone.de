// vim: set ts=4 sw=4:

// https://www.jsonfeed.org/version/1.1/

import { DateParser } from './date.js';
import { Feed } from '../feed.js';
import { Item } from '../item.js';

class JSONFeedParser {
    static id = 'json';

    static parseItem(i) {
        let item = new Item({
            title       : i.title,
            description : i.content_html || i.content_text || i.summary,
            time        : DateParser.parse(i.updated || i.date_published),
            sourceId    : i.id,
            source      : i.url || i.external_url
        });

        if (i.attachments && Array.isArray(i.attachments))
            i.attachments.forEach(n => item.addMedia(n.url, n.mime_type));

        this.addItem(item);
    }

    static parse(str) {
        const data = JSON.parse(str);

        let feed = new Feed({
            type        : this.id,
            title       : data.title,
            icon        : data.icon || data.favicon,
            description : data.description,
            homepage    : data.home_page_url || data.feed_url
        });

        if (data.items && Array.isArray(data.items))
                data.items.forEach(this.parseItem, feed);

        return feed;
    }
}

export { JSONFeedParser };