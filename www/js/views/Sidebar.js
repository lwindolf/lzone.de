// vim: set ts=4 sw=4:

import { Section } from "../models/Section.js";
import { LZone } from "../app.js";
import * as r from "../helpers/render.js";

/* Dynamic sidebar building for installed content */

export class Sidebar {
    static #clickHandler;
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
                            <a class="nav-list-link pwa-title" data-path="catalog:::{{ @key }}" href="/#/catalog/{{ @key }}">
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
    `);

    static async update() {
        if(!this.#clickHandler)
            this.#clickHandler = document.addEventListener('click', (e) => {
                var target = e.target;
                while (target && !(target.classList && target.classList.contains('nav-list-expander'))) { 
                    target = target.parentNode;
                }
                if (target) {
                    e.preventDefault();
                    target.parentNode.classList.toggle('active');
                }
            });

        r.render('#site-nav', this.#template, {
            tree: await Section.getTree()
        });

        Sidebar.selectionChanged();
    }

    static selectionChanged() {
        const path = LZone.getPath();
        const cssPath = path.replaceAll(/\//g, ":::");

        try {
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

        // JTD: Auto close nav for small screens
        const siteNav = document.getElementById('site-nav');
        siteNav.classList.remove('nav-open');
    }
}

document.addEventListener('sections-updated', async () => {
    Sidebar.update();
});
