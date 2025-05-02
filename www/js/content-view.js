import { Settings } from "./settings.js";
import * as r from "./helpers/render.js";

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
    static setup = async (id) => document.getElementById(id).innerHTML = r.template(`
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
                        {{#compare aiPromptHistory.length '>' 0 }}
                            Previous chat bot prompts:
                            <div class="answer">
                                <ul>
                                {{#each aiPromptHistory}}
                                    <li><code>{{.}}</code></li>
                                {{/each}}
                                </ul>
                            </div>
                        {{/compare}}
                    </div>
                </div>
            </div>
        </div>
    `)({
        aiPromptHistory: Settings.get('AIPromptHistory', [])
    });

    /* Switch different type of content views and return content element */
    static switch(name) {
        let el;

        [...document.querySelectorAll('.main-content-view')].forEach((el) => el.style.display = 'none');
        el = document.getElementById(`main-content-${name}`);
        el.style.display = 'block';

        return el;
    }
}