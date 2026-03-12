// vim: set ts=4 sw=4:

import { Settings } from "../../../models/Settings.js";
import * as r from "../../../helpers/render.js";

/* Custom element fetching status.json URLs and display them */

class JobStatus extends HTMLElement {
    #refreshInterval = 5 * 60; 	// default 5m check interval [s]

    // state
    #updated;	// last update timestamp 

    // shadow dom
    #info;
    #results;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.#results = document.createElement('div');
        this.#info = document.createElement('span');
        this.#info.classList.add('date');

        // inherit style from root document
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "css/main.css");

        this.shadowRoot.append(this.#results);
        this.shadowRoot.append(this.#info);
        this.shadowRoot.appendChild(linkElem);

        this.#render();
    }

    async #render() {
        this.#results.innerHTML = '';

        const now = Math.floor(Date.now()/1000);
        const urls = await Settings.get('jobstatus::urls', []);
        for(const u of urls) {
            try {
                const response = await fetch(u + "?ts=" + now);
                const status = await response.json();
                this.#results.innerHTML += r.renderToString(`
                    <div>
                        {{#if status.meta.favicon}}
                        <img class="icon" loading="lazy" style="max-width:1rem" src="{{status.meta.favicon}}" alt="{{status.meta.name}} favicon">
                        {{/if}}
                        <b>{{status.meta.name}}</b>
                    </div>
                    <div>
                        {{#each status.meta.links}}
                            [<a href="{{this}}">{{@key}}</a>] 
                        {{/each}}
                    </div>
                    <table>
                        <tr>
                            <td>Running</td>
                            <td>{{status.schedule.running}}</td>
                        </tr>
                        <tr>
                            <td>Last Updated</td>
                            <td>{{lastUpdated}}s ago</td>
                        </tr>
                        {{#each status.data}}
                            <tr>
                                <td>{{@key}}</td>
                                <td>{{this}}</td>
                            </tr>
                        {{/each}}
                    </table>
                `, { u, status, lastUpdated: now - status.schedule.lastUpdate });
            } catch (error) {
                console.error(`Error fetching status from ${u}:`, error);
                this.#results.innerHTML += `
                    <div class="status">
                        <span class="status_url">Failed to fetch ${u}</span>
                        <span class="status_info">${error.message}</span>
                    </div>
                `;

            }
        }

    }
}

export class JobStatusSettings extends HTMLElement {
    // state
    #div;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.#div = document.createElement('div');

        // inherit style from root document
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "css/main.css");

        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.append(this.#div);
        this.render();
    }

    async render() {
        const urls = await Settings.get('jobstatus::urls', []);
        this.#div.innerHTML = r.renderToString(`
                    <p>
                        The job status widget can be used to watch job statuses. Simply add a status URL below.
                    </p>

                        <h3>Configured Status URLs</h3>

                        {{#each urls}}
                                <div data-id="{{.}}">
                                        <button data-url="{{.}}">Remove</button>
                                        <a href="{{.}}">{{.}}</a>
                                </div>
                        {{/each}}

                        <h3>Add Status URL</h3>

                        <div>
                                <input type="url" name="url" placeholder="URL of the status">
                                <button id="add">Add</button>
                        </div>
                `, { urls });

        this.#div.querySelectorAll('button[data-url]').forEach((e) => {
            e.addEventListener('click', async (ev) => {
                const url = ev.target.dataset.url;
                if (url) {
                    const index = urls.indexOf(url);
                    if (index > -1) {
                        urls.splice(index, 1);
                    }
                    await Settings.set('jobstatus::urls', urls);
                }
                this.render();
            });
        });

        this.#div.querySelector('#add').addEventListener('click', async () => {
            const url = this.#div.querySelector('input[name="url"]').value.trim();
            if (url) {
                urls.push(url);
                await Settings.set('jobstatus::urls', urls);
            }
            this.render();
        });
    }
}

customElements.define('x-job-status', JobStatus);
customElements.define('x-job-status-settings', JobStatusSettings);
