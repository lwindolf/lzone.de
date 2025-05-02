// vim: set ts=4 sw=4:

/* Check Overview widget

   Listening to all global check-result-event events and renders an overview
 */

import "../../dns-checker/js/DnsChecker.js";
import "../../saas-multi-status/js/MultiStatusCloud.js";

const monitoringTools = {
    saasMultiStatus: {
        tag         : 'x-multistatus-cloud',
        settingsTag : 'x-multistatus-settings',
        data        : {
            reduced: 1,
            path: "/multi-status/"
        }
    },
    dnsChecker: {
        tag         : 'x-dns-checker'
    }
    // FIXME: add CVE tracker
    // FIXME: add Wurmterm
};

class CheckInfo extends HTMLElement {
	// state constants
    #checks = {};    // results of all recent checks

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
		
		// listen for webcomponent result messages on root document
        document.addEventListener("check-result-event", (e) => this.#onResultEvent(e));
    }

	#onResultEvent(e) {
        try {
            this.#checks[e.detail.name] = {
                warnings: e.detail.warnings || 0,
                critical: e.detail.critical || 0
            };
			this.#update();
        } catch(ex) {
            console.error(ex);
        }
    }

	#update() {
		this.#results.innerHTML = `
			<span class="title">
				<a href="#/checks/">Checks</a>
			</span>
			${Object.keys(this.#checks).map(k => {
				const w = this.#checks[k]?.warnings;
				const c = this.#checks[k]?.critical;
				let result = `<span class='probe check_info'>${k} `;
				if(w > 0)
					result += `<span class='probe_warning'>${w}</span>`;
				if(c > 0)
					result += `<span class='probe_critical'>${c}</span>`;
				if(0 == w+c)
					result += `✓`;

				return `</span>`+result;
			}).join("\n")}
		`;
	}
}

customElements.define('x-check-info', CheckInfo);
