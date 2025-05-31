// vim: set ts=4 sw=4:

// Item rendering view

import { DateParser } from './parsers/date.js';
import { FeedList } from './feedlist.js';
import { template, render } from '../helpers/render.js';

export class ItemView {
    static #contentTemplate = template(`
        <h1 id='itemViewContentTitle'>
            <a target='_system' href='{{item.source}}'>{{item.title}}</a>
        </h1>
        <span class='date'>{{time}}</span>
        <div class='date'></div>
    
        <p>{{{item.description}}}</p>

        {{#each item.media}}
            {{#contains 'audio' mime }}
                <audio controls preload='none' src='{{ url }}'></audio>
            {{/contains}}
            {{#contains 'video' mime }}
                <video controls preload='none' src='{{ url }}'></video>
            {{/contains}}
        {{/each}}
    `);

    // load content of a single item
    static #loadItem(feedId, id) {
        let node = FeedList.getNodeById(feedId);
        let item = node.getItemById(id);

        render('#itemViewContent', ItemView.#contentTemplate, { item: item, time: DateParser.getShortDateStr(item.time) });

        document.getElementById('itemViewContentTitle').scrollIntoView({ block: 'start' });
    }

    constructor() {
        document.addEventListener('itemSelected', (e) => ItemView.#loadItem(e.detail.feed, e.detail.id));
    }
}