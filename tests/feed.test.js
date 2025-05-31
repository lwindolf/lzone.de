// vim: set ts=4 sw=4:

import { Feed } from '../www/js/feedreader/feed';
import { Item } from '../www/js/feedreader/item';
import { TestData } from './testdata.js';

const mockFeed = new Feed({ items: [
    new Item({ id: 100, read: true }),
    new Item({ id: 101, read: true }),
    new Item({ id: 102, read: true }),
    new Item({ id: 103 }),
    new Item({ id: 104 })
]});

test('Feed.getNextUnread', async () => {    
    expect(mockFeed.getNextUnread(0).id == 103).toBe(true);
    expect(mockFeed.getNextUnread(102).id == 103).toBe(true);
    expect(mockFeed.getNextUnread(103).id == 104).toBe(true);
    expect(mockFeed.getNextUnread(104).id == 103).toBe(true);
});

test('Feed.update', async () => {    
    await TestData.slashdotFeed.update();
    expect(TestData.slashdotFeed.last_updated > 0).toBe(true);
    expect(TestData.slashdotFeed.items.length).toBe(1);
    expect(TestData.slashdotFeed.description).toBe('News for nerds, stuff that matters');
    expect(TestData.slashdotFeed.icon).toBe('https://slashdot.org//favicon.ico');
    expect(TestData.slashdotFeed.getItemById(105).title).toBe('WordPress Blogs Can Now Be Followed in the Fediverse, Including Mastodon');
});