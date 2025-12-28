// vim: set ts=4 sw=4:

import { Libraries } from "../libraries.js";

// This view embeds the feed reader component as a vertical Split.js view

export class FeedReaderView {
    constructor() {
        if (document.getElementById('itemlist'))
            return;

        window.app.FeedReader.render(document.querySelector('#feedreader'));

        Libraries.get('Split').then(Split => {
            Split(['#itemlist', '#itemview'], {
                sizes: [30, 70],
                minSize: [100, 100],
                gutterSize: 3,
                expandToMin: true,
                direction: 'vertical'
            });
        });
    }
}