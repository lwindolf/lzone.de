// vim: set ts=4 sw=4:

import { GithubRepo } from './GithubRepo.js';
import { GitlabRepo } from './GitlabRepo.js';
import { Section } from './Section.js';

/* Fetching content from a supported source type 

   Emits
    - "download-finished" when a document is downloaded
*/

export class ContentSource {

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

    static async fetchNewSection(group, section, repo, download) {
        const filePattern = repo.filePattern ? repo.filePattern : "^(.+)\\.(md|markdown|rst|adoc|asciidoc)$";
        const re = new RegExp(filePattern);
        let downloads = [];
        let result;

        // Supported repo types returns an 'data' array of download + edit URLs tuples, e.g. for Github
        // and repo metadata in 'section' object.
        //
        // {
        //   paths: [
        //     {
        //       path     : '<relative path to file>',
        //       download : 'https://raw.githubusercontent.com/${repo.github}/${result.data.sha}/${e.path}',
        //       edit     : 'https://github.com/${repo.github}/edit/${s.default_branch}/${e.path}'
        //     }
        //   ],
        //   section: {
        //     url: '...',
        //     author: '...',
        //     homepage: '...',
        //     license: '...',
        //     default_branch: '...'
        //   }
        if (repo.github) {
            console.log(`Fetching from ${repo.github}...`);
            result = await GithubRepo.fetch(repo);
        } else if (repo.gitlab) {
            console.log(`Fetching from ${repo.gitlab}...`);
            result = await GitlabRepo.fetch(repo);
        } else {
            throw new Error(`Unsupported repo type!`);
        }

        let s = result.section;
        s.children = [];

        // Filter and download/link results
        result.paths.forEach((p) => {
            // FIXME fileMatch should be done in ContentSource
            var m = this.#fileMatch(p.path, repo.folder, re);
            if (!m.target)
                return;

            m.target = m.target.replace(/\//g, ':::');
            if(download)
                downloads.push(this.documentDownload(
                    group,
                    section,
                    m.target,
                    p.download,
                    p.edit
                ).then(() =>
                    document.dispatchEvent(new CustomEvent("download-finished", { detail: p.path }))
                ))
            else
                this.#documentLink(
                    group,
                    section,
                    m.target,
                    p.download,
                    p.edit
                );
                                            
            s.children.push(m.target);
        });

        await Section.add(group, section, s);
        await Promise.all(downloads);
    }
}