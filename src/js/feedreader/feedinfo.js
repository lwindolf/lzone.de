// vim: set ts=4 sw=4:

// Feed info rendering

import { FeedList } from './feedlist.js';
import { View } from '../helpers/View.js';

export class FeedInfo extends View {   
    constructor(root) {
        super({
            root,
            template: `
                <h1 id='itemViewContentTitle'>
                    <a target='_system' href='{{feed.homepage}}'>{{feed.title}}</a>
                </h1>

                <p>
                    Source: <a target='_system' href='{{feed.source}}'>{{feed.source}}</a><br>
                </p>

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

                        {{#unless feed.allowCorsProxy}}
                            {{#compare feed.error '==' 2}}
                                <p>Downloads often do not work due to <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS">CORS restrictions</a>.
                                You might want to use the Cloudflare CORS proxy (<a href="https://corsproxy.io">corsproxy.io</a>) for this feed.</p>
                                <button class='btn' data-action='feedreader:allowCorsProxy' data-id='{{feed.id}}' data-global='false'>Use proxy for this feed</button>
                                <button class='btn' data-action='feedreader:allowCorsProxy' data-id='{{feed.id}}' data-global='true'>Use proxy for all feeds</button>
                            {{/compare}}
                        {{/unless}}
                    </div>
                {{/if}}
                </div>

                <p>{{{feed.description}}}</p>

                {{#if feed.feedStatusMsg}}
                    <div class='feedInfoStatus'>
                        <span>{{feed.feedStatusMsg}}</span>
                    </div>
                {{/if}}
                Last updated: <span class='feedLastUpdated'>{{lastUpdated}}</span><br>
                <button class='btn' data-action='feedreader:updateNode' data-id='{{feed.id}}'>Update Now</button>
            `,
            updateEvents: [
                'nodeUpdated',
                'feedUpdating'
            ],
            dataEvents: [
                'feedSelected'
            ],
            mapper: async (data) => {
                console.log("render feedinfo", data.id)
                const feed = FeedList.getNodeById(data.id);
                if (!feed)
                    return {};
                return {
                    feed,
                    lastUpdated: feed.last_updated ? new Date(feed.last_updated * 1000).toLocaleString() : 'never'
                }
            },
            postRender: () => {
                // Feed info and item view share the same screen area, only one must be visible at any time
                root.ownerDocument.getElementById('itemViewContent').style.display = 'none';
                root.ownerDocument.getElementById('feedViewContent').style.display = 'block';
            }
        });
    }
}