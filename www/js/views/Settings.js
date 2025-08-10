// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { Chat } from "../models/Chat.js";
import { Settings } from "../models/Settings.js";
import * as r from "../helpers/render.js";

// View with simple data binding to the Settings indexdb

export class SettingsView {
    constructor(el, path) {
        SettingsView.#render(el, path);

        document.addEventListener('settings-changed', (e) => SettingsView.#updateSelect(el, e.detail.name));
    }

    // Dynamic update handling of settings (<select> only) to allow for dynamic select options
    //
    // If we receive a settings-update event and we have a matching <select options="<name>">
    // we update the options of this select.
    static async #updateSelect(el, name) {
        console.log(`SettingsView: Updating ${name}`);
        const select = el.querySelector(`select[options="${name}"]`);
        if (!select)
            return;

        const values = await Settings.get(name);
        if (values !== undefined) {
            r.render(`select[options="${name}"]`, r.template(`
                {{#each values}}
                <option value="{{this}}">{{this}}</option>
                {{/each}}
            `), { values });
        }
    }

    // Generic settings handling
    //
    // We expect all input/select names to be the same as the settings name.
    static async #bind(el) {
        el.querySelectorAll('input[type="checkbox"]').forEach(async (checkbox) => {
            const v = await Settings.get(checkbox.name);
            if(v === true)
                checkbox.checked = true;

            checkbox.addEventListener('change', (e) => {
                Settings.set(e.target.name, e.target.checked?true:false, true /* send event */);
            });
        });

        el.querySelectorAll('input[type="text"]').forEach(async (input) => {
            const v = await Settings.get(input.name);
            if(v !== undefined)
                input.value = v;

            input.addEventListener('change', (e) => {
                Settings.set(e.target.name, e.target.value, true /* send event */);
            });
        });

        el.querySelectorAll('select').forEach(async (select) => {
            const v = await Settings.get(select.name);
            if(v !== undefined)
                select.value = v;

            SettingsView.#updateVisibility(el, select.name);

            select.addEventListener('change', (e) => {
                SettingsView.#updateVisibility(el, e.target.name);
                Settings.set(e.target.name, e.target.value, true /* send event */);
            });
        });
    }

    // Make options (in)visible based on a <select> value
    static #updateVisibility(el, name) {
        const v = el.querySelector(`select[name="${name}"]`)?.value;
        if(!v)
                return;

        el.querySelectorAll(`[${name}]`).forEach((e) => {
            if(e.getAttribute(name) === v)
                e.classList.remove('hidden');
            else
                e.classList.add('hidden');
        });
    }

    static async #updateOllamaModels() {
        try {
            await Chat.getOllamaModelList();
            // We rely on getOllamaModelList() to trigger a settings-changed event
            // for the model <select>. So we just indicate success here.
            document.getElementById('ollamaTestResult').innerText = '✅ Works!';
        } catch (e) {
            document.getElementById('ollamaTestResult').innerText = `⛔ Failed (${e})!`;
        }
    }

    static async #render(el, path) {
        const name = path.split('/').pop();

        // render settings for tool web components
        if (path.startsWith('-/Settings/Tools/')) {
            import(Config.toolboxComponents[name].import).then(() => {
                el.innerHTML = `<h1>Settings - ${name}</h1> ${Config.toolboxComponents[name].settings}`;
            });
            return; // we want no binding
        } else if (path === '-/Settings/Tools') {
            r.renderElement(el, r.template(`
                <h1>Settings - Tools</h1>

                {{#each names}}
                <div class="tool">
                    <input type="checkbox" name="toolEnabled:::{{.}}" {{#ifTrue enabled}}checked{{/ifTrue}}>
                    {{.}} (<a href="#/-/Settings/Tools/{{.}}">Settings</a>)
                </div>
                {{/each}}
            `), {
                names: Object.keys(Config.toolboxComponents)
            });
        } else if (path === '-/Settings') {
            const ollamaModels = await Settings.get('ollamaModels', []);

            r.renderElement(el, r.template(`
                <h1>Global Settings</h1>

                <h3>CORS Proxy</h3>

                <p>
                    <input type="checkbox" name="allowCorsProxy">
                    Always allow using the CORS Proxy <code>https://corsproxy.io</code>
                </p>

                <!--<h3>Feed Reader</h3>

                <div>
                    <input type="checkbox" name="feedreader:::showFavicons"> Show favicons
                </div>
                <div>
                    <input type="checkbox" name="feedreader:::updateAllOnStartup"> Update all feeds on startup
                </div>
                <div>
                    Default update interval <input name="feedreader:::refreshInterval" type="number" value="24" size="1" min="1"> hours
                </div>-->

                <h3>Configure Chat Bot</h3>

                <p>
                    Mode <select name="chatType">
                        <option value="none">Disabled</option>
                        <option value="ollama">ollama API</option>
                        <option value="huggingFace">HuggingFace</option>
                    </select>
                </p>

                <div chatType="huggingFace" class="hidden">
                    <p>
                        Select a public <a href="https://huggingface.co/">HuggingFace</a> space 
                        to use for chat. The listed spaces do not require authentication and 
                        might have usage quota. Do not use those spaces for sensitive prompts.
                        Consider all prompts public and your data processed by 3rd parties!
                    </p>

                    Space <select name="huggingFaceModel">
                        {{#each hfModels}}
                        <option value="{{this}}">{{this}}</option>
                        {{/each}}
                    </select>
                </div>

                <div chatType="ollama" class="hidden">
                    <table>
                        <tr>
                            <td>
                                Endpoint
                            </td>
                            <td>
                                <input type="text" name="ollamaEndpoint" value="http://localhost:11434"/>
                                <span id="ollamaTestResult"></span>
                                <br/>
                                Hint: local ollama default endpoint is <code>http://localhost:11434</code>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Model
                            </td>
                            <td>
                                <select name="ollamaModel" options="ollamaModels">
                                    {{#each ollamaModels}}
                                    <option value="{{this}}">{{this}}</option>
                                    {{/each}}
                                </select>
                            </td>
                        </tr>
                    </table>
                </div>

                <h3>App Cache</h3>

                <p>Clear the app cache. This does <b>not</b> any delete content. Try this when the app does not work!</p>
                <div>
                    <button id="resetPwaCache">Reset PWA cache</button>
                </div>

                <h3>Sidebar Tools</h3>
                
                <p>
                    <button onclick='document.location.hash="/-/Settings/Tools"'>Configure</button>
                </p>
            `), {
                hfModels     : Object.keys(Config.chatBotModels),
                ollamaModels
            });

            el.querySelector('input[name="ollamaEndpoint"]').addEventListener('change', () => this.#updateOllamaModels(el));
            if (ollamaModels.length === 0)
                this.#updateOllamaModels();

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
        } else {
            el.innerHTML = "ERROR: Unknown settings path";
        }

        SettingsView.#bind(el);
    }
}