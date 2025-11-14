// vim: set ts=4 sw=4:

import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { Action } from '../Action.js';
import { HelpDialog } from '../dialogs/help.js';
import { keydown } from '../helpers/events.js';

// The FeedReader class implements a two pane feed view with one pane for the list
// of items and the other for the item content or a description of the feed.
//
// Feed list navigation is not handled here!

export class FeedReader {
    // member variables for easier console debugging
    feedlist = new FeedList();
    feedinfo = new FeedInfo();
    itemlist = new ItemList();
    itemview = new ItemView();

    #selectedFeedId = null;

    // static constructor
    static initialize() {
        Action.register('feedreader:markRead',   (params) => FeedList.markAllRead(params.id));
        Action.register('feedreader:updateNode', (params) => FeedList.update(params.id));
        Action.register('feedreader:removeNode', (params) => FeedList.remove(params.id));
    }

    constructor() {
        // global hotkeys
        keydown('#feedreader', /* F1 */            (e) => (e.keyCode === 112),             () => new HelpDialog());
        keydown('#feedreader', /* C-right arrow */ (e) => (e.keyCode === 39 && e.ctrlKey), () => ItemList.nextUnread());

        keydown('#feedreader', /* C-S-m */ (e) => (e.keyCode === 77 && e.ctrlKey && e.shiftKey), () => FeedList.markAllRead(this.#selectedFeedId));
        keydown('#feedreader', /* C-S-u */ (e) => (e.keyCode === 85 && e.ctrlKey && e.shiftKey), () => FeedList.update());

        this.#selectedFeedId = parseInt(document.location.hash.match(/Feed\/(\d+)/)?.[1] || 0);
    }

    // Feed switching is triggered via location hash routing
    static select(id) {
        document.location.hash = `#/-/Feed/${id}`;
    }   
}

FeedReader.initialize();