// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { Section } from '../models/Section.js';
import { HomeView } from './Home.js';
import { CheatSheetRenderer } from './renderers/CheatSheet.js';
import { PdfRenderer } from './renderers/Pdf.js';
import * as r from "../helpers/render.js";

// Viewing different types of content
//
// Knows 3 types
//
// 1. chat bot conversion and mixed in special CLI command results
// 2. different content renderers (cheat sheet markdown+HTML, PDf)
// 3. type a head find search results
//
// Content type switching happens only by location hash changes with
// the exception of searching where we want to show search results 
// without changing the location hash. For this there are helper
// methods showSearch() and hideSearch().

export class ContentView {
    // renderers per file extension
    static #renderers = {
        adoc     : CheatSheetRenderer,
        rst      : CheatSheetRenderer,
        asciidoc : CheatSheetRenderer,
        md       : CheatSheetRenderer,  
        htm      : CheatSheetRenderer,
        html     : CheatSheetRenderer,
        pdf      : PdfRenderer
    };

    // location hash based routing to views
    static #internalRoutes = {
        Catalog  : {
            switch : 'content',
            view   : 'Catalog'
        },
        CLI      : {
            switch : 'chat',
            view   : undefined
        },
        Discover : {
            switch : 'content',
            view   : 'Discover'
        },
        Feeds    : {
            switch : 'content',
            view   : 'Feeds'
        },
        Feed     : {
            switch : 'feedreader',
            view   : 'FeedReader'
        },
        Folder     : {
            switch : 'content',
            view   : 'Folder'
        },
        Settings : {
            switch : 'content',
            view   : 'Settings'
        },
        OPFS     : {
            switch : 'content',
            view   : 'OPFSFileBrowser'
        }
    };

    // Note: we expect only one instantiation
    constructor(el) {
        r.renderElement(el, r.template(`       
            <nav class="breadcrumb-nav">
                <ol class="breadcrumb-nav-list" id="breadcrumb-nav"></ol>
            </nav>

            <div id="main-content-content" class="main-content-view">
            </div>

            <div id="main-content-search" class="main-content-view">
                <div id="search-results" class="search-results">
                    Loading ...
                </div>
            </div>

            <div id="main-content-chat" class="main-content-view">
                <p class="loading">
                This is the combined CLI/chat view. By prefixing prompts with <code>?</code> you can ask questions here and get answers from the configured LLM.
                Enter <code>!help</code> to see available CLI commands. Not using a prefix will perform a content search.
                </p>

                <div id="aiChatView">
                    <div class="container">
                        <div class="content">
                        </div>
                    </div>
                </div>
            </div>
        `), {});
        new HomeView(ContentView.#switch('content'));
        Array.from(document.getElementsByClassName('main-content-view')).forEach((el) => {
            el.onclick = () => el.focus();
        });

    }

    static #resetScroll = () => document.getElementById('breadcrumb-nav').scrollIntoView({ behavior: 'instant', block: 'center' });

    static #load(name, path) {
        if(!Object.keys(ContentView.#internalRoutes).includes(name)) {
            ContentView.#switch('content').innerHTML = `ERROR: No internal route for ${name}`;
            return;
        }

        const target = ContentView.#switch(ContentView.#internalRoutes[name].switch);
        const view = ContentView.#internalRoutes[name].view;
        if(!view)
            return;
        import(`./${view}.js`).then((module) => {
            new module[`${view}View`](target, path);
        })
        .catch((err) => {
            ContentView.#switch('content').innerHTML = `ERROR: Loading view ${view} failed: ${err}`;
        });
    }

    // Render all content that needs to be shown in #main-content-content.
    //
    // Routing schema:
    // - for internal navigation   -/<route>
    // - for installed content     <group>/[<folder>/[...]]<file>
    //
    // For installed content a file extension based renderer will be used.
    static async render(path) {
        ContentView.#resetScroll();

        if(0 == path.indexOf('-/')) {
            ContentView.#load(path.split('/')[1], path);
            return;
        }

        const id = path.replace(/\//g, ':::');
        const s = await Section.get(id);
        
        if (s.nodes) {
            // if path is toplevel it is a section and we render the catalog settings
            if (-1 == id.indexOf(':::'))
                // For a group (toplevel folder) we render a catalog
                ContentView.#load('Catalog', path);
            else
                // otherwise we render a folder overview
                ContentView.#load('Folder', path);
            return;
        }

        const d = await Section.getDocument(id);
        if (!d) {
            el.innerHTML = `<h1>ERROR: Document not found</h1>`;
            console.error(`No document found for ${path}`);
            return;
        }

        const extension = d.baseName.split('.').pop().toLowerCase();
        const el = ContentView.#switch('content');
        if (!Object.keys(ContentView.#renderers).includes(extension)) {
            el.innerHTML = `ERROR: No renderer for ${extension} files`;
            return;
        } else {
            await ContentView.#renderers[extension].load(el, d)
        }
    }

    /* Switch different type of content views and return content element */
    static #switch(name) {
        let el;

        document.title = Config.siteName;  // always reset title on content view switch

        if(name === 'feedreader') {
            document.getElementById('main-content-wrap').style.display = 'none';
            el = document.getElementById('feedreader');
            el.style.display = 'block';
            return el;
        }

        [...document.querySelectorAll('.main-content-view')].forEach((el) => el.style.display = 'none');
        document.getElementById('main-content-wrap').style.display = 'block';
        el = document.getElementById(`main-content-${name}`);
        el.style.display = 'block';

        if((name !== 'chat') && (name !== 'search'))
            el.innerHTML = '';

        return el;
    }

    static getViewElement(name) {
        return document.getElementById(`main-content-${name}`);
    }

    static showSearch() {
        ContentView.#switch('search');
    }

    static hideSearch() {
        if(window.location.hash.startsWith('#/-/CLI'))
            ContentView.#switch('chat');
        else
            ContentView.#switch('content');
    }
}