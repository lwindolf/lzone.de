// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { Action } from '../Action.js';

import * as r from '../helpers/render.js';

// A view integrating the rss-finder web component

export class DiscoverView {
    constructor(el) {
        import(Config.rssFinderUrl).then(() => {
            r.renderElement(el, r.template(`
                <h1>Discover Feeds</h1>

                <x-rss-finder show-title="false" subscribe-method="event" icon-path="${Config.rssFinderUrl.replace('js/widget.js','icons')}" target="_self"></x-rss-finder>
            `), {});

            document.addEventListener('rss-finder-subscribe', (ev) =>
                Action.dispatch('feedreader:addFeed', {
                    title  : "New Feed",
                    source : ev.detail.url
                })
            );
        });
    }
}