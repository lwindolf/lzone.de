// vim: set ts=4 sw=4:

import * as r from '../helpers/render.js';
import * as ev from '../helpers/events.js';
import { Feed } from '../feedreader/feed.js';
import { FeedList } from '../feedreader/feedlist.js';
import { linkAutoDiscover, parserAutoDiscover } from '../feedreader/parsers/autodiscover.js';
import { pfetch } from '../feedreader/net.js';

// A view giving an overview on feed subscriptions
// and allows adding/removing feeds

export class FeedsView {
    // state
    #el;
    #subscribeStatus;
 
    static #template = r.template(`
        <h1>Folder "Feeds"</h1>

        FIXME: 🚧 This page is work in progress, it does not work yet completely!

        <h2>Subscriptions</h2>

        <p>
            <div id='installedSections'>
            {{#each tree }}
                    <div class='installed'>
                        <button data-id='{{ this.id }}'>Remove</button>
                        <a href="{{ this.orig_source }}">{{ this.title }}</a>
                    </div>
            {{/each}}
            </div>
        </p>

        <h2>Add subscription</h2>
        
        <p>
            Please provide the feed / website URL:

            <div id='customInstall'>
                <table>
                    <tr>
                        <td>URL:</td>
                        <td><input type='text' width='100%' id='url' placeholder='URL'/></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><button class="btn">Subscribe</button></td>
                    </tr>
                    {{#if error}}
                    <tr>
                        <td>
                            <div>Error: {{error}}</div>
                        </td>
                    </tr>
                    {{/if}}
                <table>
            </div>
        </p>

        <h2>Discover Feeds</h2>

        <iframe src='https://lwindolf.github.io/rss-finder?show-title=false' width='100%' height='500px' frameborder='0'>
        </iframe>
    `);

    constructor(el) {
        this.#el = el;
        this.#render();
    }

    async #render() {
        r.renderElement(this.#el, FeedsView.#template, {
            tree       : FeedList.root.children
        });

        ev.connect('click', '#customInstall button', () => {
            const url = document.querySelector('#customInstall input#url').value.trim();
            this.#subscribe(url);
        });

        ev.connect('click', '.installed button', async (e) => {
            FeedList.remove(e.getAttribute('data-id'));
            this.#render();
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
            str = await pfetch(url).then((response) => response.text());
        } catch (e) {
            console.error(`Error fetching URL ${url}:`, e);
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
            FeedList.add(new Feed({
                title: 'New Feed',
                id: FeedList.maxId + 1,
                source: links[0]
            }));
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