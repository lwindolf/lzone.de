// vim: set ts=4 sw=4:

import { Config } from "../config.js";

export class SettingsView {
    constructor(el, path) {
        const name = path.split('/').pop();

        // render settings for tool web components
        if (path.startsWith('-/Settings/Tools/')) {
            import(Config.toolboxComponents[name].import).then(() => {
                el.innerHTML = `<h1>Settings - ${name}</h1> ${Config.toolboxComponents[name].settings}`;
            });
        } else {
            el.innerHTML = "ERROR: Unknown settings path";
        }
    }
}