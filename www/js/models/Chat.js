// vim: set ts=4 sw=4:

import { Settings } from "./Settings.js";

/* Running chat bot prompts against either a ollama API or the Huggingface 
   chat completions API.

   Does not support streaming responses
*/

export class Chat {
    static #currentChatType;    // 'none', 'openai' or 'huggingface' (or undefined)
    static #currentModelName;   // human readable name of the current model (or undefined)
    static #currentModel;       // currently selected chat bot model (or undefined)
    static #reconnectListener;  // listener for reconnecting the model (or undefined)

    // update list of available ollama models
    static async updateOllamaModelList() {
        const result = await fetch(`${await Settings.get('ollamaEndpoint')}/api/tags`, { method: 'GET' })
            .then(response => {
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            });

        await Settings.set('ollamaModels', result.models.map(m => m.name), true /* send event */);
    }

    static async #setup() {
        this.#currentChatType = await Settings.get('chatType', 'none');

        if(this.#currentChatType === 'huggingFace') {
            this.#currentModelName = await Settings.get('huggingFaceModel');
            this.#currentModel = async (prompt) => {
                return await this.#hfQuery({ 
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    model: this.#currentModelName,
                }).then((response) => {
                    return response.choices[0].message.content;
                });
            }
        }

        if(this.#currentChatType === 'ollama') {
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

        if(!this.#reconnectListener) {
            this.#reconnectListener = (e) => {
                if((e.detail.name === 'chatType') ||
                   (e.detail.name === 'huggingFaceModel') ||
                   (e.detail.name === 'ollamaModel')) {
                    this.#currentChatType = e.detail.value;
                    this.#currentModelName = undefined;
                    this.#currentModel = undefined;

                    console.log('ChatView: Switching model.');
                    this.#setup();
                }
            };
            document.addEventListener('settings-changed', this.#reconnectListener);
        }
    }

    static async #hfQuery(data) {      
        let headers = {
            "Content-Type": "application/json",
        };

        // Optional auth
        const hf_token = await Settings.get('huggingFaceToken');
        if(hf_token && hf_token.length > 0)
            headers.Authorization = `Bearer ${hf_token}`;

        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                headers,
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        return result;
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