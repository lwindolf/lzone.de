// vim: set ts=4 sw=4:

import Split from '../vendor/split.es.js';

// This view embeds the feed reader component as a vertical Split.js view

export class FeedReaderView {
    constructor(el) {
        if (el.querySelector('#itemlistViewContent'))
            return;

        // FIXME: move non split HTML into feedreader class
        el.innerHTML = `
            <div class="feedViewSplit">
                <div id="itemlist" tabindex="1">
                    <div id="itemlistViewContent"></div>
                </div>
                <div id="itemview" tabindex="2">
                    <div id="itemViewContent"></div>
                </div>
            </div>`;

        Split(['#itemlist', '#itemview'], {
            sizes: [30, 70],
            minSize: [100, 100],
            gutterSize: 3,
            expandToMin: true,
            direction: 'vertical'
        });
        const feedViewSplit = el.querySelector('.feedViewSplit');
        feedViewSplit.style.height = '100%';

        window.app.FeedReader.update();
    }
}