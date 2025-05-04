// vim: set ts=4 sw=4:

import { Section } from '../models/Section.js';
import * as r from '../helpers/render.js';

// Rendering markup & HTML cheat sheet content
//
// - supported formats HTML, Markdown, restructured, asciidoc
// - supports YouTube video embedding
// - supports Mermaid diagrams
// - XSS protection using DOMPurify

class CheatSheetRenderer {
    static #converters;

    static #youtubeTemplate = r.template(`
        <div class='video'>
            <a class='glightbox' href='{{ href }}'>
                <img src='https://i.ytimg.com/vi/{{ ytid }}/hqdefault.jpg'/>
            </a>
            <div class='title'>{{ title }}</div>
            <div class='caption'>{{ caption }}</div>
        </div>
    `);

    static #sourceTemplate = r.template(`
        <h1>{{ name }}</h1>

        {{#if url}}
        <table>
            {{#if author}}
                <tr><td>Author</td><td>{{author}}</td></tr>
            {{/if}}
            {{#if homepage}}
                <tr><td>Homepage</td><td><a href="{{homepage}}">{{homepage}}</a></td></tr>
            {{/if}}
            <tr><td>Source</td><td><a href="{{url}}">{{url}}</a></td></tr>
            {{#if license}}
                <tr><td>License</td><td><a href="{{license.url}}">{{license.name}}</td></tr>
            {{/if}}
        </table>
        {{/if}}

        {{#* inline "cheatSheetTocNode"}}
            <li>
                <a href="/#/{{#reSub ':::' '/'}}{{id}}{{/reSub}}">{{name}}</a>
                <ul>
                {{#each nodes}}
                    {{>cheatSheetTocNode}}
                {{/each}}
                </ul>
            </li>
        {{/inline}}
        <h2>Contents</h2>
        <ul>
            {{#each nodes}}
                {{>cheatSheetTocNode}}
            {{/each}}
        </ul>
    `);

    static async #setup () {
        let csr = CheatSheetRenderer;

        // Import all converters/renderers (except showdown with cannot be loaded with import())

        const {
            default: DOMPurify
        } = await import('../vendor/purify.es.js');
        
        const {
            default: Asciidoctor
        } = await import('../vendor/asciidoctor.min.js');

        await import('../vendor/mermaid.min.js');
        await import('../vendor/rst2html.min.js');

        // Configure stuff

        const md = new window.showdown.Converter({
            tables: true,
            metadata: true,
            ghCodeBlocks: true
        });
        md.setFlavor('github');
        md.setOption('simpleLineBreaks', false);

        window.mermaid.initialize({
            startOnLoad: false,
            logLevel: "error"
        });

        csr.#converters = {
            // general
            DOMPurify,
            mermaid: window.mermaid,

            // by file extension
            rst  : window.rst2html,
            md   : md,
            adoc : new Asciidoctor()
        };
    }

    // In-place replaces all Youtube video links found with a glightbox embed
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
        window.GLightbox({ selector: '.main-content .glightbox'});
    }

    // Just returns rendered contents for a document (without layout / breadcrumbs ...)
    // Returns document details or undefined if no content was found for the given path
    static async renderDocument(e, path) {
        let baseUrl;
        let d = await Section.getDocument(path);
        if (!d)
            return undefined;

        if(!this.#converters)
            await this.#setup();

        baseUrl = encodeURI(d.baseUrl);
        if (d.type === "link")
            d.data = await fetch(baseUrl + "/" + d.baseName)
                .then((response) => response.text());

        if (!d.data)
            return undefined;

        let html = '';
        let frontmatter = {};

        // FIXME: use service workers for rendering to get some isolation!
        try {
            if(d.baseName?.match(/\.rst$/)) {
                html = this.#converters['rst'](d.data);

            } else if(d.baseName?.match(/\.(adoc|asciidoc)$/)) {
                html = this.#converters['adoc'].convert(d.data);

            // Default to markdown
            } else {
                // Replace all relative markdown links with absolute ones
                d.data = d.data.replace(/(\[[^\]]+\])\(\//g, '$1(' + baseUrl + '/');

                html = this.#converters['md'].makeHtml(d.data);
                frontmatter = this.#converters['md'].getMetadata();
            }

            html = this.#converters['DOMPurify'].sanitize(html);
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
        await this.#converters['mermaid'].run({
            querySelector: '.main-content .mermaid'
        });

        return d;
    }

    static async load(e, path) {
        var tmp = path.split(/\//);
        e.innerHTML = "";

        // continue with ::: instead of / for separator as this is better for CSS selectors
        path = tmp.join(":::");

        // If it is no special view load the content
        let s = await Section.get(path);
        if (s.nodes && Object.keys(s.nodes).length > 0) {
            // Load section description
            e.insertAdjacentHTML('afterbegin', this.#sourceTemplate(s));
        } else {
            let d = await this.renderDocument(e, path);
            if (!d?.data)
                e.insertAdjacentHTML('beforeend', "No content on this page.");     

            // Add <h1> if markdown didn't provide one
            if (-1 == e.innerHTML.indexOf("<h1"))
                e.insertAdjacentHTML('afterbegin', `<h1>${s.name}</h1>`);

            var h = document.getElementsByTagName('h1')[0];
            if (h && d) {
                // Add edit button to <h1>
                if (d?.editUrl)
                    h.innerHTML += `<button id='editBtn' title='Edit in Github' data-edit-url="${d.editUrl}" class="btn">Edit</button>`;

                // If section has runbook flag add runbook button to <h1>
                /*
                if (s.runbook === "true") {
                    h.innerHTML += `<button id='runbookBtn' title="Turn to Runbook that let's you run code blocks via WurmTerm" style="float: right; display: block; background: rgb(44, 132, 250); color: white; margin-left: 6px;" class="btn fs-4">Runbook</button>`;

                    document.getElementById('runbookBtn').onclick = (el) => {
                        Runbook.enable(document.querySelector('#main-content'));
                        el.target.remove();
                    };
                }*/

                if (d?.editUrl)
                    document.getElementById('editBtn').onclick = (el) => {
                        window.open(el.target.dataset['editUrl'], "_blank");
                    };
            }
        }

        // Scroll to content top
        // FIXME: should be a ContentView method
        document.querySelector(`#main-content-content h1`).scrollIntoView({ block: "nearest" });
    }
}

export class CheatSheetView {
        constructor(el, path) {
                CheatSheetRenderer.load(el, path)
        }
}