// vim: set ts=4 sw=4:

// Item rendering view

import { DateParser } from './parsers/date.js';
import { Item } from './item.js';
import { View } from '../helpers/View.js';

export class ItemView extends View {
    constructor(root) {
        super({
            root,
            template: `
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
            `,
            dataEvents: [
                "itemSelected"
            ],
            mapper: async (data) => {
                const item = await Item.getById(data.id);
                return {
                    item,
                    time: DateParser.getShortDateStr(item.time)
                };
            },
            postRender: async (data) => {
                const item = await Item.getById(data.id);

                /* Set title for it to appear in e.g. desktop MPRIS playback controls 
                Do not do it if there is no media as a constantly changing tab title
                (when paging through items) is visually distracting */
                if(item.title && item.media && item.media.length > 0)
                    window.title = window.Config.siteName + " | " + item.title;

                root.ownerDocument.getElementById('itemViewContent').scrollIntoView({ block: 'start' });

                // Feed info and item view share the same screen area, only one must be visible at any time
                root.ownerDocument.getElementById('itemViewContent').style.display = 'block';
                root.ownerDocument.getElementById('feedViewContent').style.display = 'none';

            }
        });
    }
}