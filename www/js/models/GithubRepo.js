// vim: set ts=4 sw=4:

/* Fetching content from Github */

export class GithubRepo {

    static async fetch(repo) {
        var repoInfo;

        // fetch default branch first
        var data = await fetch(`https://api.github.com/repos/${repo.github}`)
            .then((response) => response.json())
            .then((data) => { repoInfo = data; return fetch(`https://api.github.com/repos/${repo.github}/git/trees/${data.default_branch}?recursive=1`)})
            .then((response) => response.json());

        // FIXME: error handling

        return {
            data,
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