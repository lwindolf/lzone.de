// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import * as r from '../helpers/render.js';

// A view rendering results of multiple optional check tools

export class ChecksView {
    constructor(el) {
        // load all web components
        Object.values(Config.toolboxComponents).forEach(c => import(c.import));
        ChecksView.render(el);
    }

    static async render(el) {
        r.renderElement(el, r.template(`
            <div class="checks">
                {{#each tools}}
                    <h3>
                        {{@key}}
                        {{#if settings}}
                            <a href="/#/-/Settings/Tools/{{@key}}" class="settings">⚙</a>
                        {{/if}}
                    </h3>
                    <div class="check">
                        {{{embed}}}
                    </div>
                {{/each}}
            </div>
		`), {
            tools: Config.toolboxComponents
        });
    }
}
