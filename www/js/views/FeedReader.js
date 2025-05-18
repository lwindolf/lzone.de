// vim: set ts=4 sw=4:

import { App } from '../app.js';
import Split from '../vendor/split.es.js';
import * as ev from '../helpers/events.js';

export class FeedReaderView {
        constructor(el) {
                el.innerHTML = `
                <div class="feedViewSplit">
                        <div id="itemlist">
                                <div id="itemlistViewContent"></div>
                        </div>
                        <div id="itemView">
                                <div id="itemViewContent"></div>
                        </div>
                </div>`;
                Split(['#itemlist', '#itemView'], {
                        sizes: [30, 70],
                        minSize: [100, 100],
                        gutterSize: 3,
                        expandToMin: true,
                        direction: 'vertical'
                });
                const feedViewSplit = el.querySelector('.feedViewSplit');
                feedViewSplit.style.height = '100%';
                ev.dispatch('feedSelected', { id: App.getPath().split('/')[1] });
        }
}