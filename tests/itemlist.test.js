// vim: set ts=4 sw=4:

window.Handlebars = require('handlebars');

// no "imports" because of Handlebars requirement above
const { Feed } = require('../www/js/feedreader/feed');
const { Item } = require('../www/js/feedreader/item');
const { FeedList } = require('../www/js/feedreader/feedlist');
const { ItemList } = require('../www/js/feedreader/itemlist');

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
    new ItemList();

    await FeedList.add(mockFeeds[0], false /* update */);
    await FeedList.add(mockFeeds[1], false /* update */);

    document.dispatchEvent(new CustomEvent("feedSelected", { detail: { id: 2 } }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    await ItemList.select(2, 102);
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(ItemList.selected.id).toBe(102);

    await ItemList.nextUnread();
    expect(ItemList.selected.id).toBe(103);

    await ItemList.nextUnread();
    expect(ItemList.selected.id).toBe(104);

    await ItemList.nextUnread();
    expect(ItemList.selected.id).toBe(104); // selection stays if there is nothing more
});

