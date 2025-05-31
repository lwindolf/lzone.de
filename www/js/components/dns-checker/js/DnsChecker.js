// vim: set ts=4 sw=4:

import { settingsSet, settingsGet } from "./settings.js";

/* DNS Checker widget

   On refresh emits a CheckResult event with data like this

      { warnings: <number>, name: 'DNS' }
 */

class DnsChecker extends HTMLElement {
	#refreshInterval = 2*60; 	// default 2h check interval

	// state constants
	#STATUS_STILL_THERE	= "ok";			// still there (in enumeration)
	#STATUS_NEW			= "new";		// new (in enumeration)
	#STATUS_GONE		= "gone";		// gone (from enumeration)
	#STATUS_CHANGED		= "changed";	// changed DNS record

    // state
    #domains;	// check results per domain
	#updated;	// last update timestamp 
	#updating;	// TRUE if currently updating
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
        linkElem.setAttribute("href", (this.#path?this.#path:'') + "css/style.css");

		// inherit style from root document
        const linkElem2 = document.createElement("link");
        linkElem2.setAttribute("rel", "stylesheet");
        linkElem2.setAttribute("href", "../../../../css/main.css");

        this.shadowRoot.append(this.#results);
        this.shadowRoot.append(this.#info);
        this.shadowRoot.appendChild(linkElem);
		this.shadowRoot.appendChild(linkElem2);

		this.#updating = false;
        this.#update();

        settingsGet('refreshInterval', this.#refreshInterval).then((interval) => {
			this.#refreshInterval = interval;
            setInterval(async () => {            
                await this.#update();
            },  60 * interval * 1000);
        });

        document.addEventListener('DnsCheckerRefresh', (e) => {
            this.#update();
            e.stopPropagation();
        });

        this.#results.addEventListener('click', (e) => {
            const target = e.target.closest('.domain');
            if(target)
                this.#toggleDetails(target);
        });
    }

    #toggleDetails(e) {
        /* close previously open status box */
        const prev = this.#results.querySelector('.domain.details_on');
        if(prev)
            prev.classList.remove('details_on');

        /* close on 2nd click */
        if(e === prev)
            return;

