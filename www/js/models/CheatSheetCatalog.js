// vim: set ts=4 sw=4:

import { App } from '../app.js';
import { Config } from '../config.js';
import { ContentSource } from './ContentSource.js';
import { DB } from './DB.js';
import { SearchIndex } from './SearchIndex.js';
import { Section } from './Section.js';
import { Settings } from './Settings.js';

// Installing content from a catalog of curated sources
//
// There are 2 installation modes: linked and downloaded.
// The "linked" mode is used for cheat sheets that are
// already installed in the app. We do not want to impose
// an initial download of all cheat sheets, so we link them.

// Therefore we have
//
// "site" cheat sheets:
// - configured in config.js
// - are linked only
//
// 3rd party cheat sheets:
// - are downloaded completely
// - are defined in catalog JSON source from config.js

export class CheatSheetCatalog {
    // Fetch the catalog for a group
    static getInstallable = async (group) => 
        Config.groups[group]?.catalog
            ?await fetch(Config.groups[group].catalog.source)
                .then((response) => response.json())
                .then((data) => {
                    if (data)
                        return data;
                    else
                        throw new Error(`Error fetching ${group} catalog`);
                })
            :{};

    // Installs a section group (as defined in Config.groups)
    static async #installGroup(group) {
        try {
            for (const name of Object.keys(Config.groups[group].install)) {
                const repo = Config.groups[group].install[name];
                await this.install(group, name, repo, undefined, false);
            }
        } catch (e) {
            console.error(`Error fetching index ${Config.indexUrls[group].index}: ${e}`);
        }
    }

    // Updates the index of all installed sections if they need updating
    // Installs default cheat sheets on uninitialized app.
    static async update() {
        const sections = await Section.getTree();
        const initialRun = await Settings.get('initialRun', true);

        if(!initialRun) {
            console.log('Checking for orphaned documents...');
            const result = await DB.getAllKeys("settings", "settings");
            for(const path of result) {
                if(0 == path.indexOf('document:::')) {
                    const tmp = path.split(/:::/);
                    if(!sections.nodes[tmp[1]] ||
                       !sections.nodes[tmp[1]].nodes ||
                       !sections.nodes[tmp[1]].nodes[tmp[2]]
                    ) {
                        console.log(`Dropping orphaned doc: ${path}`);
                        Settings.remove(path);
                    }
                }
            }

            console.log('Checking for missing sections...');
            for(const name of Object.keys(Config.groups)) {
                if(!sections.nodes[name] && !Config.groups[name].removable && name !== "Feeds") {
                    console.log(`Installing missing section: ${name}`);
                    this.#installGroup(name);
                }
            }
            return;
        }

        console.log(`Initial run. Initializing groups...`);
        for(const group of Object.keys(Config.groups)) {
            if(!Config.groups[group].install)
                continue;

            // A groups needs processing only if
            // - it is the initial run
            // - it is installed and needs updating

            // FIXME: do update the index from time to time
            if(sections.nodes[group])
                continue;

            this.#installGroup(group);
        }

        await Settings.set('initialRun', false);
        console.log('Initial run finished');

        document.dispatchEvent(new CustomEvent("sections-updated"));
    }

    static removeGroup(group) {
        Section.removeGroup(group);
        App.pathChanged('');

        SearchIndex.update();
    }

    static remove(group, section) {
        Section.remove(group, section);

        SearchIndex.update();
    }

    // Section installation with full download per default (linking is optional)
    // FIXME: support delta download too
    static async install(group, section, repo, e = undefined, download = true) {
        let info = document.createElement("pre");
        info.class = "note";
        info.innerText = "Fetching content...\n";
        if (e)
            e.parentNode.append(info);

        await ContentSource.fetchNewSection(group, section, repo, download).catch(e => {
            console.error(`Error fetching '${section}' from ${repo.github}: ${e}`);
            info.innerText += `Error fetching '${section}' from ${repo.github}: ${e}\n`;
        });

        document.dispatchEvent(new CustomEvent("sections-updated"));
        SearchIndex.update();
    }
}
