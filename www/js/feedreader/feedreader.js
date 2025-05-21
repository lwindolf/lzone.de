// vim: set ts=4 sw=4:

import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

export class FeedReader {
    // member variables for easier console debugging
    feedlist = new FeedList();
    feedinfo = new FeedInfo();
    itemlist = new ItemList();
    itemview = new ItemView();

    constructor() {
        // global hotkeys
        //keydown('body', /* F1 */               (e) => (e.keyCode === 112),             () => new HelpDialog());
        //keydown('body', /* Ctrl-right arrow */ (e) => (e.keyCode === 39 && e.ctrlKey), () => ItemList.nextUnread());

        // FIXME: Ctrl hotkeys do not work with PWAs
        //keydown('body', /* Ctrl-S */           (e) => (e.keyCode === 83 && e.ctrlKey), () => document.dispatchEvent(new CustomEvent("feedMarkAllRead", { detail: { id: FeedList.getSelectedId()}})));
        //keydown('body', /* Ctrl-U */           (e) => (e.keyCode === 85 && e.ctrlKey), () => FeedList.update());
    }
}