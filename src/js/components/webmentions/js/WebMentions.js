// vim: set ts=4 sw=4:

/* Web mentions custom element using webmentions.io */

import { Config } from '../../../config.js';

class WebMentions extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div id="webmentions">
                <div id="webmentionContainer"></div>
            </div>

            <form action="https://webmention.io/${Config.domain}/webmention" method="POST">
                <p>You wrote about <a href="https://${Config.domain}" rel="nofollow">${Config.domain}</a>? Link it:</p>
                <input type="url" autocomplete="url" pattern="^https?:\\/\\/.+" name="source" size="10" placeholder="Your post URL" />
                <input id="webmention-format" type="hidden" name="format" value="html">
                <input id="webmention-target" type="hidden" name="target" value="https://${Config.domain}">
                <button>Ping me!</button>
            </form>
        `;

        // render styles and widget from https://github.com/PlaidWeb/webmention.js
        const style = document.createElement('style');
        style.textContent = `
            #webmentions {
                margin: 0;
                margin-bottom: 1rem;
                position: relative;
                z-index: 100;
                line-height: 1.2em;
            }

            #webmentions .comments {
                max-height: 20em;
                overflow-x: hidden;
                overflow-y: scroll;
                font-size: 80%;
            }

            #webmentions h2 {
                font-size: medium;
                margin: 0;
                padding: 2px;
                background: var(--darkerbg);
            }

            #webmentions .reacts img {
                margin: 3px -1ex 1px 0;
            }

            #webmentions img.missing {
                background: white;
                border: dashed black 1px;
            }

            #webmentions ul {
                list-style-type: none;
                margin: 0;
                padding: 4px;
            }

            #webmentions li {
                text-indent: -1em;
                padding-left: 1em;
            }

            #webmentions a.reaction {
                position: relative;
                text-decoration: none;
                text-shadow: 0px 0px 3px white;
                margin-right: 0;
                letter-spacing: -1ex;
                margin-right: 1ex;
            }

            #webmentions a.reaction img {
                max-height: 1.3em;
                width: auto;
                margin-right: -1ex;
                border-radius: 25%;
            }

            #webmentions a.reaction sub {
                font-size: 50%;
            }

            #webmentions .comments li {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }

            #webmentions .comments li .text {
                color: var(--tblue);
                font-style: italic;
                text-decoration: none;
            }

            #webmentions .comments li .name {
                color: var(--tblue);
            }
        `;
        document.head.appendChild(style);

        new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${Config.toolboxComponents['Web Mentions'].import.replace(/WebMentions.js/, '')}webmention.js`;
            script.setAttribute('data-id', 'webmentionContainer');
            script.setAttribute('data-wordcount', '30');
            script.setAttribute('data-prevent-spoofing', 'true');
            script.setAttribute('data-comments-are-reactions', 'true');
            script.setAttribute('data-page-url', 'https://' + Config.domain);
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        })
        .then(() => {
            console.log(window.renderWebMentions);
            window.renderWebMentions();
        })
        .catch((error) => {
            console.error('Error loading webmention.js:', error);
        });
    }
}

export class WebMentionsSettings extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<p>There are currently no settings for webmentions.</p>';
    }
}

if (!customElements.get('x-web-mentions')) {
    customElements.define('x-web-mentions', WebMentions);
    customElements.define('x-web-mentions-settings', WebMentionsSettings);
}