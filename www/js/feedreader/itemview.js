// vim: set ts=4 sw=4:

// Item rendering view

import { Config } from '../config.js';
import { DateParser } from './parsers/date.js';
import { Item } from './item.js';
import { template, render } from '../helpers/render.js';

export class ItemView {
    static #contentTemplate = template(`
        <h1 id='itemViewContentTitle'>
            {{#if item.title}}
                <a target='_system' href='{{item.source}}'>{{item.title}}</a>
            {{else}}
                <a target='_system' class='missingTitle' href='{{item.source}}'>Link to post</a>
            {{/if}}
        </h1>

        <span class='date'>{{time}}</span>
        <div class='date'></div>
    
        {{#each item.media}}
            {{#contains 'audio' mime }}
                <audio controls preload='none' src='{{ url }}'></audio>
            {{/contains}}
            {{#contains 'video' mime }}
                <video controls preload='none' src='{{ url }}'></video>
            {{/contains}}
        {{/each}}

        <p>{{{item.description}}}</p>
    `);

    // load content of a single item
    static async #loadItem(id) {
        const item = await Item.getById(id);

        /* Set title for it to appear in e.g. desktop MPRIS playback controls */
        if(item.title && item.media && item.media.length > 0)
            document.title = Config.siteName + " | " + item.title;

        render('#itemViewContent', ItemView.#contentTemplate, { item, time: DateParser.getShortDateStr(item.time) });

        document.getElementById('itemViewContent').dataset.set("mode", "item");
        document.getElementById('itemViewContent').dataset.set("id", id);
        document.getElementById('itemViewContent').scrollIntoView({ block: 'start' });
    }

    constructor() {
        document.addEventListener('itemSelected', (e) => ItemView.#loadItem(e.detail.id));
    }
}