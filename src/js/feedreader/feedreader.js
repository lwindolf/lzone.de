// vim: set ts=4 sw=4:

import { Feed } from './feed.js';
import { Item } from './item.js';
import { FeedList } from './feedlist.js';
import { FeedInfo } from './feedinfo.js';
import { ItemList } from './itemlist.js';
import { ItemView } from './itemview.js';

import { SubscribeFeedDialog } from '../dialogs/subscribeFeed.js';

import { Settings } from '../models/Settings.js';
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

    // state
    static #el;
    static #selectedFeedId;
    static #selectedItemId;

    // views
    static feedinfo;
    static itemview;
    static itemlist;

    // view setup
    static async setup(el) {
        this.#el = el;
        this.#el.innerHTML = `
            <div id="itemlist" tabindex="1">
                <div id="itemlistViewContent"></div>
            </div>
            <div id="itemview" tabindex="2">
                <div id="itemViewContent" style="display: none"></div>
                <div id="feedViewContent"></div>
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

        this.feedinfo = new FeedInfo(this.#el.ownerDocument.getElementById('feedViewContent'));
        this.itemview = new ItemView(this.#el.ownerDocument.getElementById('itemViewContent'));
        this.itemlist = new ItemList(this.#el.ownerDocument.getElementById('itemlistViewContent'));

        this.feedinfo.setData({ id: this.#selectedFeedId });
        this.itemview.setData({ id: this.#selectedItemId });
        this.itemlist.setData({ id: this.#selectedFeedId });
    }

    // controller setup
    static async initialize() {
        await FeedList.setup();

        Settings.addSchema({
            'feedreader:::refreshInterval'     : { default: 24,      description: "The default refresh interval for the feed reader" },
            'feedreader:::refreshIntervalUnit' : { default: 'hours', description: "The default refresh interval unit for the feed reader" },
            'feedreader:::maxItems'            : { default: 100,     description: "The maximum number of items to display in the feed reader" },
            'allowCorsProxy'                   : { default: false,   description: "Allow using a CORS proxy for feed + content requests" }
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
            {
                label: 'Remove',
                action: 'feedreader:removeNode',
                type: 'feed'
            },
            // Folder options
            {
                label: 'Update All',
                action: 'feedreader:updateNode',
                type: 'folder'
            },
            {
                label: 'Add Feed',
                action: 'aggregator:addFeed',
                type: 'folder'
            },
            {
                label: 'Add Folder',
                action: 'aggregator:addFolder',
                type: 'folder'
            },
            {
                label: 'Mark All Read',
                action: 'feedreader:markRead',
                type: 'folder'
            },
            {
                label: 'Remove',
                action: 'feedreader:removeNode',
                type: 'folder'
            }
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

        // Node actions (FIXME: move to aggregator)
        Action.register('aggregator:addFolder',  () => FeedList.addNewFolder({ parentId: FeedReader.getSelectedNodeId() }));
        Action.register('aggregator:addFeed',    () => new SubscribeFeedDialog(this.getSelectedNodeId));

        // Feed actions
        Action.register('feedreader:addFeed',    (params) => FeedList.add(new Feed({ source:params.source, title:params.title, parent:FeedList.getNodeById(parseInt(params.parentId)) })));
        Action.register('feedreader:markRead',   (params) => FeedList.markAllRead(parseInt(params.id)));
        Action.register('feedreader:updateNode', (params) => FeedList.updateNode(FeedList.getNodeById(params.id), true));
        Action.register('feedreader:removeNode', (params) => FeedList.remove(parseInt(params.id)));
        Action.register('feedreader:allowCorsProxy', (params) => {
            const feed = FeedList.getNodeById(params.id);
            if(params.global === 'true') {
                Settings.set('allowCorsProxy', true);
            } else {
                FeedList.allowCorsProxy(feed.id, true);
            }
            feed.update();
        });

        Action.register('sidebar:feed:middleClick',  (params) => FeedList.markAllRead(parseInt(params.id)));

        // Item actions
        Action.register('feedreader:nextUnread',     () => this.nextUnread(this.#selectedFeedId, this.#selectedItemId));
        Action.register('feedreader:select',         (params) => this.select(params.itemId, params.nodeId));
        Action.register('feedreader:toggleItemRead', async (params) => {
            const item = await Item.getById(parseInt(params.id));
            const node = FeedList.getNodeById(item.nodeId);

            item.setRead(!item.read);
            node.updateUnread(item.read?-1:1);
        });
        Action.register('feedreader:toggleItemStar', async (params) => {
            const item = await Item.getById(parseInt(params.id));
            item.setStarred(!item.starred);
        });
        Action.register('feedreader:openItemLink',   (params) => this.itemlist.openItemLink(parseInt(params.id)));

        // Note: for wide browser compatibility use only hotkeys used by Google Drive, see docs
        // https://support.google.com/drive/answer/2563044?hl=en&sjid=12990221386685109012-EU

        Action.hotkey('C-A-KeyR',     'feedreader:markRead',   this.#hashRouteBase, () => { return { id: this.#selectedFeedId }; });
        Action.hotkey('C-A-KeyU',     'feedreader:updateNode', this.#hashRouteBase, () => { return { id: this.#selectedFeedId }; });
        Action.hotkey('C-ArrowRight', 'feedreader:nextUnread', this.#hashRouteBase);

        window.addEventListener('hashchange', () => this.#onLocationChange());
        this.#onLocationChange();
    }

    // location hash based item/feed selection routing

    static #onLocationChange() {
        const oldFeed = this.#selectedFeedId;
        const oldItem = this.#selectedItemId;

        if (!window.location.hash.startsWith(this.#hashRouteBase))
            return;

        console.log('feedreader onLocationChange', window.location.hash);

        const match = window.location.hash.match(/Feed\/(?<feedId>\d+)(\/Item\/(?<itemId>\d+))?/);
        this.#selectedFeedId = match.groups.feedId ? parseInt(match.groups.feedId) : null;
        this.#selectedItemId = match.groups.itemId ? parseInt(match.groups.itemId) : null;

        if ((oldFeed != this.#selectedFeedId) ||
            (oldItem != this.#selectedItemId)) {

            console.log('feedreader selection needs to be changed: item', this.#selectedItemId, 'feed', this.#selectedFeedId);
            if (this.#selectedItemId)
                ev.dispatch('itemSelected', { feedId: this.#selectedFeedId, id: this.#selectedItemId });
            else
                ev.dispatch('feedSelected', { id: this.#selectedFeedId });
        }
    }

    // select a new feed (and optionally an item)
    static select(nodeId, itemId = undefined) {
        window.location.hash = `${this.#hashRouteBase}${nodeId}${itemId ? `/Item/${itemId}` : ''}`;
    }

    // select a new item (of the currently displayed feed)
    static selectItem(id) {
        window.location.hash = `${this.#hashRouteBase}${this.#selectedFeedId}/Item/${id}`;
    }

    static getSelectedItemId = () => this.#selectedItemId;
    static getSelectedNodeId = () => this.#selectedFeedId;

    // select next unread (includes switching feeds)
    static async nextUnread() {
        let item, node, id;

        if(this.#selectedFeedId) {
            node = FeedList.getNodeById(this.#selectedFeedId);
            id = this.#selectedItemId;
        } else {
            // select first node if none is selected
            node = FeedList.getNextUnreadNode(0);
            id = 0;
        }
        console.log('itemlist nextUnread: starting at node id', node.id, 'item id', id);

        if(!node)
            return;

        // Try looking in same feed/folder
        item = await node.getNextUnread(id);

        // Switch to next feed if needed
        if(!item) {
            node = FeedList.getNextUnreadNode(node.id);
            item = await node.getNextUnread(id);
        }

        // FIXME: folder recursion

        console.log('itemlist nextUnread: result', item);
        if(item)
            FeedReader.select(node.id, item.id);
    }
}

FeedReader.initialize();