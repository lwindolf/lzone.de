// vim: set ts=4 sw=4:

import { Chat } from '../models/Chat.js';
import { ContentView } from "./Content.js";
import { Libraries } from '../libraries.js';
import { Settings } from "../models/Settings.js";

export class ChatView {
    static #showdown;           // markdown converter instance (or undefined)

    constructor(el) {
        el.innerHTML = `Welcome to the chat view!<br>`;

    }

    /*static async connectModel(name) {
        document.querySelector('#aiChatView .content').innerHTML += `
            <p>
                Connecting chat bot <a href="https://huggingface.co/spaces/${name}">${name}</a>
                (<a href="#/-/Settings">Change</a>).
            </p>`;
    }*/

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

    static async submitAIPrompt(prompt) {
        if(0 == prompt.length)
            return;

        const chat = ContentView.switch('chat');

        // Scroll down chat view first
        const output = chat.querySelector('.content');

/*        if(!ChatView.#gradioClient) {
            output.innerHTML += `<div class="loading"><i>Connecting chat bot ...</i></div>`;
            await ChatView.connectModel(await Settings.get('huggingFaceModel'))
            .then(() => output.innerHTML += `<div>Successfully connected model.</div>`)
            .catch((e) => output.innerHTML += `<div class="answer error">ERROR: ${e.message}</div>`);
        }*/
        output.innerHTML += `
            <div class="question"><p>${prompt}</p></div>
            <div class="loading"><i>Processing ...</i></div>
        `;
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