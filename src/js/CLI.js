// vim: set ts=4 sw=4:

import { Commands } from "./commands.js";
import { ContentView } from "./views/Content.js";
import { ChatView } from "./views/Chat.js";
import { Search } from "./search.js";

// A CLI prompt for multiple types of command (AI, commands, search)
//
// Instantiate only once!
export class CLI {
    // state
    #input;
    #modeLabel;

    setMode(mode) {
        const hints = {
            "Cmd": "",
            "Chat": "AI prompt",
            "Search": "Type ahead find"
        }
        this.#modeLabel.textContent = mode;
        this.#modeLabel.dataset.mode = mode;
        this.#input.placeholder = "";
    }

    getMode() {
        return this.#modeLabel.dataset.mode;
    }

    constructor(id) {
        this.#modeLabel = document.querySelector('.search-input-wrap .mode');
        this.#input = document.getElementById(id);
        this.#input.focus();
        this.#input.addEventListener('input', async (event) => {
            // Handle leading ? and ! to switch mode
            if (this.#input.value[0] == '!') {
                this.setMode("Cmd");
                this.#input.value = this.#input.value.slice(1);
                return;
            } else if (this.#input.value[0] == '?') {
                this.setMode("Chat");
                this.#input.value = this.#input.value.slice(1);
                return;
            }
        });

        this.#input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) {
                window.location.hash = '/-/CLI';

                if (this.getMode() === "Cmd") {
                    CLI.#runCommand(this.#input.value);

                } else if (this.getMode() === "Chat") {
                    ChatView.submitPrompt(this.#input.value);

                } else {
                    Search.selectResult();
                }

                // Reset prompt field
                this.#input.value = "";
                event.preventDefault();
                return;
            } else if (event.key === 'Escape' || event.keyCode === 27) {
                if(this.#input.value.length > 0) {
                    // Close search results and show content again
                    ContentView.hideSearch();
                } else {
                    this.setMode("Search");
                }
                event.preventDefault();
                return;
            } else {
                if ((this.#input.value.length > 1) &&
                    (this.getMode() === "Search")) {
                    // type ahead find switch to search content view
                    ContentView.showSearch();
                    return;
                }
            }
        });

        document.addEventListener('keydown', function (e) {
            /* Ctrl - K */
            if (e.ctrlKey && e.keyCode === 75) {
                CLI.#focusSearch()
                e.preventDefault();
            }
        });

        this.setMode("Search");
    }

    static #focusSearch = () => document.getElementById('search-input').focus();

    static #runCommand = async (str) => {
        const [type, output] = await Commands.run(str)
        ChatView.addToolResult(str, output, type);
    }
}