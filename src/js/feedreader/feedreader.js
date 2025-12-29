// vim: set ts=4 sw=4:

import { Feed } from './feed.js';
import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { Libraries } from "../libraries.js";
import { ContextMenu } from '../ContextMenu.js';
import { Action } from '../helpers/Action.js';
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
    static #selector = '#feedreader';

    // state
    static #selectedFeed;
    static #selectedItem;

    static feedlist;
    static feedinfo;
    static itemlist;
    static itemview;

    // async constructor
    static async #setup() {
        document.querySelector(this.#selector).innerHTML = `
            <div id="itemlist" tabindex="1">
                <div id="itemlistViewContent"></div>
            </div>
            <div id="itemview" tabindex="2">
                <div id="itemViewContent"></div>
            </div>`;

        Libraries.get('Split').then(Split => {
            Split(['#itemlist', '#itemview'], {
                sizes: [30, 70],
                minSize: [100, 100],
                gutterSize: 3,
                expandToMin: true,
                direction: 'vertical'
            });
        });

        new ContextMenu('sidebar', [
            // Feed options
            {
                label: 'Update',
                action: 'feedreader:updateNode',
                type: 'feed'
            },
            {
                label: 'Mark Read',
                action: 'feedreader:markRead',
                type: 'feed'
            },
            /*{
                label: 'Remove',
                action: 'feedreader:removeNode',
                type: 'feed'
            },*/
            // Folder options
            /*{
                label: 'Add Feed',
                action: 'feedreader:addFeed',
                type: 'folder'
            },
            {
                label: 'Mark All Read',
                action: 'feedreader:markRead',
                type: 'folder'
            },
            {
                label: 'Update',
                action: 'feedreader:updateNode',
                type: 'folder'
            },
            {
                label: 'Remove',
                action: 'feedreader:removeNode',
                type: 'folder'
            }*/
        ]);        

        new ContextMenu('itemlist', [
            {
                label: 'Open Link',
                action: 'feedreader:openItemLink'
            },
            {
                label: 'Toggle Read',
                action: 'feedreader:toggleItemRead'
            },
            {
                label: 'Toggle Star',
                action: 'feedreader:toggleItemStar'
            }
        ]);

        this.feedlist = new FeedList();
        this.feedinfo = new FeedInfo();
        this.itemlist = new ItemList();
        this.itemview = new ItemView();

        // Feed actions
        Action.register('feedreader:addFeed',    (params) => FeedList.add(new Feed({ source:params.source, title:params.title })));
        Action.register('feedreader:markRead',   (params) => FeedList.markAllRead(params.id));
        Action.register('feedreader:updateNode', (params) => FeedList.update(params.id));
        Action.register('feedreader:removeNode', (params) => FeedList.remove(params.id));

        // Item actions
        Action.register('feedreader:nextUnread',     () => this.itemlist.nextUnread());
        Action.register('feedreader:select',         (params) => this.select(params.itemId, params.nodeId));
        Action.register('feedreader:toggleItemRead', (params) => this.itemlist.toggleItemRead(parseInt(params.id)));
        Action.register('feedreader:toggleItemStar', (params) => this.itemlist.toggleItemStar(parseInt(params.id)));
        Action.register('feedreader:openItemLink',   (params) => this.itemlist.openItemLink(parseInt(params.id)));

        // Sidebar middle click handler
        Action.register('feed:auxclick',         (params) => FeedList.markAllRead(params.id));

        // Note: for wide browser compatibility use only hotkeys used by Google Drive, see docs
        // https://support.google.com/drive/answer/2563044?hl=en&sjid=12990221386685109012-EU

        Action.hotkey('C-A-KeyR',     'feedreader:markRead',   this.#hashRouteBase, () => { return { id: this.#selectedFeed }; });
        Action.hotkey('C-A-KeyU',     'feedreader:updateNode', this.#hashRouteBase, () => { return { id: this.#selectedFeed }; });
        Action.hotkey('C-ArrowRight', 'feedreader:nextUnread', this.#hashRouteBase);

        window.addEventListener('hashchange', () => this.#onLocationChange());
    }

    // only needs to be called once
    static render() {
        if (!this.feedlist)
            this.#setup();

        this.#onLocationChange();
    }

    // location hash based item/feed selection routing

    static #onLocationChange() {
        const oldFeed = this.#selectedFeed;
        const oldItem = this.#selectedItem;

        if (!document.location.hash.startsWith(this.#hashRouteBase))
            return;

        const match = document.location.hash.match(/Feed\/(?<feedId>\d+)(\/Item\/(?<itemId>\d+))?/);
        this.#selectedFeed = match.groups.feedId ? parseInt(match.groups.feedId) : null;
        this.#selectedItem = match.groups.itemId ? parseInt(match.groups.itemId) : null;

        if ((oldFeed != this.#selectedFeed) ||
            (oldItem != this.#selectedItem)) {
            if (this.#selectedItem)
                ev.dispatch('itemSelected', { feedId: this.#selectedFeed, id: this.#selectedItem });
            else
                ev.dispatch('feedSelected', { id: this.#selectedFeed });
        }
    }

    // select a new feed (and optionally an item)
    static select(nodeId, itemId = undefined) {
        window.location.hash = `${this.#hashRouteBase}${nodeId}${itemId ? `/Item/${itemId}` : ''}`;
    }

    // select a new item (of the currently displayed feed)
    static selectItem(id) {
        window.location.hash = `${this.#hashRouteBase}${this.#selectedFeed}/Item/${id}`;
    }
}