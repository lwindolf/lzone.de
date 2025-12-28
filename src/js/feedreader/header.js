// vim: set ts=4 sw=4:

// Header rendering view (mobile only)

import { FeedList } from './feedlist.js';
import { template, render } from '../helpers/render.js';

export class HeaderView {
    static #template = template(`
        {{#compare view '==' 'feedlist' }}
                <span class='title'>Feeds</span>
                <span class='addBtn'>+ Add</span>
        {{/compare}}

        {{#compare view '==' 'itemlist' }}
                <span class='switchView' data-view='feedlist'>&lt;</span>
                <a class='title' target='_system' href='{{node.homepage}}'>{{node.title}}</a>
                {{#if node.icon}}
                        <img class='icon' src='{{node.icon}}'/>
                {{/if}}
        {{/compare}}

        {{#compare view '==' 'item' }}
                <span class='switchView' data-view='itemlist'>&lt;</span>
                <a class='title' target='_system' href='{{node.homepage}}'>{{node.title}}</a>
                {{#if node.icon}}
                        <img class='icon' src='{{node.icon}}'/>
                {{/if}}
        {{/compare}}
    `);

    static update = (view) =>
        render('#header', HeaderView.#template, {
                node: FeedList.getNodeById(FeedList.getSelectedId()),
                view
        });
}