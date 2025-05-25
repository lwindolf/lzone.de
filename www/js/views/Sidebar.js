// vim: set ts=4 sw=4:

import { Section } from "../models/Section.js";
import { FeedList } from "../feedreader/feedlist.js";
import * as r from "../helpers/render.js";

/* Dynamic sidebar building for installed content */

export class Sidebar {
    // state
    #el;

    static #template = r.template(`
        {{#* inline "sidebarChildNode"}}
            <li class="nav-list-item" data-path="{{ id }}">
                <a href="#" class="nav-list-expander"><svg viewBox="0 0 24 24"><use xlink:href="#svg-arrow-right"></use></svg></a>
                <a data-path="{{ id }}" class="nav-list-link" href="/#/{{#reSub ":::" "/"}}{{id}}{{/reSub}}">{{ name }}</a>
                <ul data-path="{{ id }}" class="nav-list">
                    {{#each nodes }}
                        {{> sidebarChildNode }}
                    {{/each}}
                </ul>
            </li>
        {{/inline}}

        {{#each tree.nodes }}
            <ul class="nav-list">
                    <li class="nav-list-item" data-path="settings">
                            <a class="nav-list-link pwa-title" data-path="{{ @key }}" href="/#/{{ @key }}">
                                    {{ @key }}
                                    <span class="pwa-settings">⚙</span>
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
            {{#if feed.error}}
                ⛔&nbsp;
            {{else}}
                {{#if feed.icon}}
                    <img class='icon' src='{{feed.icon}}'/>
                {{/if}}
            {{/if}}
            <span class='title'>
                {{{feed.title}}}
            </span>
            <span class='count' data-count='{{feed.unreadCount}}'>{{feed.unreadCount}}</span>
        {{/inline}}
   
        <!-- FeedReader section -->
        <ul class="nav-list">
                <li class="nav-list-item" data-path="settings">
                        <a class="nav-list-link pwa-title" data-path="feeds" href="/#/Feeds">
                                Feeds
                                <span class="pwa-settings">⚙</span>
                        </a>
                </li>
        </ul>
        <div id="feedlist">
            <ul class="nav-list" id='feedlistViewContent'>
                {{#each feedlist.children }}
                    <li class='nav-list-item' data-id='{{id}}'>
                        <a data-path="Feed:::{{id}}" class="nav-list-link" href="/#/Feed/{{id}}">
                            <div class="feed">
                                {{> sidebarChildFeed feed=this }}
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
        document.addEventListener('nodeUpdated', this.#render);

        document.addEventListener("sections-updated", this.#render);
        document.addEventListener('click', (e) => {
            var target = e.target;
            while (target && !(target.classList && target.classList.contains('nav-list-expander'))) { 
                target = target.parentNode;
            }
            if (target) {
                e.preventDefault();
                target.parentNode.classList.toggle('active');
            }
        });
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
        const cssPath = path.replaceAll(/\//g, ":::");

        try {
            // Close nav per CSS on mobile
            document.getElementById('site-nav').classList.remove('nav-open');

            // Collapse previous selected
            Array.from(document.getElementsByClassName("active")).forEach((p) => p.classList.remove('active'));

            if("" === path)
                return;

            // Open section
            document.querySelector(`li[data-path="${cssPath.replace(/:::.*/, "")}"]`)?.classList.add('active');

            // Open sub entries
            let tmp = cssPath;
            while (tmp.indexOf(':::') !== -1) {
                Array.from(document.querySelectorAll(`li[data-path="${tmp}"]`)).forEach(
                    (p) => p.classList.add('active')
                );
                tmp = tmp.replace(/:::[^:]+$/, "");
            }

            // Selection marker
            document.querySelector(`a[data-path="${cssPath}"]`).classList.add('active');

            // Scroll to selected menu
            document.querySelector(`li[data-path="${cssPath}"]`).scrollIntoView({ block: "nearest" });
        } catch (e) {
            console.error(`select "${cssPath}" caused: ${e}`);
        }
    }
}