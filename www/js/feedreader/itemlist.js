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

    static #listTemplate = template(`
        <div class='newItems hidden'>Click to show new items</div>
        <div>
            {{#each items}}
                <div class='item' data-id='{{id}}' data-feed='{{nodeId}}'></div>
            {{/each}}
        </div>
    `);

    static #itemTemplate = template(`
        <span class='date'>{{time}}</span>
        <span class='title' data-read='{{read}}'>{{title}}</span>
    `);

    #itemUpdated(item) {
        let title = item.title;

        // For items that have no title, create one from the description
        if (!title || title.trim().length === 0)
            if (item.description && item.description.length > 0) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(item.description, 'text/html');
                const textContent = doc.body.textContent || '';
                title = textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
            } else {
                title = 'No title';
            }

        render(`.item[data-id="${item.id}"]`, ItemList.#itemTemplate, {
            time: DateParser.getShortDateStr(item.time),
            read: item.read,
            title
        });
    }

    // load all items from the given node id
    async #loadFeed(id) {
        const node = FeedList.getNodeById(id);
        const items = await node.getItems();

        this.selected = undefined;
        this.displayedFeedId = id;

        // FIXME: handle folders

        if(window.app.debug)
            console.debug(`Loading items for feed ${node.title}`, items);

        render('#itemlistViewContent', ItemList.#listTemplate, {
            node,
            items: items.sort((a, b) => b.time - a.time)
        });
        items.forEach((i) => this.#itemUpdated(i));
    }

    async #toggleItemRead(id) {
        const item = await Item.getById(id);
        const node = FeedList.getNodeById(item.nodeId);

        item.setRead(!item.read);
        node.updateUnread(item.read?-1:1);
    }

    async #itemSelected(id, nodeId) {
        const item = await Item.getById(id);
        
        if(nodeId !== this.displayedFeedId)
            await this.#loadFeed(nodeId);

        [...document.querySelectorAll('.item.selected')]
            .forEach((n) => n.classList.remove('selected'));
        let itemNode = document.querySelector(`.item[data-id="${id}"]`);
        itemNode.classList.add('selected');
        itemNode.scrollIntoView({ block: 'nearest' });
        
        document.getElementById('itemlist').focus();

        this.selected = item;
        if(!item.read)
            await this.#toggleItemRead(id);
    }

    // select next unread
    async nextUnread() {
        let item, node, id;

        if(this.selected) {
            node = FeedList.getNodeById(this.selected.nodeId)
            id = this.selected.id;
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

        if(item)
            FeedReader.select(node.id, item.id);
    }

    #openItemLink = async (id) =>
        window.open((await Item.getById(id)).source, '_system', 'location=yes');

    constructor() {
        document.addEventListener('itemUpdated',  (e) => this.#itemUpdated(e.detail));
        document.addEventListener('itemSelected', (e) => this.#itemSelected(e.detail.id, e.detail.feedId));
        document.addEventListener('feedSelected', (e) => this.#loadFeed(e.detail.id));
        document.addEventListener('itemsAdded',   (e) => {
            if(e.detail.feedId == this.displayedFeedId)
                document.querySelector('#itemlistViewContent .newItems').classList.remove('hidden');
        });

        // handle mouse events
        ev.connect('click',    '.item', (el) => FeedReader.select(parseInt(el.dataset.feed), parseInt(el.dataset.id)));
        ev.connect('auxclick', '.item', (el) => this.#toggleItemRead(parseInt(el.dataset.id)), (e) => e.button == 1);
        ev.connect('dblclick', '.item', (el) => this.#openItemLink(parseInt(el.dataset.id)));
        ev.connect('click',    '.newItems', () => {
            document.querySelector('.newItems').classList.add('hidden');
            this.#loadFeed(this.displayedFeedId);
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
                    this.#openItemLink(parseInt(selected.dataset.id));
                    e.preventDefault();
                }
            }
        });
    }
}