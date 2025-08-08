// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import { Settings } from "../models/Settings.js";
import * as r from "../helpers/render.js";

export class SettingsView {
    constructor(el, path) {
        SettingsView.#render(el, path);
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
        console.log(`update visibility for ${name}`);

        const v = el.querySelector(`select[name="${name}"]`)?.value;
        if(!v)
                return;
console.log(`update visibility for ${name}=${v}`);
        el.querySelectorAll(`[${name}]`).forEach((div) => {
            if (div.getAttribute(name) === v) {
                div.classList.remove('hidden');
            } else {
                div.classList.add('hidden');
            }
        });
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

                <h3>Configure Chat Bot</h3>

                Mode <select name="chatType">
                    <option value="none">Disabled</option>
                    <option value="openai">OpenAI API (e.g. local ollama / llama.cpp)</option>
                    <option value="huggingFace">HuggingFace</option>
                </select>

                <div chatType="huggingFace" class="hidden">
                    <p>
                        Select a public <a href="https://huggingface.co/">HuggingFace</a> space 
                        to use for chat. The listed spaces do not require authentication and 
                        might have usage quota. Do not use those spaces for sensitive prompts.
                        Consider all prompts public and your data processed by 3rd parties!
                    </p>

                    Space <select name="huggingFaceModel">
                        {{#each chatBotModels}}
                        <option value="{{this}}">{{this}}</option>
                        {{/each}}
                    </select>
                </div>

                <div chatType="openai" class="hidden">
                    <p>Configure the OpenAI endpoint e.g. <code>http://localhost:11434</code> for a local ollama setup.</p>

                    <input type="text" name="openAIEndpoint" value="{{openAIEndpoint}}"/>
                    <button name="openAIEndpointTest">Test</button>
                </div>

                <h3>App Cache</h3>

                <p>Clear the app cache. This does <b>not</b> delete content. Try this when the app does not work!</p>
                <div>
                    <button id="resetPwaCache">Reset PWA cache</button>
                </div>

                <h3>Configure Tools</h3>
                
                <p>Manage tools shown in the side bar: <a href="#/-/Settings/Tools">Configure</a></p>
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
        } else {
            el.innerHTML = "ERROR: Unknown settings path";
        }

        SettingsView.#bind(el);
    }
}