// vim: set ts=4 sw=4:

import { App } from '../app.js';
import { Config } from '../config.js';
import { DB } from './DB.js';
import { GithubRepo } from './GithubRepo.js';
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
//
// For now only Github as source is supported

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

    // add a document that is only a link and will only be downloaded on demand
    static #documentLink(group, section, path, url, editUrl) {
        Section.addDocument(group, section, path, {
            type: 'link',
            baseName: url.replace(/.*\//, ''),
            baseUrl: url.replace(/\/[^/]+$/, ''),
            editUrl
        });
    }

    static async documentDownload(group, section, path, url, editUrl) {
        // on first download ask user about persistance
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist();
        }

        await fetch(url)
            .then((response) => response.text())
            .then(async (data) => {
                Section.addDocument(group, section, path, {
                    data,
                    baseName: url.replace(/.*\//, ''),
                    baseUrl: url.replace(/\/[^/]+$/, ''),
                    editUrl
                });
            });
    }

    static #fileMatch(path, folder = null, re) {
        var result = {
            match: path.match(re),
            target: null
        };

        if (result.match) {
            if (folder) {
                var tmp = path.split(folder);
                // if we have a matching document in a folder than strip the folder name
                if (2 == tmp.length)
                    result.target = result.match[1].substring(folder.length + 1);
                // if we have a matching document outside the folder than drop it
                else
                    result.match = null;
            } else {
                result.target = result.match[1];
            }
        }
        return result;
    }

    // Installation with optional full download
    // FIXME: support delta download too
    static async install(group, section, repo, e = undefined, download = true) {
        const filePattern = repo.filePattern ? repo.filePattern : "^(.+)\\.(md|markdown|rst|adoc|asciidoc)$";
        const re = new RegExp(filePattern);
        let downloads = [];

        let info = document.createElement("pre");
        info.class = "note";
        info.innerText = "Fetching content...\n";
        if (e)
            e.parentNode.append(info);

        // FIXME: move to GithubRepo.js
        console.log(`Fetching ${section} from ${repo.github}...`);
        await GithubRepo.fetch(repo).then(async (result) => {
            var s = result.section;
            s.children = [];

            for (let i = 0; i < result.data.tree.length; i++) {
                let e = result.data.tree[i];
                var m = this.#fileMatch(e.path, repo.folder, re);
                if (m.target) {
                    m.target = m.target.replace(/\//g, ':::');
                    if(download)
                        downloads.push(this.documentDownload(group, section, m.target,
                            `https://raw.githubusercontent.com/${repo.github}/${result.data.sha}/${e.path}`,
                            `https://github.com/${repo.github}/edit/${s.default_branch}/${e.path}`)
                            .then(() => {
                                info.innerText += `Download success: ${e.path}\n`;
                            })
                        )
                    else
                        this.#documentLink(group, section, m.target,
                            `https://raw.githubusercontent.com/${repo.github}/${result.data.sha}/${e.path}`,
                            `https://github.com/${repo.github}/edit/${s.default_branch}/${e.path}`);
                                                    
                    s.children.push(m.target);
                }
            }
            await Section.add(group, section, s);
        });
        return Promise.all(downloads).then(async () => {
            document.dispatchEvent(new CustomEvent("sections-updated"));
            // FIXME: emit event instead
            Search.init();
        });
    }
}
