// vim: set ts=4 sw=4:

import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { Action } from '../Action.js';
import { keydown } from '../helpers/events.js';

// The FeedReader class implements a two pane feed view with one pane for the list
// of items and the other for the item content or a description of the feed.
//
// Feed list navigation is not handled here!

export class FeedReader {
    // member variables for easier console debugging
    static feedlist = new FeedList();
    static feedinfo = new FeedInfo();
    static itemlist = new ItemList();
    static itemview = new ItemView();

    #selectedFeedId = null;

    // static constructor
    static initialize() {
        Action.register('feedreader:markRead',   (params) => FeedList.markAllRead(params.id));
        Action.register('feedreader:updateNode', (params) => FeedList.update(params.id));
        Action.register('feedreader:removeNode', (params) => FeedList.remove(params.id));
    }

    constructor() {
        // global hotkeys

        // Note: for wide browser compatibility use only hotkeys used by Google Drive, see docs
        // https://support.google.com/drive/answer/2563044?hl=en&sjid=12990221386685109012-EU

        // FIXME: perform feed / item specific hotkeys only when feed node is selected or items view is focused
        keydown('body', /* F1 */            (e) => (e.keyCode === 112),             () => new HelpDialog());
        keydown('body', /* C-right arrow */ (e) => (e.keyCode === 39 && e.ctrlKey), () => ItemList.nextUnread());

        keydown('body', /* C-A-r */ (e) => (e.keyCode === 82 && e.ctrlKey && e.altKey),    () => FeedList.markAllRead(this.#selectedFeedId));
        keydown('body', /* C-A-u */ (e) => (e.keyCode === 85 && e.ctrlKey && e.altKey),    () => FeedList.update());

        this.#selectedFeedId = parseInt(document.location.hash.match(/Feed\/(\d+)/)?.[1] || 0);
    }

    // Feed switching is triggered via location hash routing
    static select(id) {
        document.location.hash = `#/-/Feed/${id}`;
    }   
}

FeedReader.initialize();