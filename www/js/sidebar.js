// vim: set ts=4 sw=4:

import { Section } from "./section.js";
import { LZone } from "./app.js";

/* The "Content" sidebar building inside Just-The-Docs */

export class Sidebar {
    static async update() {
        let sections = await Section.getAll();
        let result = "";

        // FIXME: get rid of this
        if(0 == window.location.pathname.indexOf('/') &&
           window.location.pathname.length > 1)
            return;

        if(!document.querySelector('#extra-nav')) {
            /* create navigation structure inside just-the-docs nav tree */
            document.getElementById('site-nav').innerHTML = `
                    <ul class="nav-list">
                            <li class="nav-list-item" data-path="settings">
                                    <a class="nav-list-link pwa-title" data-path="settings" href="/#/settings">
                                            Content
                                            <span class="pwa-settings">⚙</span>
                                    </a>
                            </li>
                    </ul>
                    <ul class="nav-list" id="extra-nav">
                        <li class="nav-list-item">
                            <div class="nav-list-link" href="">
                                <span class="pwa-status">Loading...</span>
                            </div>
                        </li>
                    </ul>
                    <!-- <hr/>
                    <ul class="nav-list">
                            <li class="nav-list-item" data-path="note-settings">
                                    <a class="nav-list-link pwa-title" data-path="note-settings" href="/#/note-settings">
                                            Notes
                                            <span class="pwa-settings">⚙</span>
                                    </a>
                            </li>
                    </ul>
                    <ul class="nav-list" id="notes-nav">
                        <li class="nav-list-item">
                            <div class="nav-list-link" href="">
                                <span class="pwa-status">Loading...</span>
                            </div>
                        </li>
                    </ul>-->
            `;
        }

        document.addEventListener('click', function(e) {
            var target = e.target;
            while (target && !(target.classList && target.classList.contains('nav-list-expander'))) { 
                target = target.parentNode;
            }
            if (target) {
                e.preventDefault();
                target.parentNode.classList.toggle('active');
            }
        });

        for(const s of sections) {
            result += this.#renderMenuSection(s);
        }
        document.getElementById('extra-nav').innerHTML = result;

        // sort sections
        var extraNav = document.getElementById('extra-nav');
        [...extraNav.children]
            .sort((a, b) => a.innerText > b.innerText ? 1 : -1)
            .forEach(node => extraNav.appendChild(node));       

        Sidebar.selectionChanged();
    }

    static #renderMenuSection(tree) {
        let section = tree.name;

        // FIXME: cache this
        function recursiveRender(parent) {
            return parent.children.sort().map((id) => {
                let d = tree.nodes[id];
                if(d?.children)
                    return `
                        <li class="nav-list-item" data-path="${section}:::${id}">
                            <a href="#" class="nav-list-expander"><svg viewBox="0 0 24 24"><use xlink:href="#svg-arrow-right"></use></svg></a>
                            <a data-path="${section}:::${id}" class="nav-list-link" href="/#/${section}/${id.replace(/:::/g, '/')}">${d.name}</a>
                            <ul data-path="${section}:::${id}" class="nav-list">
                                ${recursiveRender(d)}
                            </ul>
                        </li>
                    `;
                return `
                    <li data-path="${section}:::${id}" class="nav-list-item">
                        <a data-path="${section}:::${id}" class="nav-list-link" href="/#/${section}/${id.replace(/:::/g, '/')}">${d.name}</a>
                    </li>`;
            }).join("");
        }
        return `
            <li class="nav-list-item" data-path="${section}">
                    <a href="#" class="nav-list-expander"><svg viewBox="0 0 24 24"><use xlink:href="#svg-arrow-right"></use></svg></a>
                    <a data-path="${section}" class="nav-list-link" href="/#/${section}">${section}</a>
                    <ul data-path="${section}" class="nav-list">
                    ${recursiveRender(tree)}
                    </ul>
            </li>
        `;
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
            console.log(e);
        }

        // JTD: Auto close nav for small screens
        const siteNav = document.getElementById('site-nav');
        siteNav.classList.remove('nav-open');
    }
}