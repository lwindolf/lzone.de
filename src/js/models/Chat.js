// vim: set ts=4 sw=4:

import { Settings } from "./Settings.js";

/* Running chat bot prompts against either a ollama API or the Huggingface 
   chat completions API.

   Does not support streaming responses
*/

export class Chat {
    static #providers = {
        'none': async () => {
            return {
                model: 'none',
                result: "ERROR: LLM chat bot is currently disabled in <a href='#/-/Settings'>Settings</a>. Please enable it to allow LLM prompts."
            };
        },
        'huggingFace': async (prompt) => {
            const model = await Settings.get('huggingFaceModel');
            if (!model)
                return {
                    model: 'HuggingFace ???',
                    result: 'ERROR: No model selected.'
                };

            return {
                model: 'HuggingFace ' + model,
                result: await this.#hfQuery({
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    model
                }).then((response) => {
                    if (response.error)
                        throw new Error(response.error.message);
                    if(!response.choices || response.choices.length === 0)
                        throw new Error('No response from LLM model.');
                    return response.choices[0].message.content;
                }).catch((error) => {
                    return 'ERROR: ' + error.message;
                })
            };
        },
        'ollama': async (prompt) => {
            const model = await Settings.get('ollamaModel');
            if (!model)
                return {
                    model: 'Ollama ???',
                    result: 'ERROR: No model selected.'
                };

            return {
                model: 'Ollama ' + model,
                result: await fetch(`${await Settings.get('ollamaEndpoint')}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        model,
                        stream: false
                    })
                }).then(response => {
                    if (!response.ok)
                        throw new Error(`HTTP error! status: ${response.status}`);

                    return response.json();
                }).then(data => {
                    if (data.error)
                        throw new Error(data.error);
                    return data.response;
                }).catch((error) => {
                    return 'ERROR: ' + error.message;
                })
            };
        }
    }

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
        return await response.json();
    }

    // Returns { model: 'model-name', result: 'text' }
    static async submit(prompt) {
        const provider = await Settings.get('chatType', 'none');

        if(!provider || !this.#providers[provider])
            return {
                model: 'unknown',
                result: `ERROR: Unknown chat provider: ${provider}`
            };

        return await this.#providers[provider](prompt);
    }
}