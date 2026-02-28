// vim: set ts=4 sw=4:

import { Settings } from '../models/Settings.js';
import * as r from '../helpers/render.js';

// A view rendering results of multiple optional check tools

export class ChecksView {
    constructor(el) {
        ChecksView.render(el);

        document.addEventListener('settings-changed', (e) => {
            if(0 == e.detail.name.indexOf("toolEnabled:::"))
                ChecksView.render(el);
        });
    }

    static async render(el) {
        Promise.all(Object.keys(window.Config.toolboxComponents).map(async (name) => {
            return {
                name,
                embed: window.Config.toolboxComponents[name].embed,
                settings: window.Config.toolboxComponents[name].settings,
                enabled: await Settings.get("toolEnabled:::" + name, window.Config.toolboxComponents[name].enabled)
            }
        })).then((tools) => {
            r.renderElement(el, r.template(`
                <div class="checks">
                    {{#each tools}}
                    {{#ifTrue enabled}}
                        <h3>
                            {{name}}
                            {{#if settings}}
                                <a href="#/-/Settings/Tools/{{name}}" class="settings">⚙</a>
                            {{/if}}
                        </h3>
                        <div class="check">
                            {{{embed}}}
                        </div>
                    {{/ifTrue}}
                    {{/each}}
                </div>
            `), {
                tools
            });
        });
    }
}
