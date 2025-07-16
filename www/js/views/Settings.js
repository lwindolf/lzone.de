// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { Settings } from "../models/Settings.js";
import * as r from "../helpers/render.js";

export class SettingsView {
    constructor(el, path) {
        SettingsView.#render(el, path);
    }

    // Generic settings handling
    static async #bind(el) {
        el.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                Settings.set(e.target.name, e.target.checked?true:false, true /* send event */);
            });
        });

        el.querySelectorAll('input[type="text"]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                Settings.set(e.target.name, e.target.value, true /* send event */);
            });
        });

        el.querySelectorAll('select').forEach((select) => {
            select.addEventListener('change', (e) => {
                Settings.set(e.target.name, e.target.value, true /* send event */);
            });
        });
    }

    static async #render(el, path) {
        const name = path.split('/').pop();

        // render settings for tool web components
        if (path.startsWith('-/Settings/Tools/')) {
            import(Config.toolboxComponents[name].import).then(() => {
                el.innerHTML = `<h1>Settings - ${name}</h1> ${Config.toolboxComponents[name].settings}`;
            });
        } else if (path === '-/Settings/Tools') {
            Promise.all(Object.keys(Config.toolboxComponents).map(async (name) => {
                return {
                    name,
                    setting: "toolEnabled:::" + name,
                    enabled: await Settings.get("toolEnabled:::" + name, Config.toolboxComponents[name].enabled)
                }
            })).then((settings) => {
                r.renderElement(el, r.template(`
                    <h1>Settings - Tools</h1>

                    <p>
                        Activate / deactivate tools.
                    </p>

                    {{#each settings}}
                    <div class="tool">
                        <input type="checkbox" name="{{setting}}" {{#ifTrue enabled}}checked{{/ifTrue}}>
                        {{name}} (<a href="#/-/Settings/Tools/{{name}}">Settings</a>)
                    </div>
                    {{/each}}
                `), {
                    settings
                });

                SettingsView.#bind(el);
            });
        } else if (path === '-/Settings') {
            r.renderElement(el, r.template(`
                <h1>Global Settings</h1>

                <h3>CORS Proxy</h3>

                <p>
                    <input type="checkbox" name="allowCorsProxy" {{#if allowCorsProxy}}checked{{/if}}>
                    Always allow using a CORS Proxy
                </p>

                <!--<h3>Feed Reader</h3>

                <div>
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}> Show favicons
                </div>
                <div>
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}> Update all feeds on startup
                </div>
                <div>
                    Default update interval <input id="refreshInterval" type="number" value="24" size="1" min="1"> hours
                </div>-->

                <h3>🚧 Chat bot</h3>

                FIXME: 🚧 This setting is work in progress, and does not work yet! 


                <p>Configure an OpenAI API endpoint or a HuggingFace demo space to use for chat.</p>

                <select name="chatBotModel">
                    <option value="">OpenAI API</option>
                    {{#each chatBotModels}}
                    <option value="{{this}}">HuggingFace - {{this}}</option>
                    {{/each}}
                </select>

                <p>Configure the OpenAI endpoint (e.g. <code>http://localhost:11434</code> for ollama)</p>

                <input type="text" name="openAIEndpoint" value="{{openAIEndpoint}}"/>
                <button name="openAIEndpointTest">Test</button>

                <h3>Cache</h3>

                <div>
                    <button id="resetPwaCache">Reset PWA cache</button> (does not delete data, just reloads the app)
                </div>

                <h3>More Settings</h3>
                <ul>
                    <li><a href="#/-/Settings/Tools">Tools</a></li>
                </ul>
            `), {
                allowCorsProxy : await Settings.get('allowCorsProxy', false),
                openAIEndpoint : await Settings.get('openAIEndpoint', "http://localhost:11434"),
                chatBotModels  : Object.keys(Config.chatBotModels),
                chatBotModel   : await Settings.get('chatBotModel', Object.keys(Config.chatBotModels)[0]),
            });

            el.querySelector('#resetPwaCache').addEventListener('click', () => {
                if (confirm('Are you sure you want to reset the PWA cache? This will reload the app.')) {
                    // Send a message to the service worker to clear the cache
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
                    } else {
                        console.error('Service worker is not available or not controlling the page.');
                    }
                }
            });

            SettingsView.#bind(el);
        } else {
            el.innerHTML = "ERROR: Unknown settings path";
        }
    }
}