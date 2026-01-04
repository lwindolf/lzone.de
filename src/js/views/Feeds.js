// vim: set ts=4 sw=4:

import * as r from '../helpers/render.js';
import { Action } from '../helpers/Action.js';
import { FeedList } from '../feedreader/feedlist.js';
import { linkAutoDiscover, parserAutoDiscover } from '../feedreader/parsers/autodiscover.js';

// A view giving an overview on feed subscriptions
// and allows adding/removing feeds

export class FeedsView {
    // state
    #el;
    #subscribeStatus;
 
    static #template = r.template(`
        <h1>Folder "Feeds"</h1>
    `);

    constructor(el) {
        this.#el = el;

        if(document.location.hash.startsWith('#/-/Feeds/Add')) {
            let url = document.location.search.split('url=')[1] || 'unknown';
            url = decodeURIComponent(url);
            url = url.replace(/^web\+feed:/, '');
            this.#subscribe(url);
        } else {
            this.#render();
        }

        // register protocol handler for feed subscription links
        // provided by rss-finder component
        navigator.registerProtocolHandler(
            'web+feed', 
            '/?url=%s#/-/Feeds/Add'
        );
    }

    async #render() {
        r.renderElement(this.#el, FeedsView.#template, {
            tree : FeedList.root.children
        });
    }

    static #subscribeTemplate = r.template(`
        <h1>Adding new subscription</h1>


        {{#if fetching}}
            <p>
                Searching for feed from URL: <span class='url'>{{url}}</span> ...
            </p>
        {{else}}
            <input name='url' type='text' value='{{url}}' autofocus placeholder='Website or feed URL'/>
            <input type='submit' value='Add'/>

            {{#if result}}
                <p>
                    ✅ Successfully subscribed to feed: <a href='{{result}}'>{{result}}</a>.
                </p>
            {{/if}}
            {{#if error}}
                <p>
                    <div>⛔ Error: {{error}}</div>
                </p>
            {{/if}}
        {{/if}}
    `);

    async #updateSubscribeStatus(newStatus) {
        this.#subscribeStatus = { ...this.#subscribeStatus, ...newStatus };
        r.renderElement(this.#el, FeedsView.#subscribeTemplate, this.#subscribeStatus);

        // allow correcting the URL
        this.#el.querySelector('input[type=submit]')?.addEventListener('click', (e) => {
            e.preventDefault();
            const url = this.#el.querySelector('input[name=url]').value.trim();
            if (url) {
                this.#subscribe(url);
            } else {
                this.#updateSubscribeStatus({
                    error : 'Please provide a URL!'
                });
            }
        });
    }

    async #subscribe(url) {
        this.#updateSubscribeStatus({
            fetching: true,
            url
        });

        let links = [], str;

        if(-1 == url.indexOf('://'))
            url = 'https://' + url;

        console.info(`Trying to subscribe to ${url}`);
        
        try {
            // Fetch content the URL points to
            str = await fetch(url).then((response) => response.text());
        } catch (e) {
            console.error(`Error fetching URL %s`, url, e);
            this.#updateSubscribeStatus({
                fetching : false,
                error    : 'URL download failed!'
            });
            return;
        }
        
        try {
            // First check if the URL is a real feed
            if(parserAutoDiscover(str, url)) {
                // If this is the case just use the URL
                links.push(url);
            } else {   
                // Alternatively we assume it is a HTML document and search for links
                links = linkAutoDiscover(str, url);
            }
        } catch (e) {
            this.#updateSubscribeStatus({
                fetching : false,
                error    : 'Parsing failed!'
            });
            return;
        }

        // FIXME: let user choose which feed to use
        if(links.length > 0) {
            Action.dispatch('feedreader:addFeed', {
                title  : "New Feed",
                source : links[0]
            });
            this.#updateSubscribeStatus({
                fetching : false,
                result   : links[0],
                error    : null
            });
            return;
        }

        // FIXME: use error infos like in feedinfo widget
        this.#updateSubscribeStatus({
            fetching : false,
            error    : 'Feed auto discovery failed!'
        });
    }

}