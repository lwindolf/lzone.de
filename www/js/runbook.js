// vim: set ts=4 sw=4:

import { WurmTermBackend } from "./components/wurmterm/js/WurmTermBackend.js";
import { Settings } from "./settings.js";
import { template, renderElement } from "./helpers/render.js";

// Change the current displayed document content into a WurmTerm runbook
//
// - make all <code> blocks editable
// - add play buttons
// - add result box when running commands

class Runbook {
    static #host;               // host selected for running commands
    static #timeout;            // connect timeout until we show a help on how to set up the backend agent
    static #timeoutFlag;        // true if timeout did trigger

    static #btnListener;
    static #statusListener;
    static #probeListener;
    static #runListener;

    static #template = template(`
        <div class='wurmTermConnect'>
            <div>
                {{#if host}}
                    <span class='host'><span class='name'>{{host}}</span></span>
                {{/if}}
                🐛 <b>WurmTerm</b> 
                <span class='status'>{{status.msg}}</span>
            </div>

            <div class='hint'>
                {{#if timeoutFlag}}
                    <p>
                        ⚠️ Runbook mode requires an <a href="https://github.com/lwindolf/wurmterm-backend">agent</a> 
                        on your computer. The agent does not seem to be running.
                    </p>           
                    <p>
                        If you have not installed it yet: Carefully consider the 
                        security implications of using WurmTerm and if you are willing
                        to take the risk!
                    </p>
                    <p>
                        If yes: install this agent with
                    </p>
                    <pre>sudo npm i -g wurmterm-backend</pre>
                    <p>And start it with</p>
                    <pre>wurm start</pre>
                {{/if}}

                {{#if status.authFailure}}
                    <p>
                        <div class='wurmTermAuth'>
                            Passwort: <input type='password' name='password'/>
                            <button id="runbookPasswordSet">Login</button>
                        </div>
                    </p>
                    <p>
                        In case you have forgotten your password set a new one by running
                        <code>wurm configure</code>
                    </p>
                {{/if}}
            </div>
        </div>
    `);

    static enable(view, host) {
        const selector = 'div.language-plaintext';  // match only showdown.js code blocks

        this.#host = host?host:'localhost';

        // make all <code> editable and add play button
        view.querySelectorAll(`${selector} pre`).forEach((el, i) => {
            el.contentEditable = true;
            el.parentElement.innerHTML = `
                <div class='play' data-nr='${i}'>
                    <button class='play'>▶</button>
                    ${el.parentElement.innerHTML}
                </div>`;
        });

        // Create connect bar
        view.insertAdjacentHTML('afterbegin', "<div id='wurmTermConnect'></div>");

        document.addEventListener('WurmTermBackendStatus', this.#statusListener = (e) => {
            const status = e.detail;

            if(status.connected && Runbook.#timeout) {
                clearTimeout(Runbook.#timeout);
                Runbook.#timeout = undefined;
                Runbook.#timeoutFlag = false;
            }    

            renderElement(view.querySelector('#wurmTermConnect'), this.#template, {
                host,
                status,
                timeoutFlag: this.#timeoutFlag
            })
        });
        document.addEventListener('WurmTermBackendRunResult', this.#runListener = (e) => {
            this.#runResult(view, e);
        });
        
        view.addEventListener('click', this.#btnListener = (e) => {
            // FIXME check for parent id
            if(e.target.nodeName === 'BUTTON' && e.target.classList.contains('play')) {            
                Runbook.run(e);
            } else if(e.target.id === 'runbookPasswordSet') {
                Settings.set("WurmTermBackendPassword", document.querySelector('div.wurmTermAuth input[type="password"]').value);
                WurmTermBackend.reconnect();   
            }
        });

        // Connect if needed
        if(!WurmTermBackend.isReady()) {
            if(Runbook.#timeout)
                clearTimeout(Runbook.#timeout);

            Runbook.#timeout = setTimeout(() => { Runbook.#timeoutFlag = true; }, 5000);  

            WurmTermBackend.connect();
        } else {
            renderElement(view.querySelector('#wurmTermConnect'), this.#template, {
                host,
                status: WurmTermBackend.getStatus(),
                timeoutFlag: this.#timeoutFlag
            })
        }
    }

    // run commands from a <code> tag
    static run(e) {
        let el = e.target.parentElement;
        let cmd = e.target.parentElement.querySelector('code').innerText;

        if(!WurmTermBackend.isReady()) {
            alert("WurmTerm backend is not connected. Maybe the 'wurm' agent is not running? Start it with 'wurm start'.");
            return;
        }

        // Add output box
        let outputBox = el.querySelector('.output pre');
        if(outputBox)
            outputBox.innerText = "";
        else
            el.insertAdjacentHTML("beforeend", `
                <div class='output'>
                    <pre></pre>
                </div>
            `);
        
        WurmTermBackend.run(Runbook.#host, el.dataset.nr, cmd);
    }

    static #runResult(view, e) {
        let el = view.querySelector(`.play[data-nr="${e.detail.id}"] .output pre`);
        const escapeHTML = (str) => {
            const p = document.createElement("p");
            p.appendChild(document.createTextNode(str));
            return p.innerHTML;
        }
        el.innerHTML = escapeHTML(e.detail.stdout) + '\n<span style="color:red">' + escapeHTML(e.detail.stderr) + "</span>";
    }
}

export { Runbook };