// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { ChecksView } from "./Checks.js";
import { Section } from "../models/Section.js";
import * as r from "../helpers/render.js";

export class HomeView {
    constructor(el) {
        el.innerHTML = r.template(`
            <div class="about">
                    {{{ welcome }}}

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
            welcome: Config.welcome,
            sections: Section.getTree()
        });

        // Is not always visible depends on CSS
        new ChecksView(document.getElementById('toolpanelHome'));
    }
}