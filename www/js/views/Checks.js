// vim: set ts=4 sw=4:

import { Settings } from '../models/Settings.js';
import '../components/check-info/js/CheckInfo.js';
import * as r from '../helpers/render.js';

// A view rendering results of multiple optional check tools

export class ChecksView {
    constructor(el) {
        ChecksView.render(el);
    }

    static async renderApps() {
        r.render('.checks .apps-pinned .apps', r.template(`
            {{#each pinnedApps}}
                <div class="app">
                    <a class="favicon" href="{{url}}" target="_blank" rel="noopener noreferrer" title="{{@key}} ({{description}})">
                    {{#if favicon}}
                            <img class="favicon" src="{{favicon}}">
                    {{else}}
                            <img class="favicon" src="{{url}}/favicon.ico">
                    {{/if}}
                    </a>
                </div>
            {{/each}}
        `), { pinnedApps: await Settings.get('pinnedApps', {})});
    }

    static async render(el) {
        r.renderElement(el, r.template(`
            <div class="checks">
                <h3>SaaS Outages</h3>
                <x-multistatus-cloud data-path="/js/components/saas-multi-status/" data-reduced="1">ERROR when embedding SaaS MultiStatus</x-multistatus-cloud>

                <h3>DNS Change Detector</h3>
                <x-dns-checker data-path="/js/components/dns-checker/">ERROR when embedding DNS Change Detector!</x-dns-checker>

                <div class="apps-pinned">
                    <h3>Pinned Apps</h3>

                    <div class="apps"></div>
                    <a href="/#/AppCatalog" class="add">+</a>
                </div>
            </div>
		`), {});
        this.renderApps();

        document.addEventListener('settings-changed', (e) => {
            if (e.detail.name === 'pinnedApps')
                this.renderApps();
        });                  
    }
}
