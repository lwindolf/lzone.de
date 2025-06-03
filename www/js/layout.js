// Simple dynamic 3-pane layout for the web app using split.js
// Width based hiding of the right pane

import Split from './vendor/split.es.js';

export class Layout {
        // state
        #split;

        constructor() {
                this.#split = Split(['#sidebar', '#main', '#toolpanel'], {
                        sizes: [0, 70, 30],
                        minSize: [300, 300, 0],
                        maxSize: [300, Infinity, Infinity],
                        gutterSize: 1,
                        expandToMin: true,
                        direction: 'horizontal',
                });

                window.addEventListener('resize', () => this.#update());
                this.#update();
        }

        #update() {
                // Note: there are additional media queries in the CSS to handle
                // visibility of the #toolpanelHome and #home-content elements
                // that need to match the thresholds here
                if(window.innerWidth > 1200) {
                        this.#split.setSizes([5, 70, 25]);
                        document.getElementById('toolpanel').style.display = 'block';
                        document.getElementById('sidebar').style.display = 'block';
                } else if(window.innerWidth > 640) {
                        this.#split.setSizes([5, 95, 0]);
                        this.#split.collapse(2); // collapse tool panel
                        document.getElementById('toolpanel').style.display = 'none';
                        document.getElementById('sidebar').style.display = 'block';
                } else {
                        this.#split.setSizes([0, 100, 0]);
                        this.#split.collapse(1); // collapse sidebar
                        this.#split.collapse(2); // collapse tool panel
                        document.getElementById('toolpanel').style.display = 'none';
                        document.getElementById('sidebar').style.display = 'none';
                }
        }
}