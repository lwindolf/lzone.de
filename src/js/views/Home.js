// vim: set ts=4 sw=4:

import { ChecksView } from "./Checks.js";
import { Section } from "../models/Section.js";
import { View } from "../helpers/View.js";

export class HomeView extends View {
    constructor(el) {
        super({
            root: el,
            template: `
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
                                        <a href="#/{{ groupId }}/{{ @key }}">{{ @key }}</a>
                                    {{/each}}
                                </div>
                            {{/each}}
                        </div>
                    </div>
                </div>

                <div id="toolpanelHome"></div>
            `,
            mapper: async () => {
                return {
                    welcome: window.Config.welcome,
                    sections: await Section.getTree()
                };
            }
        });

        // Depending on layout the ChecksView is sometimes visible, so we need to instantiate it here
        new ChecksView(document.getElementById('toolpanelHome'));
    }
}