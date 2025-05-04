// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { CheatSheetCatalog } from '../models/CheatSheetCatalog.js';
import { Section } from '../models/Section.js';
import * as r from '../helpers/render.js';
import * as ev from '../helpers/events.js';

// A view giving an overview on installed and installable cheat sheets
// and allows adding/removing cheat sheets

export class CatalogView {
    // state
    #repos = {};
    #el;
    #group;

    static #template = r.template(`
        <h1>Folder "{{ group }}"</h1>

        {{#if properties.removable }}
            <button id='removeFolder' data-group='{{ group }}'>Remove folder</button>
        {{/if}}

        <h2>Installed Content</h2>

        <p>
            <div id='installedSections'>
            {{#each tree.nodes }}
                {{#if this.name}}
                    <div class='installed'>
                        <button data-section='{{ this.name }}'>Remove</button>
                        <a href="https://github.com/{{ this.github }}">{{ this.name }}</a>
                    </div>
                {{/if}}
            {{/each }}
            </div>
        </p>

        {{#if properties.catalog }}
        <h2> Installable Content</h2>

        <p>
            <div id='installableSections'>
            {{#each catalog }}
                <div class='installable'>
                    <button data-section='{{ @key }}'>Add</button>
                    <a href="https://github.com/{{ this.github }}">{{ @key }}</a>
                </div>
            {{/each }}
            </div>
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
        {{/if}}

        <h2>Storage Usage</h2>

        <p>
            As cheat sheets are stored in your browser they can eat up some space.
        </p>
        <p>
            Your current usage is: {{ diskUsage}}
        </p>        
    `);

    constructor(el, path) {
        this.#el = el;
        this.#group = decodeURI(path[2]);
        this.#render();
    }

    async #render() {
        this.#repos = await CheatSheetCatalog.getInstallable(this.#group);
        console.log(Section.getTree());
        r.renderElement(this.#el, CatalogView.#template, {
            group      : this.#group,
            catalog    : this.#repos,
            properties : Config.groups[this.#group],
            diskUsage  : await this.#getDiskUsage(),
            removable  : Config.groups[this.#group].removable,
            tree       : Section.getTree().nodes[this.#group]
        });

        ev.connect('click', '#customInstall button', async (e) => {
            var n = document.getElementById('customName').value;
            const repo = {
                github: document.getElementById('customRepo').value,
                type: 'github',
                filePattern: document.getElementById('customFilePattern').value
            };
    
            if (repo.filePattern.length == 0)
                repo.filePattern = null;
    
            await CheatSheetCatalog.install(n, repo, e);
            this.#render();
            e.preventDefault();
        });

        ev.connect('click', 'button#removeFolder', async (e) => {
            let group = e.getAttribute('data-group');
            await Section.removeGroup(group);
            this.#render();
            e.preventDefault();
        });

        ev.connect('click', '.installable button', async (e) => {
            let section = e.getAttribute('data-section');
            await CheatSheetCatalog.install(this.#group, section, this.#repos[section], e);
            this.#render();
            e.preventDefault();
        });

        ev.connect('click', '.installed button', async (e) => {
            let section = e.getAttribute('data-section');
            await CheatSheetCatalog.remove(this.#group, section);
            this.#render();
            e.preventDefault();
        });
    }

    async #getDiskUsage() {
        if (!navigator.storage)
            return "Sorry: Browser does not report usage!";

        const estimate = await navigator.storage.estimate();
        const used = Math.floor(estimate.usage / 1024 / 1024);
        const available = Math.floor((estimate.quota - estimate.usage) / 1024 / 1024);

        return `${used} MB used / ${available} MB available`;
    }
}