import { Settings } from "../models/Settings.js";
import * as r from "../helpers/render.js";

// Viewing different types of content
//
// Knows 3 types
//
// 1. chat bot conversion and mixed in special CLI command results
// 2. cheat sheet contents
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
    }

    /* Switch different type of content views and return content element */
    static switch(name) {
        let el;

        [...document.querySelectorAll('.main-content-view')].forEach((el) => el.style.display = 'none');
        el = document.getElementById(`main-content-${name}`);
        el.style.display = 'block';

        return el;
    }
}