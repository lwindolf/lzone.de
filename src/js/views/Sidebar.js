// vim: set ts=4 sw=4:

import { FeedList } from "../feedreader/feedlist.js";
import { Section } from "../models/Section.js";
import { Action } from "../helpers/Action.js";

import * as r from "../helpers/render.js";

/* Dynamic sidebar building for installed content 

   triggers action:
   - sidebar:<type>::middleClick
 */

export class Sidebar {
    // state
    #el;

    static #template = r.template(`
        {{#* inline "sidebarChildNode"}}
            <li class="nav-list-item" data-path="{{ id }}">
                {{#notEmpty nodes}}
                    <a href="#" class="nav-list-expander"><svg viewBox="0 0 24 24"><use xlink:href="#svg-arrow-right"></use></svg></a>
                {{/notEmpty}}
                <a data-path="{{ id }}" class="nav-list-link" href="#/{{#reSub ":::" "/"}}{{id}}{{/reSub}}">{{ name }}</a>
                <ul data-path="{{ id }}" class="nav-list">
                    {{#each nodes }}
                        {{> sidebarChildNode }}
                    {{/each}}
                </ul>
            </li>
        {{/inline}}

        {{#each tree.nodes }}
            <ul class="nav-list">
                    <li class="nav-list-item" data-path="{{ @key }}">
                            <a class="nav-list-link pwa-title" data-path="{{ @key }}" href="#/{{ @key }}">
                                    {{ @key }}
                            </a>
                    </li>
            </ul>
            <ul class="nav-list">
                {{#each nodes }}
                    {{> sidebarChildNode }}
                {{/each}}
            </ul>
        {{/each}}

        {{#* inline "sidebarChildFeed"}}
            {{#if error}}
                ⛔&nbsp;
            {{else}}
                {{#if iconData}}
                    <img class='icon' src='{{iconData}}'/>
                {{else}}
                    <img class='icon' src='default.svg'/>
                {{/if}}
            {{/if}}
            <span class='title'>
                {{{title}}}
            </span>
            <span class='count' data-count='{{unreadCount}}'>{{unreadCount}}</span>
        {{/inline}}
   
        <!-- FeedReader section -->
        <ul class="nav-list">
                <li class="nav-list-item context-node" data-type='folder' data-path="feeds">
                        <a class="nav-list-link pwa-title" data-path="feeds" href="#/-/Feeds">
                                Feeds
                        </a>
                </li>
        </ul>
        <div id="feedlist">
            <ul class="nav-list" id='feedlistViewContent'>
                {{#each feedlist.children }}
                    <li class='nav-list-item context-node' data-type='feed' data-id='{{id}}'>
                        <a data-path="-:::Feed:::{{id}}" class="nav-list-link" href="#/-/Feed/{{id}}">
                            <div class="feed">
                                {{> sidebarChildFeed }}
                            </div>
                        </a>
                    </li>
                {{/each}}
            </ul>
        </div>
    `);

    constructor(el) {
        this.#el = el;
        this.#render();

        // Set event handlers for URL dropping
        el.addEventListener("dragover",  this.#onDragOver.bind(this));
        el.addEventListener("dragleave", this.#onDragOut.bind(this));
        el.addEventListener("dragend",   this.#onDragOut.bind(this));
        el.addEventListener("drop",      this.#onDrop.bind(this));

        // Listen for feed updates
        document.addEventListener('nodeRemoved', this.#render);
        document.addEventListener('nodeUpdated', (ev) => {    
            const id = ev.detail.id;       
            const feed = el.querySelector(`#feedlist .nav-list-item[data-id="${id}"]`);
            if (feed) {
                const feedTitle   = feed.querySelector('.title');
                const unreadCount = feed.querySelector('.count');
                const icon        = feed.querySelector('.icon');
                if (feedTitle.textContent != ev.detail.title)
                    feedTitle.textContent = ev.detail.title;
                if (unreadCount.textContent != '' + ev.detail.unreadCount)
                    unreadCount.textContent = ev.detail.unreadCount;
                unreadCount.dataset.count = ev.detail.unreadCount;

                if (icon && ev.detail.iconData)
                    icon.src = ev.detail.iconData;
            } else {
                this.#render();
            }
        });

        document.addEventListener('sections-updated', this.#render);

        // Left click focusses parent and changes selection
        el.addEventListener('click', (ev) => {
            var target = ev.target;            
            this.#el.focus();

            while (target && !(target.classList && target.classList.contains('nav-list-expander'))) { 
                target = target.parentNode;
            }
            if (target) {
                ev.preventDefault();
                target.parentNode.classList.toggle('active');
            }
        });

        /* For middle clicks we trigger an action "sidebar:<type>::middleClick" so
           specific node types can register an optional handler */
        el.addEventListener('auxclick', (ev) => {
            var target = ev.target;

            if (ev.button !== 1)
                return;

            while (target && !target.classList.contains('nav-list-item')) { 
                target = target.parentNode;
            }
            if (target && target.classList.contains('nav-list-item')) {
                ev.preventDefault();
                Action.dispatch(`sidebar:${target.dataset.type}:middleClick`, target.dataset);
            }            
        });
        // Note: Right click "context-menu" is handled globally by ContextMenu.js
    }

    #onDrop(e) {
        e.preventDefault();

        let url;
        url = e.dataTransfer.getData('text/plain');

        if(!url)
            url = e.dataTransfer.getData('text/x-moz-url');
        if(!url)
            url = e.dataTransfer.getData('text/url-list')[0];

        alert("Dropped URL: " + url);
        this.#el.classList.remove('drag-over');
    }

    #onDragOver(e) {
        e.preventDefault(); // For Firefox
        this.#el.classList.add('drag-over');        
    }

    #onDragOut = () => this.#el.classList.remove('drag-over');

    #render = async () =>
        r.renderElement(this.#el, Sidebar.#template, {
            tree: await Section.getTree(),
            feedlist: FeedList.root
        });
    
    static selectionChanged(path) {
        const cssPath = path.replace(/\/$/, "")
                        .replaceAll(/\//g, ":::")
                        .replace(/:::Item:::[^:]*$/, "");   // FIXME: feed reader special handling: ignoring "/Item/xxx" part      

        try {
            const sidebar = document.getElementById('sidebar');
            
            // Collapse previous selected
            Array.from(sidebar.getElementsByClassName("active")).forEach((p) => p.classList.remove('active'));
            // Remove previous selection marker
            Array.from(sidebar.getElementsByClassName("selected")).forEach((p) => p.classList.remove('selected'));

            if("" === path)
                return;

            // Open section parents
            let tmp = cssPath;
            while (tmp.indexOf(':::') !== -1) {
                Array.from(sidebar.querySelectorAll(`li[data-path="${tmp}"]`)).forEach(
                    (p) => p.classList.add('active')
                );
                tmp = tmp.replace(/:::[^:]*$/, "");
            }

            // Selection marker
            const target = sidebar.querySelector(`a[data-path="${cssPath}"]`);
            target?.classList.add('active');
            target?.classList.add('selected');

            // Scroll to selected menu
            target?.scrollIntoView({ block: "nearest" });
        } catch (e) {
            console.error(`select "${cssPath}" caused: ${e}`);
        }
    }
}