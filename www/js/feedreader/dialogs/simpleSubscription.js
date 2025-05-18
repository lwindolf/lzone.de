// vim: set ts=4 sw=4:

// Basic subscription dialog (just a URL entry)

import { Feed } from '../feed.js';
import { FeedList } from '../feedlist.js';
import { Dialog } from '../helpers/dialog.js';
import { linkAutoDiscover, parserAutoDiscover } from '../parsers/autodiscover.js';
import { pfetch } from '../net.js';

class SimpleSubscriptionDialog extends Dialog {
    constructor() {
        let d = super(`
            <h2>Add new subscription</h2>
            <input name='url' type='text' autofocus placeholder='Website or feed URL'/>
            <input type='submit' value='Add'/>

            {{#if error}}
            <div>Error: {{error}}</div>
            {{/if}}
        `,
        { /* no initial data */ },
        async (result) => {
            let links = [], str;

            if(-1 == result.url.indexOf('://'))
                result.url = 'https://' + result.url;

            console.info(`Trying to subscribe to ${result.url}`);

            // Fetch content the URL points to
            try {
                str = await pfetch(result.url).then((response) => response.text());
            } catch (e) {
                result['error'] = 'URL download failed!'
                d.update(result);
                return false;
            }

            // First check if the URL is a real feed
            if(parserAutoDiscover(str, result.url)) {
                // If this is the case just use the URL
                links.push(result.url);
            } else {   
                // Alternatively we assume it is a HTML document and search for links
                links = linkAutoDiscover(str, result.url);
            }

            // FIXME: let user choose which feed to use
            if(links.length > 0) {
                FeedList.add(new Feed({
                    title: 'New Feed',
                    id: FeedList.maxId + 1,
                    source: links[0]
                }));
                return true;
            }

            // FIXME: use error infos like in feedinfo widget
            result['error'] = 'Feed auto discovery failed!'
            d.update(result);
            return false;
        });
    }
}

export { SimpleSubscriptionDialog };