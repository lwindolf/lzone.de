// vim: set ts=4 sw=4:

import { App } from '../app.js';
import { Config } from '../config.js';
import { ContentView } from "./Content.js";
import { Client } from "../vendor/gradio-client/index.js";
import { Settings } from "../models/Settings.js";

export class ChatView {
    static #models = Config.chatBotModels;
    static #currentModel;       // currently selected chat bot model (or undefined)
    static #gradioClient;       // client initialized to active model (or undefined)
    static #showdown;           // markdown converter instance (or undefined)

    static async connectModel(name) {
        ChatView.#currentModel = name;
        ChatView.#gradioClient = await Client.connect(name);
        document.querySelector('#aiChatView .content').innerHTML += `<p>Connecting chat bot <a href="https://huggingface.co/spaces/${name}">${name}</a></p>`;
    }

    // To be used if non chatbot stuff is to be shown
    static addToolResult(title, str) {
        if(!str)
            return;

        const chat = ContentView.switch('chat');
        const output = chat.querySelector('.content');
        const div = document.createElement('div');
        const answer = document.createElement('div');
        const pre = document.createElement('pre');

        div.innerHTML = `<p>${title}</p>`;
        answer.classList.add('answer');
        pre.innerText += str;
        answer.appendChild(pre)
        div.appendChild(answer);
        output.appendChild(div);
        output.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    static addHTMLResult(title, html) {
        const chat = ContentView.switch('chat');
        const output = chat.querySelector('.content');
        const div = document.createElement('div');

        div.innerHTML = `<p>${title}</p>${html}`;
        output.appendChild(div);
        output.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    static async submitAIPrompt(prompt) {
        if(0 == prompt.length)
            return;

        const chat = ContentView.switch('chat');

        // Scroll down chat view first
        const output = chat.querySelector('.content');

        if(!ChatView.#gradioClient) {
            output.innerHTML += `<div class="loading"><i>Connecting ...</i></div>`;
            await ChatView.connectModel(Object.keys(ChatView.#models)[0]);  // default to first model defined
            output.innerHTML += `<div>Successfully connected model.</div>`;
        }
        output.innerHTML += `
            <div class="question"><p>${prompt}</p></div>
            <div class="loading"><i>Processing ...</i></div>
        `;
        output.scrollIntoView({ behavior: 'smooth', block: 'end' });

        if(!ChatView.#showdown)
            ChatView.#showdown = new showdown.Converter();
        
        // Add prompt to history
        Settings.get('AIPromptHistory', []).then((promptHistory) => {
            promptHistory.push(prompt);
            promptHistory = promptHistory.slice(-15);
            Settings.set('AIPromptHistory', promptHistory);
        });

        // Prepare model specific parameters
        let html;
        try {
            const response = await ChatView.#models[ChatView.#currentModel](ChatView.#gradioClient, prompt);
            if (response.error) {
                html += `<div class="answer">ERROR: Request failed (${response.message})!</div>`;
            } else {
                html = ChatView.#showdown.makeHtml(response.data.join("\n"));
            }
        } catch(e) {
            console.error(e)
            console.error(e.stack)

            html = `ERROR: Markdown parsing error (${e})!`;
        }

        [...chat.querySelectorAll('.loading')].forEach((el) => el.remove());
        output.innerHTML += `<div class="answer">${html?html:"ERROR: Request failed!"}</div>`;
    }
}