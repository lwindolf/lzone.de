// vim: set ts=4 sw=4:

/* Fetching content from github.com */

export class GithubRepo {

    static async fetch(repo) {
        var repoInfo;

        // fetch default branch first
        var data = await fetch(`https://api.github.com/repos/${repo.github}`)
            .then((response) => response.json())
            .then((data) => { repoInfo = data; return fetch(`https://api.github.com/repos/${repo.github}/git/trees/${data.default_branch}?recursive=1`)})
            .then((response) => response.json())
            .catch(e => {
                throw new Error(`Error on Github request: ${e}'`);
            });

        if(data.response && data.response.test(/Too many requests/))
            throw new Error(`Github API rate limit exceeded!`);

        if(!data.tree)
            throw new Error(`No 'tree' data when fetching from Github!`);

        return {
            paths: data.tree.map((e) => {
                return {
                    path     : e.path,
                    download : `https://raw.githubusercontent.com/${repo.github}/${data.sha}/${e.path}`,
                    edit     : `https://github.com/${repo.github}/edit/${repoInfo.default_branch}/${e.path}`
                }
            }),
            section : {
                url             : repoInfo.html_url,
                author          : repoInfo.owner.login,
                homepage        : repoInfo.homepage,
                license         : repoInfo.license,
                default_branch  : repoInfo.default_branch
            }
        };
    }
}