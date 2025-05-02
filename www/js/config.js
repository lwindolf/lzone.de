// vim: set ts=4 sw=4:

// app customization

export class Config {
    // URL to the master list of cheat sheets
    cheatSheetIndexUrl = 'https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/search-index.json';

    // Huggingface spaces for chat bot models
    // Note: first definition is always or default model
    chatBotModels = {
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
    welcome = `
        <p>
            LZone is a progressive web app by <a href="/#/lwindolf">Lars Windolf</a> that supports
            installing a ton of Sysadmin / DevOps / System Architecture related content
            so that you can search and read all of it in one place.
        </p>`;


    // about page text
    about = `
        <h1>Lars Windolf</h1>

        <p>
            Hi! I'm a <a href="/consulting/en">freelancer</a> working as a tech lead supporting
            DevOps teams in system architecture, agile methods and IT operations. I do strongly care about collecting and sharing 
            knowledge and I use this web app as a customizable content portal swiss army knife for the knowledge
            needed in my daily work.
        </p>

        <h2>Projects</h2>

        <ul>
            <li><a href="/liferea">Liferea</a> (<a href="https://github.com/lwindolf/liferea">Github</a>) - 20+ years old RSS feed reader for Linux</li>
            <li><a href="/multi-status">Multi-Status</a> (<a href="https://github.com/lwindolf/multi-status">Github</a>) - SaaS status aggregator</li>
            <li><a href="/#/wurmterm">WurmTerm</a> (<a href="https://github.com/lwindolf/wurmterm-backend">Github</a>) - DevOps problem discovery agent</li>
            <li>Cheat Sheet Collection (<a href="https://github.com/lwindolf/lzone-cheat-sheets">Github</a>)</li>
            <li>Cloud Outage Index (<a href="https://github.com/lwindolf/cloud-outages">Github</a>)</li>
        </ul>

        <h2>Profiles</h2>

        <ul>
            <li><a href="https://github.com/lwindolf">Github</a></li>
            <li><a href="/blog/">Blog</a></li>
            <li><a rel="me" href="https://mas.to/@lwindolf">Mastodon</a></li>
        </ul>
        `;
}