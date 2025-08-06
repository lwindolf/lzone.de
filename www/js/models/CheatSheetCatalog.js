// vim: set ts=4 sw=4:

import { App } from '../app.js';
import { Config } from '../config.js';
import { ContentSource } from './ContentSource.js';
import { DB } from './DB.js';
import { Search } from '../search.js';
import { Section } from './Section.js';
import { Settings } from './Settings.js';

// Installing site and 3rd party cheat sheets from curated sources
//
// site cheat sheets:
// - are linked only, index update on each run
// - fetched from defined index JSON
//
// 3rd party cheat sheets:
// - are downloaded once
// - fetched from 3rd party repo as defined in catalog JSONs

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
                
            try {                
                for (const name of Object.keys(Config.groups[group].install)) {
                    const repo = Config.groups[group].install[name];
                    await this.install(group, name, repo, undefined, false);
                }

                // FIXME: Cleanup orphaned default sections
                /*for(const tree of await Section.getTree()) {
                    if(s.default && repos[s.name])
                        Section.remove(group, s);
                }*/

            } catch (e) {
                console.error(`Error fetching index ${Config.indexUrls[group].index}: ${e}`);
            }

        }

        await Settings.set('initialRun', false);
        console.log('Initial run finished');

        document.dispatchEvent(new CustomEvent("sections-updated"));
    }

    static removeGroup(group) {
        Section.removeGroup(group);
        App.pathChanged('');
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
        // FIXME: emit event to Search instead
        Search.init();
    }
}
