// vim: set ts=4 sw=4:

import { Config } from '../config.js';

// A simple static info view hinting on blog and projects

export class LWindolfView {
    constructor(id) {
        document.getElementById(id).innerHTML = Config.about;
    }
}