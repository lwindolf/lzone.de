// vim: set ts=4 sw=4:

// Managing a list of currently visible items
// for simplicity combined view and model

import { FeedList } from './feedlist.js';
import { FeedReader } from './feedreader.js';
import { Item } from './item.js';
import { template, render } from '../helpers/render.js';
import { DateParser } from './parsers/date.js';
import * as ev from '../helpers/events.js';

export class ItemList {
    // state
    displayedFeedId;    // id of the feed that is currently displayed
    selected;           // selected item (or undefined)
    #newItems;          // true if there are new items

    static #headerTemplate = template(`
        <span class='switchView' data-view='{{view}}'>&lt;</span>
        <a class='title' target='_system' href='{{node.homepage}}'>{{node.title}}</a>
        {{#if node.icon}}
            <img class='icon' src='{{node.icon}}'/>
        {{/if}}
    `);

    static #listTemplate = template(`
        <div class='newItems hidden'>Click to show new items</div>
        {{#each items}}
            <div class='item' data-id='{{id}}' data-feed='{{nodeId}}'></div>
        {{/each}}
    `);

    static #itemTemplate = template(`
        <span class='date'>{{time}}</span>
        <span class='title' data-read='{{read}}'>{{title}}</span>
    `);

    static #itemUpdated(item) {
        render(`.item[data-id="${item.id}"]`, ItemList.#itemTemplate, {
            time: DateParser.getShortDateStr(item.time),
            read: item.read,
            title: item.title
        });
    }

    // load all items from the given node id
    static async #loadFeed(id) {
        const node = FeedList.getNodeById(id);
        const items = await node.getItems();

        ItemList.displayedFeedId = id;

        // FIXME: handle folders

        if(!document.getElementById('itemlistViewContent'))
            return;

        render('#itemlistViewTitle', ItemList.#headerTemplate, { node, view: 'feedlist' });
        render('#itemlistViewContent', ItemList.#listTemplate, { node, items });
        items.forEach((i) => ItemList.#itemUpdated(i));
    }

    // toggle read status
    static async #toggleItemRead(id) {
        const item = await Item.getById(id);
        const node = FeedList.getNodeById(item.nodeId);

        item.setRead(!item.read);
        node.updateUnread(item.read?-1:1);
    }

    // select an item
    static async select(feedId, id) {
        const item = await Item.getById(id);

        [...document.querySelectorAll('.item.selected')]
            .forEach((n) => n.classList.remove('selected'));
        let itemNode = document.querySelector(`.item[data-id="${id}"]`);
        itemNode.classList.add('selected');
        itemNode.scrollIntoView({ block: 'nearest' });
        
        document.getElementById('itemlist').focus();

        ItemList.selected = item;
        if(!item.read)
            ItemList.#toggleItemRead(id);

        ev.dispatch('itemSelected', { feed: feedId, id: item.id });
    }

    // select next unread
    static async nextUnread() {
        let item, node, id;

        if(ItemList.selected) {
            node = FeedList.getNodeById(ItemList.selected.nodeId)
            id = ItemList.selected.id;
        } else {
            // select first node if none is selected
            node = FeedList.getNextUnreadNode(0);
            id = 0;
        }

        // Try looking in same feed/folder
        item = await node.getNextUnread(id);

        // Switch to next feed if needed
        if(!item) {
            node = FeedList.getNextUnreadNode(node.id);
            item = await node.getNextUnread(id);
        }

        // FIXME: folder recursion
        if(item) {
            FeedReader.select(node.id);
            ItemList.select(node.id, item.id);
        }
    }

    static #openItemLink = async (id) =>
        window.open((await Item.getById(id)).source, '_system', 'location=yes');

    constructor() {
        document.addEventListener('itemUpdated',  (e) => ItemList.#itemUpdated(e.detail));
        document.addEventListener('feedSelected', (e) => {
            ItemList.selected = undefined;
            ItemList.#loadFeed(parseInt(e.detail.id));
        });
        document.addEventListener('itemsAdded',   () =>
            document.querySelector('#itemlistViewContent .newItems').classList.remove('hidden'));

        // handle mouse events
        ev.connect('auxclick', '.item', (el) => ItemList.#toggleItemRead(parseInt(el.dataset.id)), (e) => e.button == 1);
        ev.connect('click',    '.item', (el) => ItemList.select(parseInt(el.dataset.feed), parseInt(el.dataset.id)));
        ev.connect('dblclick', '.item', (el) => ItemList.#openItemLink(parseInt(el.dataset.id)));
        ev.connect('click',    '.newItems', () => {
            document.querySelector('.newItems').classList.add('hidden');
            ItemList.#loadFeed(ItemList.displayedFeedId);
        });

        // handle cursor keys
        document.addEventListener('keydown', (e) => {
            if(document.activeElement.id !== 'itemlist')
                return;
            if(!e.target.id === 'itemlist')
                return;
            
            const selected = document.querySelector('.item.selected');
            if(e.key === 'ArrowDown') {
                if(selected)
                    selected.nextElementSibling?.click();
                else
                    document.querySelector('.item')?.click();
                e.preventDefault();
            }
            if(e.key === 'ArrowUp') {
                if(selected)
                    selected.previousElementSibling?.click();
                else
                    document.querySelector('.item')?.click();
                e.preventDefault();   
            }
            if(e.key === 'Enter') {
                if(selected) {
                    ItemList.#openItemLink(parseInt(selected.dataset.id));
                    e.preventDefault();
                }
            }
        });
    }
}