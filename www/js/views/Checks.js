// vim: set ts=4 sw=4:

import '../components/check-info/js/CheckInfo.js';

// A view rendering results of multiple optional check tools

export class ChecksView {
	constructor(el) {
		el.innerHTML = `
            <h3>SaaS Outages</h3>
            <x-multistatus-cloud data-path="/js/components/saas-multi-status/" data-reduced="1">ERROR when embedding SaaS MultiStatus</x-multistatus-cloud>

            <h3>DNS Change Detector</h3>
            <x-dns-checker data-path="/js/components/dns-checker/">ERROR when embedding DNS Change Detector!</x-dns-checker>
		`;
	}
}
