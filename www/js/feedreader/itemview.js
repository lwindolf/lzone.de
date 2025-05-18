// vim: set ts=4 sw=4:

// Item rendering view

import { DateParser } from './parsers/date.js';
import { FeedList } from './feedlist.js';
import { Layout } from './layout.js';
import { template, render } from '../helpers/render.js';
import * as ev from '../helpers/events.js';

export class ItemView {
    static #headerTemplate = template(`
        <span class='switchView' data-view='{{view}}'>&lt;</span>
        <a class='title' target='_system' href='{{node.homepage}}'>{{node.title}}</a>
        {{#if node.icon}}
            <img class='icon' src='{{node.icon}}'/>
        {{/if}}
    `);
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

        render('#itemViewTitle', ItemView.#headerTemplate, { node: node, view: 'itemlist' });
        render('#itemViewContent', ItemView.#contentTemplate, { item: item, time: DateParser.getShortDateStr(item.time) });

        document.getElementById('itemViewContentTitle').scrollIntoView({ block: 'start' });
    }

    static #showLink(link, visible) {
        /*document.getElementById('linkHover').innerText = link;
        document.getElementById('linkHover').style.display = visible?'block':'none';*/
    }

    constructor() {
        document.addEventListener('itemSelected', (e) => ItemView.#loadItem(e.detail.feed, e.detail.id));

        // eslint-disable-next-line no-undef
        if (!Layout.isMobile()) {
            ev.connect('mouseover', 'a', (el) => ItemView.#showLink(el.getAttribute('href'), true));
            ev.connect('mouseout',  'a', (el) => ItemView.#showLink(el.getAttribute('href'), false));
        }
    }
}