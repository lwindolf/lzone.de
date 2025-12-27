// vim: set ts=4 sw=4:

import { Config } from '../config.js';

import * as r from '../helpers/render.js';

// A view integrating the rss-finder web component and allowing
// to subscribe to discovered feeds using web+feed: custom scheme links

export class DiscoverView {
    constructor(el) {
        import(Config.rssFinderUrl).then(() => {
            r.renderElement(el, r.template(`
                <h1>Discover Feeds</h1>

                <x-rss-finder show-title="false" scheme="web+feed:" icon-path="${Config.rssFinderUrl.replace('js/widget.js','icons')}" target="_self"></x-rss-finder>
            `), {});
        });

        // register protocol handler for feed subscription links
        // provided by rss-finder component
        navigator.registerProtocolHandler(
            'web+feed',
            '/?url=%s#/-/Feeds/Add'
        );
    }
}