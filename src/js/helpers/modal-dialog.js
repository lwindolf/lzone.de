// vim: set ts=4 sw=4:

// Simple modal dialog with automatic rendering and form handling
//
// - Triggers callback on input[type="submit"] returning map of
//   all input field values for processing by the optional callback
// - Dialog is closed when there is no callback or callback returns true
// - Allows updating the dialog with new values

import { template } from '../helpers/render.js';

export class ModalDialog {
    // state
    #data;

    // Show a modal dialog from a Handlebars template
    constructor(templateStr, data, callback) {
        this.#data = data;

        const dialog = document.getElementById('modal');
        const tmpl = template(templateStr);

        dialog.innerHTML = tmpl(this.#data);
        dialog.showModal();
        dialog.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                /* Collect form data as new data */
                this.#data = {};

                [...dialog.querySelectorAll('input, select, textarea')]
                    .forEach((e) => (this.#data[e.name] = e.value));

                callback(this.#data, e.target).then((done) => {
                    if(done)
                        dialog.close();

                    // Re-render the dialog with updated data
                    dialog.innerHTML = tmpl(this.#data);
                });
                e.preventDefault();
            });
        });

        dialog.addEventListener('keydown', (e) => {
            if(e.code === "Escape") {
                dialog.close();
                e.preventDefault();
            }
        });
    }

    setData(data) {
        this.#data = data;
    }
}