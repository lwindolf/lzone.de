// vim: set ts=4 sw=4:

import { Config } from "../config.js";
import * as r from "../helpers/render.js";

export class SettingsView {
    constructor(el, path) {
        const name = path.split('/').pop();

        // render settings for tool web components
        if (path.startsWith('-/Settings/Tools/')) {
            import(Config.toolboxComponents[name].import).then(() => {
                el.innerHTML = `<h1>Settings - ${name}</h1> ${Config.toolboxComponents[name].settings}`;
            });
        } else if (path === '-/Settings/Tools') {
            r.renderElement(el, r.template(`
                <h1>Settings - Tools</h1>

                FIXME: 🚧 This page is work in progress, it does not work yet! 

                <p>
                    Here you can activate / deactivate tools.
                </p>

                {{#each tools}}
                <div class="tool">
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}>
                    {{@key}} (<a href="#/-/Settings/Tools/{{@key}}">Settings</a>)
                </div>
                {{/each}}
            `), {
                tools: Config.toolboxComponents,
            });
        } else if (path === '-/Settings') {
            r.renderElement(el, r.template(`
                <h1>Global Settings</h1>

                FIXME: 🚧 This page is work in progress, it does not work yet! 

                <h3>CORS Proxy</h3>

                <p>
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}>
                    Allow CORS Proxy
                </p>

                <h3>Feed Reader</h3>

                <div>
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}> Show favicons
                </div>
                <div>
                    <input type="checkbox" name="{{name}}" {{#if enabled}}checked{{/if}}> Update all feeds on startup
                </div>
                <div>
                    Default update interval <input id="refreshInterval" type="number" value="24" size="1" min="1"> hours
                </div>

                <h3>Cache</h3>

                <div>
                    <button id="resetPwaCache">Reset PWA cache</button> (does not delete data, just reloads the app)
                </div>

                <h3>More Settings</h3>
                <ul>
                    <li><a href="#/-/Settings/Tools">Tools</a></li>
                </ul>
            `));

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
    }
}