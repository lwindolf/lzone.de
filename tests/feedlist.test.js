// vim: set ts=4 sw=4:

window.Handlebars = require('handlebars');

// no "imports" because of Handlebars requirement above
const { Feed } = require('../www/js/feedreader/feed');
const { FeedList } = require('../www/js/feedreader/feedlist');
const { TestData } = require('./testdata.js');

const mockFeedlistChildren = [
    new Feed({ title: 'abc', id: 1, unreadCount: 0 }),
    new Feed({ title: 'def', id: 2, unreadCount: 5 }),
    new Feed({ title: 'ghi', id: 3, unreadCount: 7 })
];

/*test('FeedList.constructor', () => {
    let fl = new FeedList();

    expect(fl !== undefined).toBe(true);
    expect(fl.root !== undefined).toBe(true);
    expect(fl.root.children !== undefined).toBe(true);
});*/

test('FeedList.getNextUnreadNode', () => {
    FeedList.root.children = mockFeedlistChildren;
    expect(FeedList.getNextUnreadNode(0).id == 2).toBe(true);
    expect(FeedList.getNextUnreadNode(2).id == 3).toBe(true);
    expect(FeedList.getNextUnreadNode(3).id == 2).toBe(true);
    expect(FeedList.getNextUnreadNode(853).id == 2).toBe(true);
});
