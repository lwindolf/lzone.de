// vim: set ts=4 sw=4:

import * as r from '../../helpers/render.js';
import { Libraries } from '../../libraries.js';

// Rendering markdown & HTML cheat sheet content
//
// - supported formats HTML, Markdown, restructured, asciidoc
// - supports simple YouTube thumb embedding
// - supports Mermaid diagrams
// - XSS protection using DOMPurify

export class CheatSheetRenderer {
    static #youtubeTemplate = r.template(`
        <div class='video'>
            <a href='{{ href }}'>
                <img src='https://i.ytimg.com/vi/{{ ytid }}/hqdefault.jpg'/>
            </a>
            <div class='title'>{{ title }}</div>
            <div class='caption'>{{ caption }}</div>
        </div>
    `);

    // In-place replaces all Youtube video links found with a image link
    static #embedVideos(e) {
        const regex = new RegExp("^https://www\\.youtube\\.com/watch\\?v=");
        e.querySelectorAll('a[href*="https://www.youtube.com/watch?v="]').forEach((e) => {
            const text = e.innerText.split(/---/);

            e.innerHTML = this.#youtubeTemplate({
                href    : e.href,
                ytid    : e.href.replace(regex, ""),
                title   : text[0],
                caption : text[1]
            });
        });
    }

    // Just returns rendered contents for a document (without layout / breadcrumbs ...)
    // Returns document details or undefined if no content was found for the given path
    static async renderDocument(e, d) {
        let baseUrl = encodeURI(d.baseUrl);

        if (d.type === "link") {
            // FIXME: cache downloaded document
            e.innerHTML = `Fetching content from <a href="${d.baseUrl}">${d.baseUrl}</a>...`;
            d.data = await fetch(baseUrl + "/" + d.baseName)
                .then((response) => response.text());
        }

        if (!d.data)
            return undefined;

        let html = '';
        let frontmatter = {};

        // FIXME: use service workers for rendering to get some isolation!
        try {
            if(d.baseName?.match(/\.rst$/)) {
                html = (await Libraries.get('rst'))(d.data);

            } else if(d.baseName?.match(/\.(adoc|asciidoc)$/)) {
                html = (await Libraries.get('adoc')).convert(d.data);

            // Default to markdown
            } else {
                // Replace all relative markdown links with absolute ones
                d.data = d.data.replace(/(\[[^\]]+\])\(\//g, '$1(' + baseUrl + '/');

                html = (await Libraries.get('md')).makeHtml(d.data);
                frontmatter = (await Libraries.get('md')).getMetadata();
            }

            html = (await Libraries.get('DOMPurify')).sanitize(html);
        } catch(e) {
            console.error(e);
            html = 'ERROR: Content rendering error!';
        }

        // Replace all remaining relative HTML links
        e.innerHTML = html.replace(/(<img[^>]src=["'])\//g, '$1' + baseUrl + '/')
            .replace(/(<img[^>]+src=["'])([^h:][^t][^t][^p])/g, '$1' + baseUrl + '/$2')
            .replace(/(<a[^>]+href=["'])([^#h:][^t][^t][^p])/g, '$1' + baseUrl + '/$2');

        // Video embedding
        if (frontmatter?.videoEmbed === "true")
            this.#embedVideos(e);

        // to adapt to justthedocs CSS we have to re-wrap all <pre> with <div class="language-plaintext highlighter-rouge">
        Array.prototype.forEach.call(e.getElementsByTagName("pre"), (p) => {
            var divNode = document.createElement("div");
            divNode.classList.add("language-plaintext");
            divNode.classList.add("highlighter-rouge");
            p.parentNode.insertBefore(divNode, p);
            divNode.appendChild(p);
        });

        // Finally render mermaid diagrams
        await (await Libraries.get('Mermaid')).run({
            querySelector: '.main-content-view .mermaid'
        });

        return d;
    }

    static async load(e, d) {
        await this.renderDocument(e, d);

        // Add <h1> if markdown didn't provide one
        if (-1 == e.innerHTML.indexOf("<h1"))
            e.insertAdjacentHTML('afterbegin', `<h1>${d.baseName.replace(/\.[^.]*$/, "")}</h1>`);

        var h = document.getElementsByTagName('h1')[0];
        if (h && d) {
            // Add edit button to <h1>
            if (d?.editUrl)
                h.innerHTML += `<button id='editBtn' title='Edit in Github' data-edit-url="${d.editUrl}" class="btn">Edit</button>`;

            if (d?.editUrl)
                document.getElementById('editBtn').onclick = (el) => {
                    window.open(el.target.dataset['editUrl'], "_blank");
                };
        }
    }
}