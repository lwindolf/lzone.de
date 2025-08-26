// vim: set ts=4 sw=4:

import { Settings } from "../../../models/Settings.js";
import * as r from "../../../helpers/render.js";

/* Badge Checker widget

   Displays remote badge images with a name along it.
   Refreshes the images periodically to get the latest status.
 */

class BadgeChecker extends HTMLElement {
    #refreshInterval = 1 * 60; 	// default 1h check interval

    // state
    #badges;	// check results
    #updated;	// last update timestamp 
    #path;      // path where to find CSS and data.json

    // shadow dom
    #info;
    #results;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.#path = this.shadowRoot.host.dataset.path;

        this.#results = document.createElement('div');
        this.#info = document.createElement('span');
        this.#info.classList.add('date');

        // add component style sheet
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", (this.#path ? this.#path : '') + "css/style.css");

        // inherit style from root document
        const linkElem2 = document.createElement("link");
        linkElem2.setAttribute("rel", "stylesheet");
        linkElem2.setAttribute("href", "../../../../css/main.css");

        this.shadowRoot.append(this.#results);
        this.shadowRoot.append(this.#info);
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(linkElem2);

        this.#update();

        Settings.get('refreshInterval', this.#refreshInterval).then((interval) => {
            this.#refreshInterval = interval;
            setInterval(async () => {
                await this.#update();
            }, 60 * interval * 1000);
        });

        document.addEventListener('BadgeCheckerRefresh', (e) => {
            this.#update();
            e.stopPropagation();
        });
    }

    #setInfo(html) {
        this.#info.innerHTML = html;
    }

    async #update() {
        this.#results.innerHTML = '';

        this.#updated = await Settings.get('badgesLastUpdated', 0);
        this.#badges = await Settings.get('badges', {});
        Object.entries(this.#badges).forEach(([name, url]) => {
            this.#results.innerHTML += `
                <div class="badge">
                        <span class="badge_name">${name}</span>
                        <img src="${url}" alt="Badge for ${name}">
                </div>
                `;
        });

        this.#updated = Date.now();
        this.#setInfo(`Last updated: ${new Date(this.#updated).toLocaleString()}`);
    }
}

export class BadgeCheckerSettings extends HTMLElement {
    // state
    #div;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.#div = document.createElement('div');

        // inherit style from root document
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../../../css/main.css");

        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.append(this.#div);
        this.render();
    }

    async render() {
        const badges = await Settings.get('badges', {});
        console.log(badges);
        this.#div.innerHTML = r.renderToString(`
		    <p>
		    	The badge checker can be used to have an overview over all build pipelines
                you care about. Simply add the badge name and image URL below.
		    </p>

			<h3>Configured Badges</h3>

            {{#each badges}}
				<div data-id="{{@key}}">
					<button data-id="{{@key}}">Remove</button>
					<span class="badge">{{@key}}</span>
                    <img src="{{.}}" alt="Badge for {{@key}}">
				</div>
            {{/each}}

			<h3>Add Badge</h3>

			<div>
				<input type="text" name="id" placeholder="Name of the badge">
                <input type="text" name="url" placeholder="Image URL of the badge">
				<button id="add">Add</button>
			</div>
		`, { badges });

        this.#div.querySelectorAll('button[data-badge]').forEach((e) => {
            e.addEventListener('click', async (ev) => {
                const id = ev.target.dataset.id;
                if (id) {
                    delete badges[id];
                    await Settings.set('badges', badges);
                }
            });
        });

        this.#div.querySelector('#add').addEventListener('click', async () => {
            const id = this.#div.querySelector('input[name="id"]').value.trim();
            const url = this.#div.querySelector('input[name="url"]').value.trim();
            if (id && url) {
                badges[id] = url;
                await Settings.set('badges', badges);
            }
            this.render();
        });
    }
}

customElements.define('x-badge-checker', BadgeChecker);
customElements.define('x-badge-checker-settings', BadgeCheckerSettings);
