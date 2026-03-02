// vim: set ts=4 sw=4:

import { TestData } from './testdata.js';
import { Feed } from '../src/js/feedreader/feed';
import { Item } from '../src/js/feedreader/item';

const unreadTestFeed = TestData.getUnreadTestFeed();
const slashdotFeed = TestData.getSlashdotFeed();

describe('Feed.getNextUnread', () => {
    test('returns undefined for invalid inputs', async () => {    
        expect(await unreadTestFeed.getNextUnread(undefined)).toBe(undefined);
        expect(await unreadTestFeed.getNextUnread(0)).toBe(undefined);
    });

    test('finds first unread item after given id', async () => {
        expect((await unreadTestFeed.getNextUnread(1)).id).toBe(103);
        expect((await unreadTestFeed.getNextUnread(102)).id).toBe(103);
    });

    test('finds next unread after current unread', async () => {
        expect((await unreadTestFeed.getNextUnread(103)).id).toBe(104);
    });

    test('wraps around to first unread when at end', async () => {
        expect((await unreadTestFeed.getNextUnread(104)).id).toBe(103);
    });

    test('handles feed with all items read', async () => {
        await unreadTestFeed.markAllRead();
        expect(await unreadTestFeed.getNextUnread(1)).toBe(undefined);
    });

    test('handles feed with all items unread', async () => {
        (await unreadTestFeed.getItems()).forEach(async (item) => await item.setRead(false));
        expect((await unreadTestFeed.getNextUnread(101)).id).toBe(102);
        expect((await unreadTestFeed.getNextUnread(104)).id).toBe(100);
    });

    test('handles empty feed', async () => {
        const emptyFeed = new Feed();
        emptyFeed.getItems = async () => [];
        expect(await emptyFeed.getNextUnread(0)).toBe(undefined);
    });

    test('handles invalid item id', async () => {
        expect(await unreadTestFeed.getNextUnread(999)).not.toBe(undefined);
        expect((await unreadTestFeed.getNextUnread(999)).id).toBe(100);
    });
});

describe('Feed.update', () => {
    test('updates feed metadata successfully', async () => {    
        await slashdotFeed.update();
        expect(slashdotFeed.last_updated > 0).toBe(true);
        expect(slashdotFeed.description).toBe('News for nerds, stuff that matters');
        expect(slashdotFeed.icon).toBe('https://slashdot.org//favicon.ico');
    });

    test('creates new items from feed', async () => {
        const items = await slashdotFeed.getItems();
        expect(items.length).toBe(1);
        expect((await Item.getById(items[0].id)).title).toBe('WordPress Blogs Can Now Be Followed in the Fediverse, Including Mastodon');
    });

    test('skips update if not enough time has elapsed', async () => {   
        const now = Date.now()/1000 - 15; 
        slashdotFeed.last_updated = now;
        await slashdotFeed.update();
        expect(slashdotFeed.last_updated == now).toBe(true);
    });

    test('forces update when requested', async () => {   
        const now = Date.now()/1000 - 15; 
        slashdotFeed.last_updated = now;
        await slashdotFeed.update(true);
        expect(slashdotFeed.last_updated > now).toBe(true);   
    });

    test('does not create duplicate items', async () => {
        const initialCount = (await slashdotFeed.getItems()).length;
        await slashdotFeed.update(true);
        const finalCount = (await slashdotFeed.getItems()).length;
        expect(finalCount).toBe(initialCount);
    });
});

describe('Feed.serialize', () => {
    test('serializes feed data correctly', () => {
        const feed = new Feed({
            id: 1,
            title: 'Test Feed',
            source: 'https://example.com/feed',
            description: 'A test feed',
            unreadCount: 5
        });

        const serialized = feed.serialize();
        expect(serialized.id).toBe(1);
        expect(serialized.title).toBe('Test Feed');
        expect(serialized.source).toBe('https://example.com/feed');
        expect(serialized.description).toBe('A test feed');
        expect(serialized.unreadCount).toBe(5);
    });

    test('includes all required fields in serialization', async () => {
        await slashdotFeed.update();
        const serialized = slashdotFeed.serialize();

        expect(serialized).toHaveProperty('id');
        expect(serialized).toHaveProperty('title');
        expect(serialized).toHaveProperty('source');
        expect(serialized).toHaveProperty('unreadCount');
        expect(serialized).toHaveProperty('last_updated');
    });
});

describe('Feed.updateUnread', () => {
    test('increases unread count', () => {
        unreadTestFeed.unreadCount = 5;
        unreadTestFeed.updateUnread(3);
        expect(unreadTestFeed.unreadCount).toBe(8);
    });

    test('decreases unread count', () => {
        unreadTestFeed.updateUnread(-2);
        expect(unreadTestFeed.unreadCount).toBe(6);
    });

    test('does not allow negative unread count', () => {
        unreadTestFeed.updateUnread(-7);
        expect(unreadTestFeed.unreadCount).toBe(0);
    });

    test('propagates count to parent', () => {
        const parent = new Feed({ unreadCount: 10 });
        parent.updateUnread = jest.fn();
        
        const child = new Feed({ unreadCount: 5 });
        child.parent = parent;
        
        child.updateUnread(3);
        expect(child.unreadCount).toBe(8);
        expect(parent.updateUnread).toHaveBeenCalledWith(3);
    });
});

describe('Feed error handling', () => {
    test('recovers from error state on successful update', async () => {
        slashdotFeed.error = Feed.ERROR_NET;
        await slashdotFeed.update(true);
        expect(slashdotFeed.error).toBe(Feed.ERROR_NONE);
    });
});