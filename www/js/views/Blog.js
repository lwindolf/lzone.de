// vim: set ts=4 sw=4:

import { Libraries } from "../libraries.js";

// Simple markdown based blog landing page

export class BlogView {
    static async render(el, blogSource, feed) {
        const showdown = await Libraries.get('md');

        /* We are loaded with links like "https://lzone.de/blog.html#2023-05-02-Disable%20sleep%20key%20on%20keyboard"
        so the markdown file path comes after /blog/ */
        if (document.location.hash.length > 1) {
            const path = document.location.hash.substring(1);
            const source = blogSource + path + '.md';
            let title = decodeURI(path);
            let date = title.match(/^\d{4}-\d{2}-\d{2}/);
            if (date) {
                // Strip date from title
                title = title.substring(date[0].length + 1).trim();
                // Convert date to a readable format
                const dateObj = new Date(date[0]);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                date = dateObj.toLocaleDateString(undefined, options);
            } else {
                date = 'Unknown date';
            }
            el.innerHTML = 'Loading blog page';
            fetch(source)
                .then(response => response.text())
                .then(text => {
                    // Convert markdown to HTML
                    const html = showdown.makeHtml(text);
                    const frontmatter = showdown.getMetadata();
                    let result = `<h1>${title}</h1>`;
                    if(date)
                        result += `<small>Posted: ${date}</small>`;
                    if (frontmatter && frontmatter.categories) {
                        const categories = frontmatter.categories.split(/[\[\],\s]+/).map(cat => cat.trim()).filter(cat => cat);
                        result += `<br/><small>Categories: ${categories.join(', ')}</small>`;
                    }
                    //if (frontmatter && frontmatter.categories)
                      //  result += `<br/><small>Categories: ${JSON.parse(frontmatter.categories).join(', ')}</small>`;
                    el.innerHTML = result + html;
                })
                .catch(error => {
                    el.innerHTML = 'Error loading blog post!';
                    console.error("Error loading blog post:", error);
                });

        }

        // Alway load recent posts
        fetch(feed)
            .then(response => response.text())
            .then(xmlText => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                const items = xmlDoc.querySelectorAll("entry");
                let recentPosts = '<hr/><aside><h2>Recent Blog Posts</h2><ul>';
                items.forEach((item, index) => {
                    if (index < 5) { // Limit to 5 recent posts
                        const title = item.querySelector("title").textContent;
                        const link = item.querySelector("link").getAttribute("href");
                        const date = new Date(item.querySelector("updated").textContent).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        recentPosts += `<li><a href="${link}">${title}</a> <small>(${date})</small></li>`;
                    }
                });
                recentPosts += '</ul><aside><hr/>';
                el.innerHTML += recentPosts;
            })
            .catch(error => {
                console.error("Error loading recent posts:", error);
            });
    }
}