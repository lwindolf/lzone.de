// vim: set ts=4 sw=4:

window.Handlebars = require('handlebars');

// no "imports" because of Handlebars requirement above
const { TestData } = require('./testdata.js');
const { FeedReader } = require('../src/js/feedreader/feedreader');
const { Feed } = require('../src/js/feedreader/feed');
const { Item } = require('../src/js/feedreader/item');
const { FeedList } = require('../src/js/feedreader/feedlist');
const { ItemList } = require('../src/js/feedreader/itemlist');

const mockFeeds = [
    new Feed({ title: 'abc', id: 1, unreadCount: 0}),
    new Feed({ title: 'def', id: 2, unreadCount: 5})
];

[
    { id: 100, nodeId: 2, time: 203304944, read: true },
    { id: 101, nodeId: 2, time: 203304944, read: true },
    { id: 102, nodeId: 2, time: 203304944, read: true },
    { id: 103, nodeId: 2, time: 203304944 },
    { id: 104, nodeId: 2, time: 203304944 }
].forEach(async (d) => await (new Item(d)).save());

test('Itemlist.nextUnread', async () => { 
    await FeedList.add(mockFeeds[0], false /* update */);
    await FeedList.add(mockFeeds[1], false /* update */);

    FeedReader.select(2, 102);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(FeedReader.itemlist.selected.id).toBe(102);

    await FeedReader.itemlist.nextUnread();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(FeedReader.itemlist.selected.id).toBe(103);

    await FeedReader.itemlist.nextUnread();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(FeedReader.itemlist.selected.id).toBe(104);

    await FeedReader.itemlist.nextUnread();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(FeedReader.itemlist.selected.id).toBe(104); // selection stays if there is nothing more
});

