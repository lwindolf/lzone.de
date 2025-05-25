// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { Settings } from '../models/Settings.js';
import * as r from '../helpers/render.js';
import * as ev from '../helpers/events.js';

// A view rendering the app catalog where users can pin apps to the tools sidebar

export class AppCatalogView {
    // state
    #el;

    constructor(el) {
        this.#el = el;
        this.render();
    }

    async render() {
        r.renderElement(this.#el, r.template(`
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
                        <a href="{{url}}">{{@key}}</a>
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

            <h1>App Catalog</h1>

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

        ev.connect('click', '.app-catalog .app button', async (el) => {
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
    }
}
