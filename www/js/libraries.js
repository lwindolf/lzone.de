// vim: set ts=4 sw=4:

// helper for defered loading and initialization of different libraries

export class Libraries {
    // state
    static #libs = {};

    // ad-hoc loading of necessary libraries
    static async get(name) {
        let c;

        if (this.#libs[name])
            return this.#libs[name];

        switch (name) {
            case 'md': {
                const md = new window.showdown.Converter({
                    tables: true,
                    metadata: true,
                    ghCodeBlocks: true
                });
                md.setFlavor('github');
                md.setOption('simpleLineBreaks', false);
                c = md;
                break;
            }
            case 'DOMPurify': {
                const {
                    default: DOMPurify
                } = await import('./vendor/purify.es.mjs');
                c = DOMPurify;
                break;
            }
            case 'adoc': {
                const {
                    default: Asciidoctor
                } = await import('./vendor/asciidoctor.min.js');
                c = new Asciidoctor();
                break;
            }
            case 'Mermaid': {
                const {
                    default: Mermaid
                } = await import('./vendor/mermaid.esm.min.mjs');

                Mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'antiscript',
                    logLevel: 'error'
                });

                c = Mermaid;
                break;
            }
            case 'rst': {
                await import('./vendor/rst2html.min.js');
                c = window.rst2html;
                break;
            }
            default: {
                throw new Error(`Unknown converter: ${name}`);
            }
        }

        this.#libs[name] = c;
        return this.#libs[name];
    }
}