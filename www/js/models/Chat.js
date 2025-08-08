// vim: set ts=4 sw=4:

import { Config } from '../config.js';
import { Settings } from "./Settings";

/* Running chat bot prompts against either a OpenAI compatible API or a Huggingface space
   using GRadioClient 

   Emits
    - "chat-connecting" when a new connection is being prepared
    - "chat-connected" when the connection is established
    - "chat-response" on answer

   Does not support streaming responses
*/

export class Chat {
    static #currentChatType;    // 'none', 'openai' or 'huggingface' (or undefined)
    static #currentModel;       // currently selected chat bot model (or undefined)
    static #currentModelName;   // currently selected chat bot model name (or undefined)
    static #gradioClient;       // client initialized to active model (or undefined)
    static #gradio;             // gradio client module (or undefined)

    static async #connect() {
        if(!this.#gradio)
            this.#gradio = await import('../vendor/gradio-client/index.js');

        const chatType = Settings.get('chatBotType');
        const huggingFaceModel = Settings.get('huggingFaceModel');

        if (this.#gradioClient &&
            this.#currentModel &&
            this.#currentChatType === chatType &&
            this.#currentModelName === huggingFaceModel)
            return;

        document.dispatchEvent(new CustomEvent('chat-connecting', { detail: chatType }));

        this.#currentChatType = chatType;

        if (chatType === 'huggingface') {
            this.#currentModelName = huggingFaceModel;
            this.#currentModel = Config.chatBotModels[huggingFaceModel];
            this.#gradioClient = await this.#gradio.Client.connect(huggingFaceModel);
        }
        if (chatType === 'openai') {
            this.#gradioClient = await this.#gradio.Client.connect(Settings.get('openaiHost'));
            this.#currentModel = async (client, prompt) => await client.predict("/chat", {
                model: Settings.get('openaiModel'),
                messages: [{ role: 'user', content: prompt }],
                max_tokens: Settings.get('openaiMaxTokens'),
                temperature: Settings.get('openaiTemperature'),
                top_p: Settings.get('openaiTopP'),
                top_k: Settings.get('openaiTopK'),
                repetition_penalty: Settings.get('openaiRepetitionPenalty'),
            });
            this.#currentModelName = undefined;
        }
        if (chatType === 'none') {
            this.#currentModel = undefined;
            this.#currentModelName = undefined;
            this.#gradioClient = undefined;
        }
    }

    static async submit(prompt) {
        this.#connect();

        if (this.#currentChatType === 'none')
            throw new Error("Chat is disabled in Settings. Please enable it to use this feature.");

        const response = await this.#currentModel(this.#gradioClient, prompt);
        document.dispatchEvent(new CustomEvent('chat-response', { detail: response }));
    }
}