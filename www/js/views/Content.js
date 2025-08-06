// vim: set ts=4 sw=4:

import { Section } from '../models/Section.js';
import { HomeView } from './Home.js';
import { CatalogView } from './Catalog.js';
import { FeedsView } from './Feeds.js';
import { FolderView } from './Folder.js';
import { FeedReaderView } from './FeedReader.js';
import { SettingsView } from './Settings.js';
import { OPFSFileBrowserView } from './FileBrowser.js';
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
// Content type switching happens by
// 
// - CLI input keyboard Enter
// - by mouse clicks selecting content from the sidebar
// - by location hash change
//
// For CLI inputs the first character indicates the type of content to 
// render so we can switch the mode.

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
                <div id="aiChatView">
                    <div class="container">
                        <div class="content">
                        </div>
                    </div>
                </div>
            </div>
        `), {});
        new HomeView(ContentView.switch('content'));
        Array.from(document.getElementsByClassName('main-content-view')).forEach((el) => {
            el.onclick = () => el.focus();
        });

    }

    static #resetScroll = () => document.getElementById('breadcrumb-nav').scrollIntoView({ behavior: 'instant', block: 'center' });

    // Render all content that needs to be shown in #main-content-content
    //
    // Routing schema:
    // - for internal navigation   -/<route>
    // - for installed content     <group>/[<folder>/[...]]<file>
    //
    // For installed content a file extension based renderer will be used.
    static async render(path) {
        const internalRoutes = {
            CLI      : {
                switch : 'chat',
                view   : undefined
            },
            Feeds    : {
                switch : 'content',
                view   : FeedsView
            },
            Feed     : {
                switch : 'feedreader',
                view   : FeedReaderView
            },
            Settings : {
                switch : 'content',
                view   : SettingsView
            },
            OPFS     : {
                switch : 'content',
                view   : OPFSFileBrowserView
            }
        };

        ContentView.#resetScroll();

        if(0 == path.indexOf('-/')) {
            const name = path.split('/')[1];
            if(!Object.keys(internalRoutes).includes(name)) {
                ContentView.switch('content').innerHTML = `ERROR: No internal route for ${name}`;
                return;
            }

            const target = ContentView.switch(internalRoutes[name].switch);
            if (internalRoutes[name].view)
                new internalRoutes[name].view(target, path);

            return;
        }

        const el = ContentView.switch('content');
        const id = path.replace(/\//g, ':::');
        const s = await Section.get(id);
        
        if (s.nodes) {
            // if path is toplevel it is a section and we render the catalog settings
            if (-1 == id.indexOf(':::'))
                // For a group (toplevel folder) we render a catalog
                new CatalogView(el, path);
            else
                // otherwise we render a folder overview
                new FolderView(el, path);
            return;
        }

        const d = await Section.getDocument(id);
        if (!d) {
            el.innerHTML = `<h1>ERROR: Document not found</h1>`;
            console.error(`No document found for ${path}`);
            return;
        }

        const extension = d.baseName.split('.').pop().toLowerCase();
        if (!Object.keys(ContentView.#renderers).includes(extension)) {
            el.innerHTML = `<h1>ERROR: No renderer for ${extension} files</h1>`;
            return;
        } else {
            await ContentView.#renderers[extension].load(el, d)
        }
    }

    /* Switch different type of content views and return content element */
    static switch(name) {
        let el;

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

        return el;
    }
}