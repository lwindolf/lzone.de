// vim: set ts=4 sw=4:

// Feed info rendering widget, can appear in two places
//
// - single pane layout: as an error box on top of the item list
// - 3 pane layout: in the item view

import { DB } from './db.js';
import { FeedList } from './feedlist.js';
import { template, render } from '../helpers/render.js';
import * as ev from '../helpers/events.js';

export class FeedInfo {
    static #errorTemplate = template(`
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
    `);
    static #contentTemplate = template(`
        <h1 id='itemViewContentTitle'>
            <a target='_system' href='{{feed.homepage}}'>{{feed.title}}</a>
        </h1>
    
        <p>{{{feed.description}}}</p>

        <div class='feedInfoError'></div>
    `);

    constructor() {
        document.addEventListener('feedSelected', (e) => {
            let feed = FeedList.getNodeById(e.detail.id);

            render('#itemViewContent', FeedInfo.#contentTemplate, { feed });
            render('#itemViewContent .feedInfoError', FeedInfo.#errorTemplate, { feed });
            
            ev.connect('click', '.btn#enableCors', async () => {
                feed.corsProxyAllowed = true;
                await feed.update();
            });
            ev.connect('click', '.btn#enableCorsGlobal', async () => {
                await DB.set('config', 'corsProxyAllowed', true);
                await feed.update();
            });
        });
    }
}