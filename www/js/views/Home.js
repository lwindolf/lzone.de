import { ChecksView } from "./Checks.js";
import { Section } from "../section.js";
import * as r from "../helpers/render.js";

export class HomeView {
    constructor(el) {
        Section.getAll().then(async (sections) => {
            el.innerHTML = r.template(`
                <div class="about">
                        {{#compare aiPromptHistory.length '==' 0 }}
                                <p>
                                        LZone is a progressive web app by <a href="/#/lwindolf">Lars Windolf</a> that supports
                                        installing a ton of Sysadmin / DevOps / System Architecture related content
                                        so that you can search and read all of it in one place.
                                </p>
                        {{/compare}}

                        <div id='home-content'>
                                <h2>Content</h2>

                                <div>
                                        {{#each sections}}
                                                <button onclick="document.location.hash='/{{this.name}}'" class="homeViewCheatSheetBtn btn fs-4">
                                                        {{ this.name }}
                                                </button>
                                        {{/each}}
                                </div>
                        </div>
                </div>

                <div id="toolpanelHome"></div>    
            `)({
                sections
            });

            // Is not always visible depends on CSS
            new ChecksView(document.getElementById('toolpanelHome'));
        });
    }
}