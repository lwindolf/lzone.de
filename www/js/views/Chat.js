// vim: set ts=4 sw=4:

import { Chat } from '../models/Chat.js';
import { ContentView } from "./Content.js";
import { Libraries } from '../libraries.js';
import { Settings } from "../models/Settings.js";
import * as r from "../helpers/render.js";

// Chat view append only adding prompts and responses as well as
// commands and their results.

export class ChatView {
    static #showdown;           // markdown converter instance (or undefined)

    // To be used if non chatbot stuff is to be shown
    //
    // cmd: the command that was run
    // str: the result of the command (either text or HTML)
    // type: 'text' or 'html' (default: 'text')
    static addToolResult(cmd, str, type = 'text') {
        if(!cmd || !str)
            return;

        const chat = ContentView.switch('chat');
        const output = chat.querySelector('.content');
        const pre = document.createElement('pre');

        pre.classList.add('cli');
        pre.innerText += '$ ' + cmd;
        if (type === 'text')
            pre.innerText += '\n' + str;
        output.appendChild(pre);

        if (type === 'html') {
            const div = document.createElement('div');
            div.innerHTML = str;
            output.appendChild(div);
        }

        output.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Submit an LLM prompt
    static async submitPrompt(prompt) {
        if(0 == prompt.length)
            return;

        const chat = ContentView.switch('chat');
        const output = chat.querySelector('.content');

        output.innerHTML += r.renderToString(`
            <div class="question"><p>{{prompt}}</p></div>
            <div class="loading"><i>Processing ...</i></div>
        `, { prompt });
        output.scrollIntoView({ behavior: 'smooth', block: 'end' });

        if(!ChatView.#showdown)
            ChatView.#showdown = await Libraries.get('md');
        
        // Add prompt to history
        Settings.get('AIPromptHistory', []).then((promptHistory) => {
            promptHistory.push(prompt);
            promptHistory = promptHistory.slice(-15);
            Settings.set('AIPromptHistory', promptHistory);
        });

        let html;
        let response;
        try {
            response = await Chat.submit(prompt);
        } catch(e) {
            html = `<div class="answer">ERROR: Request failed (${encodeURI(e)})!</div>`;
        }

        try {
            html = ChatView.#showdown.makeHtml(response);
        } catch(e) {
            html = `ERROR: Markdown parsing error (${encodeURIComponent(e)})!`;
        }

        [...chat.querySelectorAll('.loading')].forEach((el) => el.remove());
        output.innerHTML += `<div class="answer"><div class="llm">${Chat.getLLMName()}</div>${html?html:"ERROR: Request failed!"}</div>`;
        output.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}