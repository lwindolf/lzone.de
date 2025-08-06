// vim: set ts=4 sw=4:

import { Feed } from '../www/js/feedreader/feed';
import { Item } from '../www/js/feedreader/item';
import { TestData } from './testdata.js';

const mockFeed = new Feed();
mockFeed.getItems = async () => [
    new Item({ id: 100, read: true }),
    new Item({ id: 101, read: true }),
    new Item({ id: 102, read: true }),
    new Item({ id: 103 }),
    new Item({ id: 104 })
];

test('Feed.getNextUnread', async () => {    
    expect(await mockFeed.getNextUnread(undefined)).toBe(undefined);
    expect(await mockFeed.getNextUnread(0)).toBe(undefined);

    expect((await mockFeed.getNextUnread(1)).id).toBe(103);
    expect((await mockFeed.getNextUnread(102)).id).toBe(103);
    expect((await mockFeed.getNextUnread(103)).id).toBe(104);
    expect((await mockFeed.getNextUnread(104)).id).toBe(103);
});

test('Feed.update', async () => {    
    await TestData.slashdotFeed.update();
    expect(TestData.slashdotFeed.last_updated > 0).toBe(true);
    expect(TestData.slashdotFeed.description).toBe('News for nerds, stuff that matters');
    expect(TestData.slashdotFeed.icon).toBe('https://slashdot.org//favicon.ico');

    expect((await TestData.slashdotFeed.getItems()).length).toBe(1);
    expect((await Item.getById(105)).title).toBe('WordPress Blogs Can Now Be Followed in the Fediverse, Including Mastodon');
});