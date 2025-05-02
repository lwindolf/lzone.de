// vim: set ts=4 sw=4:

import { Settings } from '../settings.js';
import { CheatSheetInstaller } from '../cheat-sheet-installer.js';

// A view giving an overview on installed and installable cheat sheets
// and allows adding/removing cheat sheets

export class SettingsView {
    #parentId;
    #repos = {};

    constructor(id) {
        this.#parentId = id;
        this.#render();
    }

    async #getDiskUsage() {
        if (!navigator.storage)
            return "Sorry: Browser does not report usage!";

        const estimate = await navigator.storage.estimate();
        const used = Math.floor(estimate.usage / 1024 / 1024);
        const available = Math.floor((estimate.quota - estimate.usage) / 1024 / 1024);

        return `${used} MB used / ${available} MB available`;
    }

    async #render() {
        let e;

        document.getElementById(this.#parentId).innerHTML = `
            <h1>Content Settings</h1>

            <p>Here you can download and
            install additional cheat sheets or other content from Github. Those extra cheat sheets are
            stored in your local browser cache and are only visible to you and only on this device.</p>

            <h2>Installed Content</h2>

            <p>
              <div id='installedSections'></div>
            </p>

            <h2> Installable Content</h2>

            <p>
              <div id='installableSections'></div>
            </p>

            <h2>Custom Installation</h2>
            
            <p>
            If you have a Github repo that is not part of the default list of installable repositories
            try adding it with this custom form. If it works well consider adding it to
            the <a href="https://github.com/lwindolf/lzone-cheat-sheets/blob/master/extra-cheat-sheets.json">list here</a>!

                <div id='customInstall'>
                        Name:<br/>
                        <input type='text' id='customName'/><br/>
                        Repo: (Format: "&lt;user>/&lt;repo>")<br/>
                        <input type='text' id='customRepo'/><br/>
                        File Pattern: (optional Regex with exactly one capture group to extract names)<br/>
                        <input type='text' id='customFilePattern'/> <br/>
                        <br/>
                        <button>Add</button><br/>
                </div>
            </p>

            <h2>Storage Usage</h2>

            <p>
                As cheat sheets are stored in your browser they can eat up some space.
            </p>
            <p>
                Your current usage is: ${await this.#getDiskUsage()}
            </p>
        `;
        document.querySelector('#customInstall button').onclick = (e) => {
            this.#onCustomSubmit(e.target, this.#repos);
        };

        e = document.getElementById('installableSections');
        if (Object.keys(this.#repos).length == 0) {
            e.innerHTML = 'Fetching definitions ...';
            await fetch('https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/extra-cheat-sheets.json')
                .then((response) => response.json())
                .then((data) => (this.#repos = data));
            await fetch('https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/cheat-sheets.json')
                .then((response) => response.json())
                .then((data) => (this.#repos = {...this.#repos, ...data}));
        }
        e.innerHTML = '';

        Object.keys(this.#repos).sort().forEach((k) => {
            if (!Settings.values.extraSections.includes(k)) {
                e.innerHTML += `
                    <div class='installable'>
                        <button data-section='${k}'>Add</button>
                        <a href="https://github.com/${this.#repos[k] ? this.#repos[k].github : ""}">${k}</a>
                   </div>
                `;
            }
        });
        for (const b of document.querySelectorAll('.installable button')) {
            b.onclick = (e) => {
                this.#onInstall(e.target, this.#repos);
            }
        }

        e = document.getElementById('installedSections');
        e.innerHTML = '';

        var extraSections = await Settings.get('extraSections', []);
        extraSections.sort().forEach((k) => {
            e.innerHTML += `
                <div class='installed'>
                        <button data-section='${k}'>Remove</button>
                        <a href="https://github.com/${this.#repos[k]?.github}">${k}</a>
                </div>
            `;
        });
        for (const b of document.querySelectorAll('.installed button')) {
            b.onclick = (e) => {
                this.#onRemove(e.target);
            }
        }
    }

    async #onRemove(e) {
        let section = e.getAttribute('data-section');
        await CheatSheetInstaller.remove(section);
        this.#render();
    }

    async #onInstall(e, repos) {
        let section = e.getAttribute('data-section');       
        await CheatSheetInstaller.install(section, repos[section], e);
        this.#render();
    }

    async #onCustomSubmit(e, repos) {
        var n = document.getElementById('customName').value;
        repos[n] = {
            github: document.getElementById('customRepo').value,
            type: 'github',
            filePattern: document.getElementById('customFilePattern').value
        };

        if (repos[n].filePattern.length == 0)
            repos[n].filePattern = null;

        await CheatSheetInstaller.install(n, repos[n], e);
        this.#render();
    }
}