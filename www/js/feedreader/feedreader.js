// vim: set ts=4 sw=4:

import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { HelpDialog } from '../dialogs/help.js';
import { keydown } from '../helpers/events.js';

export class FeedReader {
    // member variables for easier console debugging
    feedlist = new FeedList();
    feedinfo = new FeedInfo();
    itemlist = new ItemList();
    itemview = new ItemView();

    constructor() {
        // global hotkeys
        keydown('#feedreader', /* F1 */               (e) => (e.keyCode === 112),             () => new HelpDialog());
        keydown('#feedreader', /* Ctrl-right arrow */ (e) => (e.keyCode === 39 && e.ctrlKey), () => ItemList.nextUnread());

        // FIXME: Ctrl hotkeys do not work with PWAs
        //keydown('body', /* Ctrl-S */           (e) => (e.keyCode === 83 && e.ctrlKey), () => document.dispatchEvent(new CustomEvent("feedMarkAllRead", { detail: { id: FeedList.getSelectedId()}})));
        //keydown('body', /* Ctrl-U */           (e) => (e.keyCode === 85 && e.ctrlKey), () => FeedList.update());
    }
}