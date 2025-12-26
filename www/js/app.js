// vim: set ts=4 sw=4:

import { CLI } from './CLI.js';
import { Commands } from './commands.js';
import { Layout } from './layout.js';
import { Sidebar } from './views/Sidebar.js';
import { Search } from './search.js';
import { ContentView } from './views/Content.js';
import { ChecksView } from './views/Checks.js';
import { CheatSheetCatalog } from './models/CheatSheetCatalog.js';
import { HelpDialog } from './dialogs/help.js';
import { keydown } from './helpers/events.js';
import { FeedReader } from './feedreader/feedreader.js';

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
        if(window.location.hash.length > 2) {
            // everything that does not start with / we treat as document anchors
            if(window.location.hash[1] != '/')
                return;

            // URI hash starting with a slash indicates a content view load
            if ('/' == window.location.hash.substring(1, 2)) {
                const path = App.getPath();
                App.#pathChanged(path);
                ContentView.render(path);
                return;
            }

            console.warn("Unknown location hash format: " + window.location.hash);
            return;
        }

        App.#pathChanged('');
    }

    static getPath = () =>  Object.keys(App.#getParams())[0].substring(1);

    static #setBreadcrumb = (path) =>
        (path === '') ?
            document.getElementById('breadcrumb-nav').innerHTML = ""
        :    
            document.getElementById('breadcrumb-nav').innerHTML = `<li class="breadcrumb-nav-list-item"><a href="/"><svg viewBox="0 0 24 24"><use xlink:href="#svg-home"></use></svg></a></li>` + path.split(/\//).reverse().map((p, i, arr) => {
                if (p === '-')
                    return '';
                if (0 == i)
                    return `<li class="breadcrumb-nav-list-item"><span>${decodeURIComponent(p)}</span></li>`;
                else
                    return `<li class="breadcrumb-nav-list-item"><a href="#/${path.split(/\//).slice(0, arr.length-i).join('/')}">${decodeURIComponent(p)}</a></li>`;
            }).reverse().join(" ");      

    static #pathChanged(path) {
        this.#setBreadcrumb(path);
        Sidebar.selectionChanged(path);
    }

    static async load() {
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.register('/worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker registration failed: ', error);
            });

        window.app = {
            debug       : false,
            FeedReader  : new FeedReader(),
            Layout      : new Layout(),
            Commands,
            Sidebar     : new Sidebar(document.getElementById('site-nav')),
            ContentView : new ContentView(document.getElementById('main-content-wrap'))
        };

        await CheatSheetCatalog.update();

        window.addEventListener("hashchange", this.#onLocationHashChange);
        this.#onLocationHashChange();

        Search.init();
        new CLI('search-input');
        new ChecksView(document.getElementById('toolpanel'));

        // Note: for wide browser compatibility use only hotkeys used by Google Drive, see docs
        // https://support.google.com/drive/answer/2563044?hl=en&sjid=12990221386685109012-EU

        keydown('body', /* F1 */            (e) => (e.keyCode === 112),             () => new HelpDialog());
    }
}