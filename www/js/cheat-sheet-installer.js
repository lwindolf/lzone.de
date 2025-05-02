// vim: set ts=4 sw=4:

import { Config } from './config.js';
import { GithubRepo } from './github-repo.js';
import { Sidebar } from './sidebar.js';
import { Search } from './search.js';
import { Section } from './section.js';
import { Settings } from './settings.js';

// Installing site and 3rd party cheat sheets from curated sources
//
// site cheat sheets:
// - are linked only, index update on each run
// - fetched from cheat-sheets.json
//
// 3rd party cheat sheets:
// - are downloaded once
// - fetched from extra-cheat-sheets.json
//
// For now only Github as source is supported

class CheatSheetInstaller {

    static #staticConstructor = (async () => {
        // Always update site cheat sheets index
        const response = await fetch(Config.cheatSheetIndexUrl);
        const repos = await response.json();

        for(const name of Object.keys(repos)) {
            // Installation without download, here we get a full repo definition
            // and just need to create documents containing a link. Example repo
            // definition:
            //
            //   "Runbooks": {
            //      "github": "lwindolf/lzone-cheat-sheets",
            //      "base": https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/runbooks/";
            //      "category": "SRE",
            //      "filePattern": "^runbooks/(.+)\\.md$",
            //      "documents": [
            //          {
            //            "name": "Mail",
            //            "path": "runbooks/Mail.md"
            //          },
            //          {
            //            "name": "System Log",
            //            "path": "runbooks/System Log.md"
            //          },
            //          [...]
            //   },
            let s = {
                children : [],
                link     : true,
                default  : true,
                homepage : 'https://lzone.de/#/' + name,
                url      : 'https://github.com/' + repos[name].github,
                base     : repos[name].base,
                runbook  : repos[name].runbook
            };
            for (const d of repos[name].documents) {
                let target = d.name.replace(/\//g, ':::');

                // FIXME: set only new/gone childs
                await Settings.set(`document:::${name}:::${target}`, {
                    type: 'link',
                    baseUrl: repos[name].base + d.path,
                    editUrl: 'https://github.com/' + repos[name].github + '/edit' + repos[name].base.replace(new RegExp('.*'+repos[name].github), '') + d.path
                });
                s.children.push(target);
            }
            await Section.add(name, s);
        }

        // Cleanup orphaned default sections
        for(let s of await Section.getAll()) {
            if(s.default && repos[s.name])
                Section.remove(s);
        }

        // Cleanup orphan documents
        const sectionNames = await Settings.get('extraSections', []);
        const req = await Settings.getAllKeys();
        req.onsuccess = () => {
            for(const path of req.result) {
                if(0 == path.indexOf('document:::')) {
                    const tmp = path.split(/:::/);
                    if(!sectionNames.includes(tmp[1])) {
                        console.log(`Dropping orphaned doc: ${path}`);
                        Settings.remove(path);
                    }
                }
            }
        };

        // FIXME: emit event instead
        Sidebar.update();

        // FIXME: clean up orphans
    })();

    static async #documentDownload(section, path, url, editUrl) {
        // on first download ask user about persistance
        navigator.storage.persist();

        await fetch(url)
            .then((response) => response.text())
            .then(async (data) => {
                await Settings.set(`document:::${section}:::${path}`, {
                    data: data,
                    baseName: url.replace(/.*\//, ''),
                    baseUrl: url.replace(/\/[^/]+$/, ''),
                    editUrl: editUrl
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

    // Installation with full download
    static async install(section, repo, e) {
        const filePattern = repo.filePattern ? repo.filePattern : "^(.+)\\.(md|markdown|rst|adoc|asciidoc)$";
        const re = new RegExp(filePattern);
        let downloads = [];

        let info = document.createElement("pre");
        info.class = "note";
        info.innerText = "Fetching content...\n";
        e.parentNode.append(info);

        await GithubRepo.fetch(repo).then(async (result) => {
            var s = result.section;
            s.children = [];

            for (let i = 0; i < result.data.tree.length; i++) {
                let e = result.data.tree[i];
                var m = this.#fileMatch(e.path, repo.folder, re);
                if (m.target) {
                    m.target = m.target.replace(/\//g, ':::');
                    downloads.push(this.#documentDownload(section, m.target,
                        `https://raw.githubusercontent.com/${repo.github}/${result.data.sha}/${e.path}`,
                        `https://github.com/${repo.github}/edit/${s.default_branch}/${e.path}`)
                        .then(() => {
                            info.innerText += `Download success: ${e.path}\n`;
                        })
                    )
                    s.children.push(m.target);
                }
            }
            await Section.add(section, s);
        });
        return Promise.all(downloads).then(async () => {
            // FIXME: emit event instead
            Sidebar.update();
            Search.init();
        });
    }

    static async remove(section) {
        await Section.remove(section);
        Sidebar.update();
    }
}

export { CheatSheetInstaller };
