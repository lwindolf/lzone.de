// vim: set ts=4 sw=4:

// Subscribing to news feeds dialog

import { Action } from '../helpers/Action.js';
import { ModalDialog } from '../helpers/modal-dialog.js';

export class SubscribeFeedDialog extends ModalDialog {
    constructor(parentId) {
        import(/* webpackIgnore: true */window.Config.rssFinderUrl); // FIXME: possible race condition
        super(`
            {{#unless discover}}
                <h2>Subscribe to Feed</h2>

                <p>
                    <div>
                        <input type='hidden' name='parentId' value='{{parentId}}'/>
                        <input type='text' name='url' width='100%' placeholder='URL'/>
                        <button>Subscribe</button>
                    </div>
                    {{#if error}}
                        <div>Error: {{error}}</div>
                    {{/if}}
                </p>

                <p>Or discover feeds from the different sources...</p>

                <button class="btn">Discover Feeds</button>
            {{else}}
                <h2>Discover Feeds</h2>

                <x-rss-finder show-title="false" subscribe-method="event" icon-path="${window.Config.rssFinderUrl.replace('js/widget.js','icons')}" target="_self"></x-rss-finder>
            {{/unless}}
            `,
            {
                parentId
            },
            async (data, el) => {
                if(el.innerText === "Discover Feeds") {
                    this.setData({
                        parentId: data.parentId,
                        discover: true
                    });
                    return false;
                }

                Action.dispatch('feedreader:addFeed', {
                    parentId: data.parentId,
                    source: data.url,
                    title: "New Subscription"
                });
                return true;
            }
        );
    }
}
