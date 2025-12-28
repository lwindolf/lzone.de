// vim: set ts=4 sw=4:

// Create a modal dialog lightbox
//
// - Supports only one dialog at a time
// - Triggers callback on input[type="submit"]
//   returning map of all input field values
//   closing the dialog when callback returns
//   true
// - Allows updating the dialog with new values

import { template } from '../helpers/render.js';

export class ModalDialog {
    #modal;
    #modalContent;
    #callback;
    #template;

    // listener function
    #onclickFunc;
    #onsubmitFunc;
    #onkeydownFunc;

    // Build a modal dialog from a Handlebars template
    constructor(templateStr, data, callback) {
        this.#modal = document.getElementById('modal');
        this.#modalContent = document.getElementById('modalContent');
        this.#template = template(templateStr);
        this.#callback = callback;

        this.#modal.style.display = 'block';
        this.#modalContent.innerHTML = this.#template(data);

        this.#modal.addEventListener('click', this.#onclickFunc = (e) => {
            if(e.target.id === 'modal') {
                this.destroy();
                e.preventDefault();
            }
        });
        this.#modal.addEventListener('submit', this.#onsubmitFunc = (e) => {
            this.#onsubmit();
            e.preventDefault();
        });
        document.addEventListener('keydown', this.#onkeydownFunc = (e) => {
            if(e.code === "Escape") {
            this.destroy();
            e.preventDefault();
            }
        });
    }

    #onsubmit() {
        var inputData = {};

        [...this.#modalContent.querySelectorAll('input, select, textarea')]
            .forEach((e) => (inputData[e.name] = e.value));

        this.#callback(inputData).then((done) => {
            if(done)
                this.destroy();
        });
    }

    // Update the dialog with new data, along with a conditional 
    // template this allows changing the dialog and supplying new 
    // data & fields.
    update(data) {
        this.#modalContent.innerHTML = this.#template(data);
    }

    // "destructor"
    destroy() {
        this.#modal.style.display = 'none';
        this.#modalContent.innerHTML = '';
        this.#modal.removeEventListener('click', this.#onclickFunc);
        this.#modal.removeEventListener('submit', this.#onsubmitFunc);
        this.#modal.removeEventListener('keydown', this.#onkeydownFunc);
    }
}