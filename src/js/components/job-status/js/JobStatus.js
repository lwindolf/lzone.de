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
        this.#results.innerHTML = `
        <style>
            div.jobStatus div {
                margin-bottom: 0.4rem;
                margin-top: 0.4rem;
            }
            .date {
                margin: 6px 0 32px 0;
                filter: brightness(50%);
                font-size: 0.8rem;
            }
        </style>
        `;

        const now = Math.floor(Date.now()/1000);
        const urls = await Settings.get('jobstatus::urls', []);
        for(const u of urls) {
            try {
                const response = await fetch(u + "?ts=" + now);
                const status = await response.json();
                let state = 'unknown';
                let severity;

                // Check for error conditions
                if ('running' in status.schedule) {
                    // key running indicates a continuous or currently running scheduled job
                    if (status.schedule.running) {
                        state = 'running';
                        severity = 'ok';
                    } else {
                        state = 'stopped';
                        severity = 'critical';
                    }
                }
                if ('nextRun' in status.schedule) {
                    // key nextRun indicates a scheduled job
                    if (status.schedule.nextRun < now) {
                        state = 'failed to schedule';
                        severity = 'critical';
                    } else {
                        state = 'scheduled';
                        severity = 'ok';
                    }
                }
                if ('maxAge' in status.schedule) {
                    // key maxAge indicates the maximum age of a job status
                    if (now - status.schedule.lastUpdate > status.schedule.maxAge) {
                        state = 'stale';
                        severity = 'critical';
                    }
                }

                this.#results.innerHTML += r.renderToString(`
                <div class="jobStatus">
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
                            <td>Status</td>
                            <td class="probe_{{severity}}">{{state}}</td>
                        </tr>
                        <tr>
                            <td>Last Updated</td>
                            <td>{{lastUpdated}}s ago</td>
                        </tr>
                        {{#if nextRun}}
                        <tr>
                            <td>Next Run</td>
                            <td>in {{nextRun}}s</td>
                        </tr>
                        {{/if}}
                        {{#each status.data}}
                            <tr>
                                <td>{{@key}}</td>
                                <td>{{this}}</td>
                            </tr>
                        {{/each}}
                    </table>
                </div>
                `, {
                    u,
                    status,
                    state,
                    severity,
                    lastUpdated: now - status.schedule.lastUpdate,
                    nextRun: status.schedule.nextRun ? (status.schedule.nextRun - now) : null
                });
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
        this.#info.innerHTML = `Last updated: ${new Date().toLocaleString()}`;
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
                        The job status widget can be used to watch job statuses (here is an <a href="https://lzone.de/rss-feed-index/status.json">example</a>).
                        Simply add a status URL below to monitor the job execution.
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
