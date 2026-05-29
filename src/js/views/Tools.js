// vim: set ts=4 sw=4:

import { Settings } from '../models/Settings.js';
import * as r from '../helpers/render.js';

// A view rendering results of multiple optional check tools

export class ToolsView {
    static imported = false;

    constructor(el) {
        ToolsView.render(el).then(() => {
            // register mutation observer for all component root elements
            // on their "last-updated" data attribute
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    if (m.type === 'attributes' && m.attributeName === 'data-last-updated') {
                        let t = m.target.parentElement.querySelector('time.last-updated');
                        if (!t) {
                            t = document.createElement('time');
                            t.classList.add('last-updated');
                            t.classList.add('date');
                            m.target.parentElement.appendChild(t);
                        }
                        t.setAttribute('datetime', new Date(parseInt(m.target.dataset.lastUpdated)).toISOString());
                        t.innerHTML = "Last updated: " + new Date(parseInt(m.target.dataset.lastUpdated)).toLocaleString();
                    }
                });
            });
            observer.observe(el, { attributes: true, subtree: true, attributeFilter: ['data-last-updated'] });
    
        });

        if(!ToolsView.imported) {
            // load all web components
            //
            // Note: some might already be loaded by the webpack bundle, but
            // all remote ones need to be loaded separately. Also in dev mode we
            // need to load all of them.
            Object.values(window.Config.toolboxComponents).forEach(c => {
                try {
                    if(c.import.startsWith('https://')) {
                        import(/* webpackIgnore: true */ c.import);
                    } else {
                        /* No import needed when webpack is active and import.meta is empty */
                        if(!import.meta.url.startsWith('file://'))
                            import(/* webpackIgnore: true */ c.import.replace('./js/components/', '../components/'));
                    }
                } catch (error) {
                    console.error(`Error loading component ${c.import}:`, error);
                }
            });
            ToolsView.imported = true;
        }

        document.addEventListener('settings-changed', (e) => {
            if(0 == e.detail.name.indexOf("toolEnabled:::"))
                ToolsView.render(el);
        });
    }

    static async render(el) {
        return Promise.all(Object.keys(window.Config.toolboxComponents).map(async (name) => {
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