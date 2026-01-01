// vim: set ts=4 sw=4:

// Item list rendering view
//
// Renders a list of items, allow selective item updates, on new items shows a banner
// at the top to allow the user to show new items

import { FeedList } from './feedlist.js';
import { FeedReader } from './feedreader.js';
import { Item } from './item.js';
import { DateParser } from './parsers/date.js';

import { Action } from '../helpers/Action.js';
import { View } from '../helpers/View.js';
import { template, render } from '../helpers/render.js';
import * as ev from '../helpers/events.js';

export class ItemList extends View {
    static #itemTemplate = template(`
        <span class='date'>{{time}}</span>
        <span class='title' data-read='{{read}}'>
            {{#if starred}}<span class='star'>⭐</span>{{/if}}
            {{title}}
        </span>
    `);

    // state
    #items;         // currently displayed items

    constructor(root) {
        super({
            root,
            template: `
                <div class='newItems hidden'>Click to show new items</div>
                <div>
                {{#each items}}
                        <div class='item context-node' data-id='{{id}}' data-feed='{{nodeId}}'></div>
                {{/each}}
                </div>
            `,
            dataEvents: [
                "feedSelected"
            ],
            mapper: async (data) => {
                const node = FeedList.getNodeById(data.id);
                if(!node)
                    return { };

                this.#items = await node.getItems();

                // FIXME: handle folders

                console.log(`ItemList Loading items for node ${node.title}`, this.#items);

                return {
                    node,
                    items: this.#items.sort((a, b) => b.time - a.time)
                }
            },
            postRender: async () => {
                this.#items?.forEach((i) => this.#itemUpdated(i));

                root.ownerDocument.getElementById('itemlistViewContent').scrollTop = 0;
            }
        });

        document.addEventListener('itemUpdated',  (e) => this.#itemUpdated(e.detail));
        document.addEventListener('itemSelected', (e) => this.#itemSelected(e.detail.id, e.detail.feedId));
        document.addEventListener('itemsAdded',   (e) => {
            if(e.detail.feedId == this.getData().id)
                document.querySelector('#itemlistViewContent .newItems').classList.remove('hidden');
        });

        // handle mouse events
        ev.connect('click',    '.item', (el) => FeedReader.select(parseInt(el.dataset.feed), parseInt(el.dataset.id)));
        ev.connect('auxclick', '.item', (el) => Action.dispatch('feedreader:toggleItemRead', { id: parseInt(el.dataset.id) }, (e) => e.button == 1));
        ev.connect('dblclick', '.item', (el) => this.openItemLink(parseInt(el.dataset.id)));
        ev.connect('click',    '.newItems', () => {
            document.querySelector('.newItems').classList.add('hidden');
            FeedReader.select(this.displayedFeedId, undefined);
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
                    this.openItemLink(parseInt(selected.dataset.id));
                    e.preventDefault();
                }
            }
        });
    }

    openItemLink = async (id) =>
        window.open((await Item.getById(id)).source, '_system', 'location=yes');

    async #itemSelected(id) {
        const item = await Item.getById(id);

        [...document.querySelectorAll('.item.selected')]
            .forEach((n) => n.classList.remove('selected'));
        let itemNode = document.querySelector(`.item[data-id="${id}"]`);
        itemNode.classList.add('selected');
        itemNode.scrollIntoView({ block: 'nearest' });
        
        document.getElementById('itemlist').focus();

        console.log('ItemList Item selected:', item);
        this.selected = item;
        if(!item.read)
            Action.dispatch('feedreader:toggleItemRead', { id });
    }

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
            starred: item.starred,
            title
        });
    }
}