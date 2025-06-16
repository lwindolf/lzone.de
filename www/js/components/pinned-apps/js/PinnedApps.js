// vim: set ts=4 sw=4:

/* Pinned apps and apps catalog web component */

import * as r from '../../../helpers/render.js';
import { Config } from '../../../config.js';
import { Settings } from '../../../models/Settings.js';

class PinnedApps extends HTMLElement {
    // shadow dom
    #results;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.#results = document.createElement('div');

        // inherit style from root document
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../../../css/main.css");

        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.append(this.#results);
        this.#update();

        document.addEventListener('settings-changed', (e) => {
            if (e.detail.name === 'pinnedApps')
                this.#update();
        });
    }

    async #update() {      
        r.renderElement(this.#results, r.template(`
            <div class="apps-pinned">
            {{#each pinnedApps}}
                <div class="app">
                    <a class="favicon" href="{{url}}" target="_blank" rel="noopener noreferrer" title="{{@key}} ({{description}})">
                    {{#if favicon}}
                            <img class="favicon" src="{{favicon}}">
                    {{else}}
                            <img class="favicon" src="{{url}}/favicon.ico">
                    {{/if}}
                    </a>
                </div>
            {{/each}}
            <a href="#/-/Settings/Tools/Pinned Apps" class="add">+</a>
            </div>
        `), { pinnedApps: await Settings.get('pinnedApps', {})});
    }
}

// A components rendering the app catalog where users can pin apps to the tools sidebar

export class PinnedAppsSettings extends HTMLElement {
    // state
    #catalog;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.#catalog = document.createElement('div');

        // inherit style from root document
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../../../css/main.css");

        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.append(this.#catalog);
        this.render();
    }

    async render() {
        r.renderElement(this.#catalog, r.template(`
            {{#* inline "app" }}
                <div class="app">
                    <a class="favicon" href="{{url}}" target="_blank">
                    {{#if favicon}}
                            <img class="favicon" src="{{favicon}}">
                    {{else}}
                            <img class="favicon" src="{{url}}/favicon.ico">
                    {{/if}}
                    </a>
                    <div class="title">
                        <a class="title" href="{{url}}">{{@key}}</a>
                        <button data-name="{{@key}}">
                            {{#if pinned }}
                                Unpin
                            {{else}}
                                Pin
                            {{/if}}
                        </button>
                    </div>
                    <div class="description">{{description}}</div>
                </div>
            {{/inline}}

            <p>
                This is a catalog of useful web apps that you can pin for quick access. Depending
                on the layout the apps will be shown in the sidebar or on the home page.
            </p>

            <div class="app-catalog">
                <h2>Pinned</h2>
                {{#each pinnedApps}}
                    {{> app pinned=true }}
                {{/each}}

                {{#each apps}}
                    <h2>{{@key}}</h2>
                    <div class="group" data-group="{{@key}}">
                    {{#each .}}
                        {{#unless (lookup ../../pinnedApps @key) }}
                            {{> app }}
                        {{/unless}}
                    {{/each}}
                    </div>
                {{/each}}
            </div>
        `), {
            apps: Config.apps,
            pinnedApps: await Settings.get('pinnedApps', {})
        });

        this.#catalog.querySelectorAll('.app-catalog .app button').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const el = e.target;
                const name = el.getAttribute('data-name');
                if (name) {
                    let pinnedApps = await Settings.get('pinnedApps', {});
                    if (name in pinnedApps) {
                        delete pinnedApps[name];
                    } else {
                        const group = el.closest('.group').getAttribute('data-group');
                        pinnedApps[name] = Config.apps[group][name];
                    }
                    await Settings.set('pinnedApps', pinnedApps);
                    this.render();
                }
            });
        });
    }
}

customElements.define('x-pinned-apps', PinnedApps);
customElements.define('x-pinned-apps-settings', PinnedAppsSettings);
