// vim: set ts=4 sw=4:

// Feed info rendering

import { Settings } from '../models/Settings.js';
import { FeedList } from './feedlist.js';
import { template, render } from '../helpers/render.js';
import * as ev from '../helpers/events.js';

export class FeedInfo {   
    static #contentTemplate = template(`
        <h1 id='itemViewContentTitle'>
            <a target='_system' href='{{feed.homepage}}'>{{feed.title}}</a>
        </h1>

        <p>
            Source: <a target='_system' href='{{feed.source}}'>{{feed.source}}</a><br>
        </p>
    
        <p>{{{feed.description}}}</p>

        <div class='feedInfoError'>
        {{#if feed.error}}
            <div class='feedInfoErrorBox'>
                <span>There was a problem when fetching this subscription!</span>
                <ul>
                    <li>
                        {{#compare feed.error '==' 1}}⛔{{/compare}}
                        {{#compare feed.error '>'  1}}✅{{/compare}}
                        <span>1. Authentication</span>
                    </li>
                    <li>
                        {{#compare feed.error '==' 2}}⛔{{/compare}}
                        {{#compare feed.error '>'  2}}✅{{/compare}}
                        {{#compare feed.error '<'  2}}⬜{{/compare}}
                        <span>2. Download</span>
                    </li>
                    <li>
                        {{#compare feed.error '==' 4}}⛔{{/compare}}
                        {{#compare feed.error '>'  4}}✅{{/compare}}
                        {{#compare feed.error '<'  4}}⬜{{/compare}}
                        <span>3. Feed Discovery</span>
                    </li>
                    <li>
                        {{#compare feed.error '==' 8}}⛔{{/compare}}
                        {{#compare feed.error '<'  8}}⬜{{/compare}}
                        <span>4. Parsing</span>
                    </li>
                </ul>    

                {{#unless feed.corsProxyAllowed}}
                    {{#compare feed.error '==' 2}}
                        <p>Downloads often do not work due to <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS">CORS restrictions</a>.
                        You might want to use the Cloudflare CORS proxy (<a href="https://corsproxy.io">corsproxy.io</a>) for this feed.</p>
                        <button class='btn' data-feed-id='{{feed.id}}' id='enableCors'>Use proxy for this feed</button>
                        <button class='btn' id='enableCorsGlobal'>Use proxy for all feeds</button>
                    {{/compare}}
                {{/unless}}
            </div>
        {{/if}}
        </div>

        Last updated: <span class='feedLastUpdated'>{{lastUpdated}}</span><br>
        <button class='btn' id='feedUpdate'>Update Now</button>
    `);

    constructor() {
        document.addEventListener('nodeUpdated', (e) => {
            const el = document.getElementById('itemViewContent');
            if ((e.detail.id == parseInt(el.dataset.id)) &&
                (el.dataset.mode === 'feed'))
                this.#render(e.detail.id)
        });
        document.addEventListener('feedSelected', (e) => this.#render(e.detail.id));
    }

    #render(id) {
        let feed = FeedList.getNodeById(id);

        document.getElementById('itemViewContent').dataset.mode = "feed";
        document.getElementById('itemViewContent').dataset.id = id;

        render('#itemViewContent', FeedInfo.#contentTemplate, {
            feed,
            lastUpdated: feed.last_updated ? new Date(feed.last_updated * 1000).toLocaleString() : 'never'
        });
        
        ev.connect('click', '#feedUpdate', async () => {
            const button = document.querySelector('#feedUpdate');
            button.disabled = true;
            button.textContent = 'Updating...';
            await feed.forceUpdate();
        });
        ev.connect('click', '.btn#enableCors', async () => {
            FeedList.allowCorsProxy(feed.id, true);
            await feed.update();
        });
        ev.connect('click', '.btn#enableCorsGlobal', async () => {
            await Settings.set('corsProxyAllowed', true);
            await feed.update();
        });
    }
}