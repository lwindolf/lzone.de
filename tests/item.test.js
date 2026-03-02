// vim: set ts=4 sw=4:

import { Item } from '../src/js/feedreader/item';

describe('Item.save', () => {
    test('ensure ids are automatically assigned', async () => {
        const item1 = new Item({ title: 'Test Item', nodeId: 3 });
        await item1.save();
        expect(item1.id).toBeDefined();

        const item2 = new Item({ title: 'Test Item 2', nodeId: 3 });
        await item2.save();
        expect(item2.id).toBe(item1.id + 1);
    });
});

describe('Item.constructor', () => {
    test('should set default values', () => {
        const item = new Item({});
        expect(item.id).toBeUndefined();
        expect(item.nodeId).toBe(0);
        expect(item.read).toBe(false);
        expect(item.starred).toBe(false);
        expect(item.media).toEqual([]);
        expect(item.metadata).toEqual({});
    });

    test('should override defaults with provided values', () => {
        const item = new Item({ title: 'Test', nodeId: 5, read: true });
        expect(item.title).toBe('Test');
        expect(item.nodeId).toBe(5);
        expect(item.read).toBe(true);
    });
});

describe('Item.addMedia', () => {
    test('should add valid media', () => {
        const item = new Item({});
        item.addMedia('http://example.com/video.mp4', 'video/mp4', 120);
        expect(item.media).toHaveLength(1);
        expect(item.media[0]).toEqual({ url: 'http://example.com/video.mp4', mime: 'video/mp4', length: 120 });
    });

    test('should not add media without url', () => {
        const item = new Item({});
        item.addMedia(null, 'video/mp4');
        expect(item.media).toHaveLength(0);
    });

    test('should not add media without mime', () => {
        const item = new Item({});
        item.addMedia('http://example.com/video.mp4', null);
        expect(item.media).toHaveLength(0);
    });

    test('should not add gravatar urls', () => {
        const item = new Item({});
        item.addMedia('http://www.gravatar.com/avatar/123', 'image/png');
        expect(item.media).toHaveLength(0);
    });

    test('should not add media already in description', () => {
        const item = new Item({ description: '<img src="http://example.com/image.png">' });
        item.addMedia('http://example.com/image.png', 'image/png');
        expect(item.media).toHaveLength(0);
    });

    test('should handle invalid length gracefully', () => {
        const item = new Item({});
        item.addMedia('http://example.com/video.mp4', 'video/mp4', 'invalid');
        expect(item.media).toHaveLength(1);
        expect(item.media[0].length).toBeNaN();
    });
});

describe('Item.setRead', () => {
    test('should update read status', async () => {
        const item = new Item({ nodeId: 3, read: false });
        await item.save();
        await item.setRead(true);
        expect(item.read).toBe(true);
    });

    test('should not save if read status unchanged', async () => {
        const item = new Item({ nodeId: 3, read: true });
        await item.save();
        const originalId = item.id;
        await item.setRead(true);
        expect(item.id).toBe(originalId);
    });
});

describe('Item.setStarred', () => {
    test('should update starred status', async () => {
        const item = new Item({ nodeId: 3, starred: false });
        await item.save();
        await item.setStarred(true);
        expect(item.starred).toBe(true);
    });

    test('should not save if starred status unchanged', async () => {
        const item = new Item({ nodeId: 3, starred: true });
        await item.save();
        await item.setStarred(true);
        expect(item.starred).toBe(true);
    });
});

describe('Item.getById', () => {
    test('should retrieve saved item', async () => {
        const item = new Item({ title: 'Retrieve Test', nodeId: 3 });
        await item.save();
        const retrieved = await Item.getById(item.id);
        expect(retrieved.title).toBe('Retrieve Test');
        expect(retrieved.nodeId).toBe(3);
    });
});

describe('Item.remove', () => {
    test('should remove saved item', async () => {
        const item = new Item({ title: 'Remove Test', nodeId: 3 });
        await item.save();
        const itemId = item.id;
        await item.remove();
        await expect(Item.getById(itemId)).rejects.toThrow();
    });
});
