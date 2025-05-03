// vim: set ts=4 sw=4:

import { CLI } from './CLI.js';
import { Section } from './models/Section.js';
import { Sidebar } from './views/Sidebar.js';
import { Search } from './search.js';
import { ContentView } from './views/Content.js';

import { HomeView } from './views/Home.js';
import { AboutView } from './views/About.js';
import { SettingsView } from './views/Settings.js';
import { ChecksView } from './views/Checks.js';
import { CheatSheetView } from './views/CheatSheet.js';
import { CheatSheetCatalog } from './models/CheatSheetCatalog.js';

export class LZone {
    // state
    static #path = "";      // currently selected menu path (e.g. 'Examples/Something/Page') empty for Home

    // routes all rendering into #main-content-content
    static #routes = {
        'about'    : AboutView,
        'settings' : SettingsView,
        'checks'   : ChecksView
    };

    static #getParams() {
        let params = {};

        try {
            // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript (2nd answer)
            let match,
                pl = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            while (match = search.exec(window.location.hash.substring(1)))
                params[decode(match[1])] = decode(match[2]);
        } catch (e) {
            console.log("Invalid parameter encoding! " + e);
        }
        return params;
    }

    // Simple routing based on location hash values
    static #onLocationHashChange() {
        if('/' == window.location.pathname) {
            if(window.location.hash.length > 2) {
                // handle in document anchors
                if(window.location.hash[1] != '/')
                    return;

                const tmp = window.location.hash.split(/\//);
                if(tmp[1] in LZone.#routes) {
                    LZone.#pathChanged(tmp[1]);
                    new LZone.#routes[tmp[1]](ContentView.switch('content'));
                    return;
                }

                // URI hash starting with a slash indicates a content load
                if ('/' == window.location.pathname && '/' == window.location.hash.substring(1, 2)) {
                    const path = Object.keys(LZone.#getParams())[0].substring(1);
                    LZone.#pathChanged(path);
                    new CheatSheetView(ContentView.switch('content'), path);
                    return;
                }
            }
        }

        new HomeView(ContentView.switch('content'));
        LZone.#pathChanged('');
    }

    static getPath = () => this.#path;

    // handle path changes (add bread crumb and sidebar collapsing)
    static #pathChanged(path) {
        LZone.#path = path;

        // JTD doesn't give us a bread crumb, so add one
        if (!document.getElementById('breadcrumb-nav'))
            document.getElementById('main-content-wrap').insertAdjacentHTML("afterbegin",
            `<nav class="breadcrumb-nav">
                <ol class="breadcrumb-nav-list" id="breadcrumb-nav">
                </ol>
            </nav>`);

        // Close nav on mobile
        document.getElementById('site-nav').classList.remove('nav-open');

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

        Sidebar.selectionChanged();
    }

    static async load() {
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.register('/worker.js');

        await Section.init();
        await CheatSheetCatalog.update();

        window.addEventListener("hashchange", this.#onLocationHashChange);
        await ContentView.setup('main-content-wrap');
        this.#onLocationHashChange();

        Search.init();
        new CLI('search-input');
        new ChecksView(document.getElementById('toolpanel'));
    }
}