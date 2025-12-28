export class OPFSFileBrowserView {
        constructor(el) {
                this.container = el;
                this.currentPath = '/';
                this.init();
        }

        init() {
                this.render();
                this.bindEvents();
        }

        render() {
                this.container.innerHTML = `
                                <div class="file-browser">
                                                <div class="panel"></div>
                                </div>
                `;

                const style = document.createElement('style');
                style.textContent = `
                                .file-browser {
                                                display: flex;
                                                height: 100%;
                                                background-color: #1e1e1e;
                                                color: #c5c5c5;
                                                font-family: monospace;
                                }
                                .panel {
                                                flex: 1;
                                                border: 1px solid #3c3c3c;
                                                margin: 5px;
                                                overflow-y: auto;
                                                background-color: #2e2e2e;
                                }
                                .file-item {
                                                padding: 5px 10px;
                                                cursor: pointer;
                                                display: flex;
                                }
                                .file-item:hover {
                                                background-color: #3c3c3c;
                                }
                                .file-item[data-type="directory"] {
                                                font-weight: bold;
                                                color: #6ca6cd;
                                }
                                .file-item[data-type="file"] {
                                                color: #c5c5c5;
                                }
                `;
                document.head.appendChild(style);
                this.renderPanel(this.currentPath, '.panel');
        }

        async renderPanel(directory, panelClass) {
                const panel = this.container.querySelector(panelClass);
                const root = await navigator.storage.getDirectory();
                let result = '';
                for await (const [name, entry] of root.entries()) {
                        console.log(`Entry: ${name}`, entry);
                        result += `
                        <div class="file-item" data-path="${entry.name}" data-type="${entry.type || 'file'}">
                                <span style="flex: 1">${entry.kind === 'directory' ? '📁' : '📄'} ${entry.name}</span>
                        </div>`;
                }
                panel.innerHTML = result;
        }

        bindEvents() {
                this.container.addEventListener('click', (event) => {
                        const item = event.target.closest('.file-item');
                        if (item) {
                                const filePath = item.getAttribute('data-path');
                                const fileType = item.getAttribute('data-type');
                                if (fileType === 'directory') {
                                        this.currentPath = filePath;
                                        this.render();
                                }
                        }
                });
        }
}