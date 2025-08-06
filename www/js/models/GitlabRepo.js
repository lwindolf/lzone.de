// vim: set ts=4 sw=4:

/* Fetching content from Gitlab instances */

export class GitlabRepo {

        static async fetch(repo) {
            var repoInfo;
    
            // fetch default branch first
            var data = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(repo.gitlab)}`)
                .then((response) => response.json())
                .then((data) => { repoInfo = data; return fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(repo.gitlab)}/repository/tree?ref=${data.default_branch}&recursive=true`)})
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