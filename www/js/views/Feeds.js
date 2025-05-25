// vim: set ts=4 sw=4:

import { FeedList } from '../feedreader/feedlist.js';
import * as r from '../helpers/render.js';
import * as ev from '../helpers/events.js';

// A view giving an overview on installed and installable cheat sheets
// and allows adding/removing cheat sheets

export class FeedsView {
    // state
    #el;

    static #template = r.template(`
        <h1>Folder "Feeds"</h1>

        <h2>Subscriptions</h2>

        <p>
            <div id='installedSections'>
            {{#each tree }}
                    <div class='installed'>
                        <button data-section='{{ this.id }}'>Remove</button>
                        <a href="{{ this.orig_source }}">{{ this.title }}</a>
                    </div>
            {{/each}}
            </div>
        </p>

        <h2>Add new feed</h2>
        
        <p>
            Either drag&drop a link into the feed list or provide the feed / 
            website URL:

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
    `);

    constructor(el) {
        this.#el = el;
        this.#render();
    }

    async #render() {
        console.log(FeedList.root);
        r.renderElement(this.#el, FeedsView.#template, {
            tree       : FeedList.root.children
        });

        ev.connect('click', '#customInstall button', (e) => {
            console.log('Subscribe to feed', e.target);
        });

        ev.connect('click', '.installed button', async (e) =>
            FeedList.remove(e.getAttribute('data-id')));
        
    }
}