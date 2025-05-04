// vim: set ts=4 sw=4:

import { CLI } from './CLI.js';
import { Section } from './models/Section.js';
import { Sidebar } from './views/Sidebar.js';
import { Search } from './search.js';
import { ContentView } from './views/Content.js';

import { HomeView } from './views/Home.js';
import { CatalogView } from './views/Catalog.js';
import { ChecksView } from './views/Checks.js';
import { CheatSheetView } from './views/CheatSheet.js';
import { CheatSheetCatalog } from './models/CheatSheetCatalog.js';

export class App {
    static #getParams() {
        let params = {};

        try {
            // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript (2nd answer)
            let match,
                pl = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            while ((match = search.exec(window.location.hash.substring(1))))
                    params[decode(match[1])] = decode(match[2]);
        } catch (e) {
            console.log("Invalid parameter encoding! " + e);
        }
        return params;
    }

    // Simple routing based on location hash values
    static #onLocationHashChange() {
        const routes = {
            'catalog'  : CatalogView,
            'checks'   : ChecksView
        };

        if('/' == window.location.pathname) {
            if(window.location.hash.length > 2) {
                // handle in document anchors
                if(window.location.hash[1] != '/')
                    return;

                const tmp = window.location.hash.split(/\//);
                if(tmp[1] in routes) {
                    App.#pathChanged(tmp[1]);
                    new routes[tmp[1]](ContentView.switch('content'), tmp);
                    return;
                }

                // URI hash starting with a slash indicates a content load
                if ('/' == window.location.pathname && '/' == window.location.hash.substring(1, 2)) {
                    const path = Object.keys(App.#getParams())[0].substring(1);
                    App.#pathChanged(path);
                    new CheatSheetView(ContentView.switch('content'), path);
                    return;
                }
            }
        }

        new HomeView(ContentView.switch('content'));
        App.#pathChanged('');
    }

    // handle path changes (add bread crumb and sidebar collapsing)
    static #pathChanged(path) {
        // Add breadcrumb
        if(-1 == path.indexOf('/')) {
            // Hide at 1st level
            document.getElementById('breadcrumb-nav').innerHTML = '';
        } else {
            document.getElementById('breadcrumb-nav').innerHTML = `<li class="breadcrumb-nav-list-item"><a href="/"><svg viewBox="0 0 24 24"><use xlink:href="#svg-home"></use></svg></a></li>` + path.split(/\//).reverse().map((p, i, arr) => {
                if (0 == i)
                    return `<li class="breadcrumb-nav-list-item"><span>${decodeURIComponent(p)}</span></li>`;
                else
                    return `<li class="breadcrumb-nav-list-item"><a href="#/${path.split(/\//).slice(0, arr.length-i).join('/')}">${decodeURIComponent(p)}</a></li>`;
            }).reverse().join(" ");
        }

        Sidebar.selectionChanged(path);
    }

    static async load() {
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.register('/worker.js');

        new Sidebar(document.getElementById('site-nav'));
        new ContentView(document.getElementById('main-content-wrap'));
        await Section.init();
        await CheatSheetCatalog.update();

        window.addEventListener("hashchange", this.#onLocationHashChange);
        this.#onLocationHashChange();

        Search.init();
        new CLI('search-input');
        new ChecksView(document.getElementById('toolpanel'));
    }
}