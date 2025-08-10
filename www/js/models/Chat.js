// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { Settings } from "./Settings.js";

/* Running chat bot prompts against either a OpenAI compatible API or a Huggingface space
   using GRadioClient 

   Emits
    - "chat-connecting" when a new connection is being prepared
    - "chat-connected" when the connection is established

   Does not support streaming responses
*/

export class Chat {
    static #currentChatType;    // 'none', 'openai' or 'huggingface' (or undefined)
    static #currentModelName;   // human readable name of the current model (or undefined)
    static #currentModel;       // currently selected chat bot model (or undefined)
    static #gradioClient;       // client initialized to active model (or undefined)
    static #gradio;             // gradio client module (or undefined)
    static #reconnectListener; // listener for reconnecting the model (or undefined)

    // return list of available models for the configure ollama API connection
    static async getOllamaModelList() {
        const models = await fetch(`${await Settings.get('ollamaEndpoint')}/api/tags`, { method: 'GET' })
            .then(response => {
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                const result = response.json();
                return result.models.map(m => m.name);
            });

        Settings.set('ollamaModels', models, true /* send event */);
        return models;
    }

    static async #setup() {
        this.#currentChatType = await Settings.get('chatType', 'none');

        if(this.#currentChatType === 'huggingFace') {
            if(!this.#gradio)
                this.#gradio = await import('../vendor/gradio-client/index.js');

            document.dispatchEvent(new CustomEvent('chat-connecting', { detail: this.#currentChatType }));

            this.#currentModelName = await Settings.get('huggingFaceModel');
            this.#gradioClient = await this.#gradio.Client.connect(this.#currentModelName);

            document.dispatchEvent(new CustomEvent('chat-connected'));

            this.#currentModel = async (prompt) => {
                const response = await Config.chatBotModels[this.#currentModelName](this.#gradioClient, prompt);
                return response.data.join('\n');
            }
        }

        if(this.#currentChatType === 'ollama') {
            // ollama support is stateless so no connecting and no gradio
            this.#currentModelName = await Settings.get('ollamaModel');
            this.#currentModel = async (prompt) => {
                return await fetch(`${await Settings.get('ollamaEndpoint')}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        model  : this.#currentModelName,
                        stream : false
                    })
                }).then(response => {
                    if (!response.ok)
                        throw new Error(`HTTP error! status: ${response.status}`);
                    
                    return response.json();
                }).then(data => {
                    if (data.error)
                        throw new Error(data.error);
                    return data.response;
                });
            }
        }

        if(!this.#reconnectListener)
            this.#reconnectListener = (e) => {
                if((e.detail.name === 'chatType') ||
                   (e.detail.name === 'huggingFaceModel') ||
                   (e.detail.name === 'ollamaModel')) {
                    this.#currentChatType = e.detail.value;
                    this.#currentModelName = undefined;
                    this.#currentModel = undefined;
                    this.#gradioClient = undefined;

                    console.log('ChatView: Switching model.');
                    this.#setup();
                }
            };
            document.addEventListener('settings-changed', this.#reconnectListener);
    }

    static async submit(prompt) {
        if(!this.#currentChatType)
            await this.#setup();

        if(this.#currentChatType === 'none')
            return "ERROR: LLM chat bot is currently disabled in <a href='#/-/Settings'>Settings</a>. Please enable it to allow LLM prompts.";

        return await this.#currentModel(prompt);
    }

    static getLLMName() {
        if(!this.#currentModelName)
            return '';

        return `${this.#currentChatType}: ${this.#currentModelName}`;
    }
}