// vim: set ts=4 sw=4:

import { Feed } from '../www/js/feedreader/feed'
import { FeedUpdater } from '../www/js/feedreader/feedupdater';
import { TestData } from './testdata.js';

test('FeedUpdater.fetch', async () => {
    let f = await FeedUpdater.fetch('http://rss.slashdot.org/Slashdot/slashdotMain');
    expect(f !== undefined).toBe(true);
    expect(f.title).toBe('Slashdot');
    expect(f.source).toBe('http://rss.slashdot.org/Slashdot/slashdotMain');
    expect(f.last_updated - Date.now() / 1000 < 10000).toBe(true);
    expect(f.error).toBe(Feed.ERROR_NONE);
    expect(f.icon).toBe('https://slashdot.org//favicon.ico');
    expect(f.newItems[0].title).toBe('WordPress Blogs Can Now Be Followed in the Fediverse, Including Mastodon');
});