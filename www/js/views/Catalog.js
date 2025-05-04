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
        <h2>
            Installable Content
            {{#if properties.catalog.editUrl }}
                <a href="{{ properties.catalog.editUrl }}" target="_blank">
                    <button>Edit</button>
                </a>
            {{/if }}
        </h2>

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
            Add a Github repo of your own to the app:

            <div id='customInstall'>
                <table>
                    <tr>
                        <td>Name:</td>
                        <td><input type='text' id='customName' placeholder='Title'/></td>
                    </tr>
                    <tr>
                        <td>Repo:</td>
                        <td><input type='text' id='customRepo' placeholder='<user>/<repo>'/>
                    </tr>
                    <tr>
                        <td>File Pattern: (optional Regex with exactly one capture group to extract names)<br/>
                        <td><input type='text' id='customFilePattern' placeholder='^path/(.*)\\.md$'/></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><button class="btn">Add</button></td>
                    </tr>
                <table>
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

        document.addEventListener('sections-updated', this.#render.bind(this));
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

        ev.connect('click', '#customInstall button', (e) => {
            const repo = {
                github: document.getElementById('customRepo').value,
                type: 'github',
                filePattern: document.getElementById('customFilePattern').value
            };
    
            if (repo.filePattern.length == 0)
                repo.filePattern = null;
    
            CheatSheetCatalog.install(
                document.getElementById('customName').value,
                repo,
                e.target
            );
        });

        ev.connect('click', 'button#removeFolder', (e) =>
            Section.removeGroup(e.getAttribute('data-group')));

        ev.connect('click', '.installable button', (e) =>           
            CheatSheetCatalog.install(
                this.#group,
                e.getAttribute('data-section'),
                this.#repos[e.getAttribute('data-section')],
                e
            ));

        ev.connect('click', '.installed button', async (e) =>
            Section.remove(this.#group, e.getAttribute('data-section')));
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