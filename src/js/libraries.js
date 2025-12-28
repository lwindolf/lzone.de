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
            case 'Split': {
                const {
                    default: Split
                } = await import(/* webpackIgnore: true */"lib_split");
                c = Split;
                break;
            }
            case 'DOMPurify': {
                const {
                    default: DOMPurify
                } = await import(/* webpackIgnore: true */"lib_dompurify");
                c = DOMPurify;
                break;
            }
            case 'adoc': {
                const {
                    default: Asciidoctor
                } = await import(/* webpackIgnore: true */"lib_asciidoctor");
                c = new Asciidoctor();
                break;
            }
            case 'Mermaid': {
                const {
                    default: Mermaid
                } = await import(/* webpackIgnore: true */"lib_mermaid");
                Mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'antiscript',
                    logLevel: 'error'
                });

                c = Mermaid;
                break;
            }
            case 'rst': {
                await import(/* webpackIgnore: true */"lib_rst2html");
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