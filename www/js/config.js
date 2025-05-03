// vim: set ts=4 sw=4:

// app customization

export class Config {
    // trailing slash is important!
    static baseUrl = 'https://lzone.de/';

    // URLs with content indizes to add to the app
    //
    // These are basically Github repos with 
    // - an optional catalog JSON of other installable repos
    // - repo local markdown files (actual content)
    //
    // Each entry is added to the sidebar with the key as the display name
    // A search index is automatically created or a provided one is used
    //
    // Allowed fields:
    // - `removable`(optional, default: true) if the group can be deactivated
    // - `install` (optional) Github repo definition to install, repo content will be automatically added to the sidebar
    // - `catalog` (optional) URL to a JSON file with additional repos that can be installed by the user
    static indexUrls = {
        'Lars Windolf': {
            install : {
                'Blogs': {
                    github: 'lwindolf/blogs',
                }
            }
        },
        'Cheat Sheets': {
            removable : false,
            install : {
                'LZone Cheat Sheets': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Cheat Sheets/(.*)\\.md$'
                },
                'LZone Examples': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Examples/(.*)\\.md$'
                },
                'Video Tutorials': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Video Tutorials/(.*)\\.md$'
                },
                'Visual Ops': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Visual Ops/(.*)\\.md$'
                }
            },
            catalog : 'https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/extra-cheat-sheets.json'
        }
    };

    // Huggingface spaces for chat bot models
    // Note: first definition is always or default model
    static chatBotModels = {
        "Be-Bo/llama-3-chatbot_70b": async (client, prompt) => await client.predict("/chat", { message: prompt }),
        "Qwen/Qwen1.5-110B-Chat-demo": async (client, prompt) => await client.predict("/model_chat", [
            prompt,
            [],
            "You are a helpful assistant."
        ]),
        "huggingface-projects/gemma-2-9b-it": async (client, prompt) => await client.predict("/chat", {
            message: prompt,
            max_new_tokens: 1024,
            temperature: 0.6,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.2,
        }),
        "eswardivi/Phi-3-mini-128k-instruct": async (client, prompt) => await client.predict("/chat", [
            prompt,
            0.6,        // temperature
            true,       // sampling
            1024        // max token  
        ])
    };

    // welcome text
    static welcome = `
        <p>
            LZone is a progressive web app by <a href="/consulting/en">Lars Windolf</a> that supports
            installing a ton of Sysadmin / DevOps / System Architecture related content
            so that you can search and read all of it in one place.
        </p>`;
}