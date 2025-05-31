// vim: set ts=4 sw=4:

window.Handlebars = require('handlebars');

// no "imports" because of Handlebars requirement above
const { Feed } = require('../www/js/feedreader/feed');
const { Item } = require('../www/js/feedreader/item');
const { FeedList } = require('../www/js/feedreader/feedlist');
const { ItemList } = require('../www/js/feedreader/itemlist');
const { DB } = require('../www/js/feedreader/db');

const mockFeeds = [
    new Feed({ title: 'abc', id: 1, unreadCount: 0, items: []}),
    new Feed({ title: 'def', id: 2, unreadCount: 5, items: [
        new Item({ id: 100, time: 203304944, read: true }),
        new Item({ id: 101, time: 203304944, read: true }),
        new Item({ id: 102, time: 203304944, read: true }),
        new Item({ id: 103, time: 203304944 }),
        new Item({ id: 104, time: 203304944 })
    ]}),
];

DB.testDisable = true;  // DB won't do anything

test('Itemlist.nextUnread', () => {
    // FIXME: load index.html instead!
    document.body.innerHTML = `
    <div id='wrap'>
    <div id='main'>
        <div class='view' id='feedlist'>
            <header id='feedlistViewTitle'>
                <span class='title'>Feeds</span>
                <span class='addBtn'>+ Add</span>
            </header>
            <div id='feedlistViewContent'></div>
        </div>
        <div class='view' id='itemlist'>
            <header id='itemlistViewTitle'></header>
            <div class='feedInfoError'></div>
            <div id='itemlistViewContent'></div>
        </div>
        <div class='view' id='item'>
            <header id='itemViewTitle'></header>
            <div id='itemViewContent'></div>
        </div>
        <div id='linkHover'></div>
    </div>

    <!-- modal dialog -->
    <div id="modal">
        <div id="modalContent">
        </div>
    </div>
    </div>`;

    let il = new ItemList();

    FeedList.add(mockFeeds[0], false /* update */);
    FeedList.add(mockFeeds[1], false /* update */);
    FeedList.render(FeedList.root);

    document.dispatchEvent(new CustomEvent("feedSelected", { detail: { id: 2 } }));
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent("itemSelected", { detail: { feed: 2, item: 102 } }));

        setTimeout(() => {
            expect(ItemList.selected.id).toBe(102);
    
            ItemList.nextUnread();
            expect(ItemList.selected.id).toBe(103);

            ItemList.nextUnread();
            expect(ItemList.selected.id).toBe(104);

            ItemList.nextUnread();
            expect(ItemList.selected.id).toBe(undefined);
        }, 500);
    }, 500); 
});

