// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { ChecksView } from "./Checks.js";
import { Section } from "../models/Section.js";
import * as r from "../helpers/render.js";

export class HomeView {
    constructor(el) {
        this.#render(el);
    }

    async #render(el) {
        el.innerHTML = r.template(`
            <div class="about">
                    {{{ welcome }}}

                    <div id='home-content'>
                            <h3>Content</h3>

                            <div>
                                    {{#each sections.nodes as |groups groupId| }}
                                        <div>
                                            <b>{{ @key }}</b>:
                                            {{#each nodes}}
                                                &nbsp;
                                                <a href="/#/{{ groupId }}/{{ @key }}">{{ @key }}</a>
                                            {{/each}}
                                        </div>
                                    {{/each}}
                            </div>
                    </div>
            </div>

            <div id="toolpanelHome"></div>    
        `)({
            welcome: Config.welcome,
            sections: await Section.getTree()
        });
        console.log("HomeView rendered");
        console.log(await Section.getTree());
        // Is not always visible depends on CSS
        new ChecksView(document.getElementById('toolpanelHome'));
    }
}