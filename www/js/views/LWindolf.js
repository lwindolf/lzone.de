// vim: set ts=4 sw=4:

// A simple static info view hinting on blog and projects

export class LWindolfView {
    constructor(id) {
        document.getElementById(id).innerHTML = `
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
}