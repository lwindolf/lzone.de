// vim: set ts=4 sw=4:

// Download, parse and auto-discover feeds

import { parserAutoDiscover } from './parsers/autodiscover.js';
import { Favicon } from './parsers/favicon.js';
import { Feed } from './feed.js';

export class FeedUpdater {
    // returns a feed properties or at least error code (e.g. "{ error: Feed.ERROR_XML }")
    // result should be merged into the feed being updated
    static async fetch(url, allowCorsProxy = false) {
        let cors = false;

        console.log(`feedupdater updating ${url}`);

        // Preflight check to detect CORS issues before attempting full fetch
        // This allows showing end user info about CORS preventing feed updates
        try {
            const resp = await fetch(url, { method: 'HEAD', mode: 'cors' });
            if(null == resp)
                cors = true;
        } catch (e) {
            cors = true;
        }

        if (cors) {
            if (allowCorsProxy) {
                console.log(`feedupdater will retry with CORS proxy for ${url}`);
            } else {
                console.log(`feedupdater CORS blocked for ${url}, not fetching`);
                return new Feed({ error: Feed.ERROR_NET_CORS });
            }
        }

        /* No etag/last_modified handling here, as this is done by the browser networking.
           We can update as often as we want without worrying about caching. */
        let feed = await fetch(url, { allowCorsProxy })
            .then(async (response) => {
                console.log('feedupdater headers', response.headers);
                return await response.text();
            })
            .then(async (text) => {
                let parser = parserAutoDiscover(text, url);
                if (!parser) {
                    console.log(`feedupdater No suitable parser found for ${url}`);
                    return new Feed({ error: Feed.ERROR_DISCOVER });
                } else {
                    console.log('feedupdater using parser', parser);
                }

                let feed = parser.parse(text);
                if (!feed) {
                    console.log(`feedupdater Failed to parse feed from ${url}`);
                    return new Feed({ error: Feed.ERROR_XML });
                }
                feed.source = url;
                feed.last_updated = Date.now() / 1000;
                feed.error = Feed.ERROR_NONE;

                if (!feed.icon && feed.homepage)
                    try {
                        console.log('feedupdater no icon in feed, starting favicon autodiscovery')
                        feed.icon = await Favicon.discover(feed.homepage, { allowCorsProxy });
                    } catch (e) {
                        // ignore
                    }
                return feed;
            })
            .catch((e) => {
                console.log(`feedupdater Failed to download feed from ${url}`, e);

                // FIXME: provide HTTP status too
                return new Feed({ error: Feed.ERROR_NET });
            });

        console.log('feedupdater result', feed);
        return feed;
    }
}