        e.classList.toggle('details_on');
    }

    #setInfo(html) {
        this.#info.innerHTML = html;
    }

	#renderSubdomains(subdomains) {
		if(!subdomains)
			return "Not enumerated yet.";
	
		let warnings = 0;
		const result = Object.keys(subdomains).map((k) => {
			if(!subdomains[k].records)
					return "Not resolved yet!";

			return Object.values(subdomains[k].records)
						.filter(v => v.value)
						.map(v => v.value)
						.join('<br/>');
		}).join('<br/>');

		this.dispatchEvent(new CustomEvent('check-result-event', {
			bubbles: true,
			composed: true,
			detail: {
				warnings,
				name: 'DNS'
			}
		}));

		return result;
	}

    #renderStatus(e) {
		const name = e.dataset.domain;
		settingsGet(`domain:::${name}`, { updated: 0, subdomains: {} }).then((d) => {
			e.innerHTML = `
				<div class='probe probe_normal'>${name}</div>
				<div class='domain_details'>
					<pre>${this.#renderSubdomains(d.subdomains)}</pre>
				</div>
			`;
			this.#setInfo(`Last updated: ${new Date(this.#updated).toLocaleString()}`);
		});
    }

	#stringifyResolveAnswer(record, answer) {
		return answer.sort().map((e) => {
			return `${e.name} ${record} ${e.data}`
		}).join('\n');
	}

	async #resolve(e, domain) {
		const d = await settingsGet(`domain:::${domain}`, { updated: 0, subdomains: {} });

		Object.keys(d.subdomains).forEach(async (sd) => {
			this.#setInfo(`<i>Resolving '${sd}'...</i>`);

			const data = d.subdomains[sd];
			
			if(!data.records)
				data['records'] = {};

			for(const record of ['A', 'AAAA', 'NS', 'SOA', 'TXT', 'CNAME', 'PTR', 'SRV', 'MX', 'CAA']) {
				const result = await fetch(`https://cloudflare-dns.com/dns-query?name=${sd}&type=${record}`, {
					headers: {
							'Accept': 'application/dns-json'
					}
				}).then((r) => r.json());

				// FIXME: error handling

				if(!data.records[record])
					data.records[record] = {};

				const r = data.records[record];

				if(r.value) {
					r.oldValue = r.value;
					r.value = undefined;
				}

				if('Answer' in result)
					r.value = this.#stringifyResolveAnswer(record, result.Answer);
			}

			d.updated = new Date().getTime();
			this.#updated = new Date().getTime();

			// Save and show resolving result
			await settingsSet(`domain:::${domain}`, d);
			await settingsSet(`domainsLastUpdated`, this.#updated);

			this.#renderStatus(e);
		});
	}

	async #runCheck(e, domain) {
		const d = await settingsGet(`domain:::${domain}`, { updated: 0, subdomains: {} });
		if(d.updated < new Date().getTime() - this.#refreshInterval*60*1000)
			console.log(`Checking domain ${domain}`);
		else
			return;

		// Fetch Atom feed from crt.sh for subdomain enumeration
		this.#setInfo(`<i>Enumerating '${domain}'...</i>`);

		const response = await fetch(`https://crt.sh/json?q=${domain}`);
        const data = await response.json();
		let newSubdomains = {};

		// Mark all previous subdomains as old
		Object.keys(d.subdomains)
			.forEach((k) => d.subdomains[k].status = this.#STATUS_GONE);

		// Add all new subdomains
		for(const r of data) {
			for(const n of r.name_value.split(/\n/)) {
				let name = n.replace(/^\*\./, "");
				const sd = d.subdomains[name];
				if(sd)
					sd.status = this.#STATUS_STILL_THERE;
				else
					newSubdomains[name] = { status: this.#STATUS_NEW, alert: true };
			}
		}

		// Mark all really gone subdomains for decision
		Object.entries(d.subdomains)
			.filter((k, v) => v.status == this.#STATUS_GONE)
			.forEach((k, v) => v.alert = true);
		
		d.subdomains = {...d.subdomains, ...newSubdomains};

		// Save and show enumeration result
		await settingsSet(`domain:::${domain}`, d);
		this.#renderStatus(e);

		// Resolve all known records
		this.#resolve(e, domain);
	}

    async #update() {
		if(this.#updating) {
				console.log("DNS update already in progess.");
				return;
		}

		this.#updating = true;

        this.#setInfo('<i>Checking...</i>');

        this.#results.innerHTML = '';

		this.#updated = await settingsGet('domainsLastUpdated', 0);
		this.#domains = await settingsGet('domainList', [ 'lzone.de']);
        this.#domains.forEach((d) => {
			var e = document.createElement('span');
			e.className = 'domain';
			e.setAttribute('data-domain', d);
			e.onclick = this.toggleDetails;
			this.#results.append(e);
			this.#renderStatus(e);
			this.#runCheck(e, d);
        });

		this.#updating = false;
    }
}

export class DnsCheckerSettings extends HTMLElement {
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
		const domains = await settingsGet('domainList', [ 'lzone.de']);
		this.#div.innerHTML = `
		    <p>
		    	FIXME: you currently have to refresh the page to see the changes take effect
		    	in the DNS Checker widget.
		    </p>

			<p>
				<b>Important: Checks will be performed with the help of external services</b>
				<ul>
					<li><a href="https://crt.sh">crt.sh</a> for subdomain enumeration</li>
					<li><a href="https://cloudflare-dns.com">cloudflare-dns.com</a> for DNS queries</li>
				</ul>
				which may both log your domain queries. Do use with care!
			</p>

			<h3>Currently Checked Domains</h3>

			${domains.map((d) => `
				<div data-domain="${d}">
					<button data-domain="${d}">Remove</button>
					<span class="domain">${d}</span>
				</div>
			`).join('')}

			<h3>Add Domain</h3>

			<div>
				<input type="text" id="domain" placeholder="Domain to check">
				<button id="addDomain">Add</button>
			</div>
		`;

		this.#div.querySelectorAll('button[data-domain]').forEach((e) => {
			e.addEventListener('click', async (ev) => {
				const domain = ev.target.dataset.domain;
				if(domain) {
					await settingsSet('domainList', domains.filter((d) => d !== domain));
					this.#div.querySelector(`div[data-domain="${domain}"]`).remove();
				}
			});
		});

		this.#div.querySelector('#addDomain').addEventListener('click', async (ev) => {
			const domain = this.#div.querySelector('#domain').value.trim();
			if(domain)
				await settingsSet('domainList', [ ...domains, domain ]);
			this.render();
		});
    }
}

customElements.define('x-dns-checker', DnsChecker);
customElements.define('x-dns-checker-settings', DnsCheckerSettings);
