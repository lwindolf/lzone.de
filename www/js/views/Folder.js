import { App } from "../app.js";
import { Section } from "../models/Section.js";
import * as r from "../helpers/render.js";

export class FolderView {
    static #sourceTemplate = r.template(`
        <h1>{{ name }}</h1>

        {{#if section.url}}
        {{#with section}}
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
        {{/with}}
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
            {{#each section.nodes}}
                {{>cheatSheetTocNode}}
            {{/each}}
        </ul>
    `);

    constructor(el) {
        FolderView.render(el, App.getPath());
    }

    static render = async (el, path) =>
        r.renderElement(el, FolderView.#sourceTemplate, {
            name: path.split('/').pop(),
            url: path,
            section: await Section.get(path.replace(/\//g, ':::'))
        });
};