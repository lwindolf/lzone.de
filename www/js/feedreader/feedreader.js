// vim: set ts=4 sw=4:

import { FeedList } from './feedlist.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { Action } from '../Action.js';
import * as ev from '../helpers/events.js';

// The FeedReader class implements a two pane feed view with one pane for the list
// of items and the other for the item content or a description of the feed.
//
// Additionally it hooks in the app location hash routing to perform feed and item selection
//
// emits
//   feedSelected (feedId, id)
//   itemSelected (id)

export class FeedReader {
    // config
    static #hashRouteBase = '#/-/Feed/';

    // state
    static #selectedFeed;
    static #selectedItem;

    feedlist;
    itemlist;
    itemview;

    // async constructor
    async #setup() {
        await FeedList.setup();

        this.feedlist = new FeedList();
        this.itemlist = new ItemList();
        this.itemview = new ItemView();

        Action.register('feedreader:markRead',   (params) => FeedList.markAllRead(params.id));
        Action.register('feedreader:updateNode', (params) => FeedList.update(params.id));
        Action.register('feedreader:removeNode', (params) => FeedList.remove(params.id));
        Action.register('feedreader:select',     (params) => FeedReader.select(params.itemId, params.nodeId));
        Action.register('feedreader:nextUnread', () => this.itemlist.nextUnread());

        // Note: for wide browser compatibility use only hotkeys used by Google Drive, see docs
        // https://support.google.com/drive/answer/2563044?hl=en&sjid=12990221386685109012-EU

        Action.hotkey('C-A-KeyR',     'feedreader:markRead',   FeedReader.#hashRouteBase, () => { return { id: FeedReader.#selectedFeed }; });
        Action.hotkey('C-A-KeyU',     'feedreader:updateNode', FeedReader.#hashRouteBase, () => { return { id: FeedReader.#selectedFeed }; });
        Action.hotkey('C-ArrowRight', 'feedreader:nextUnread', FeedReader.#hashRouteBase);

        window.addEventListener('hashchange', () => FeedReader.#onLocationChange());
    }

    constructor() {
        this.#setup();
    }

    update() {
        FeedReader.#onLocationChange();
    }

    // location hash based item/feed selection routing

    static #onLocationChange() {
        const oldFeed = FeedReader.#selectedFeed;
        const oldItem = FeedReader.#selectedItem;

        if (!document.location.hash.startsWith(FeedReader.#hashRouteBase))
            return;

        const match = document.location.hash.match(/Feed\/(?<feedId>\d+)(\/Item\/(?<itemId>\d+))?/);
        FeedReader.#selectedFeed = match.groups.feedId ? parseInt(match.groups.feedId) : null;
        FeedReader.#selectedItem = match.groups.itemId ? parseInt(match.groups.itemId) : null;

        if ((oldFeed != FeedReader.#selectedFeed) ||
            (oldItem != FeedReader.#selectedItem)) {
            if (FeedReader.#selectedItem)
                ev.dispatch('itemSelected', { feedId: FeedReader.#selectedFeed, id: FeedReader.#selectedItem });
            else
                ev.dispatch('feedSelected', { id: FeedReader.#selectedFeed });
        }
    }

    // select a new feed (and optionally an item)
    static select(nodeId, itemId = undefined) {
        window.location.hash = `${FeedReader.#hashRouteBase}${nodeId}${itemId ? `/Item/${itemId}` : ''}`;
    }

    // select a new item (of the currently displayed feed)
    static selectItem(id) {
        window.location.hash = `${FeedReader.#hashRouteBase}${FeedReader.#selectedFeed}/Item/${id}`;
    }
}
