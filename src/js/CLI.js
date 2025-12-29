// vim: set ts=4 sw=4:

import { Commands } from "./commands.js";
import { ContentView } from "./views/Content.js";
import { ChatView } from "./views/Chat.js";
import { Search } from "./search.js";

// A CLI prompt for multiple types of command (AI, commands, search)
//
// Instantiate only once!
export class CLI {
    constructor(id) {
        const input = document.getElementById(id);
        input.focus();
        input.addEventListener('keydown', async (event) => {           
            if (event.key === 'Enter' || event.keyCode === 13) {
                window.location.hash = '/-/CLI';

                // Decide what the user want
                //
                // 1. Check if user wants to run a command (prefix "!")
                // 2. Check if user wants an AI prompt (prefix "?")
                // 3. Perform a normal search
                if (input.value[0] == '!') {
                    const str = input.value.slice(1);
                    CLI.#runCommand(str);

                } else if (input.value[0] == '?') {
                    const str = input.value.slice(1);
                    ChatView.submitPrompt(str);

                } else {
                    Search.selectResult();
                }

                // Reset prompt field
                input.value = "";
                event.preventDefault();
            } else if (event.key === 'Escape' || event.keyCode === 27) {
                // Close search results and show content again
                ContentView.hideSearch();
            } else {
                if ((input.value.length > 1) &&
                    (input.value[0] != '!') &&
                    (input.value[0] != '?')) {
                    // type ahead find switch to search content view
                    ContentView.showSearch();
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
    }

    static #focusSearch = () => document.getElementById('search-input').focus();

    static #runCommand = async (str) => {
        const [type, output] = await Commands.run(str)
        ChatView.addToolResult(str, output, type);
    }
}