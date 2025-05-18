import { Section } from '../models/Section.js';
import { HomeView } from './Home.js';
import { CatalogView } from './Catalog.js';
import { FolderView } from './Folder.js';
import { CheatSheetRenderer } from './renderers/CheatSheet.js';
import { PdfRenderer } from './renderers/Pdf.js';
import * as r from "../helpers/render.js";
import { Ca } from '../vendor/chunks/mermaid.esm.min/chunk-ZKYS2E5M.mjs';

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
    }

    // render content using a file extension based renderer into #main-content-content
    static async render(path) {
        const el = document.getElementById('main-content-content');
        ContentView.switch('content');

        const id = path.replace(/\//g, ':::');
        const s = await Section.get(id);
console.log("path=", path, "id=", id, "s=", s);
        // if it has nodes it is a section and we should render an overview
        if (s.nodes && Object.keys(s.nodes).length > 0) {
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
            ContentView.#renderers[extension].load(el, d)
        }
    }

    /* Switch different type of content views and return content element */
    static switch(name) {
        let el;

        [...document.querySelectorAll('.main-content-view')].forEach((el) => el.style.display = 'none');
        el = document.getElementById(`main-content-${name}`);
        el.style.display = 'block';

        // FIXME: somehow scroll to content top
        // FIXME: should be a ContentView method
        //document.querySelector(`#main-content-content h1`).scrollIntoView({ block: "nearest" });

        return el;
    }
}