// vim: set ts=4 sw=4:


// This view embeds the feed reader component as a vertical Split.js view

export class FeedReaderView {
    constructor() {
        // FeedReader is reacting to location changes itself and renders the 
        // appropriate content, we just trigger an update() for the initial
        // location
        window.app.FeedReader.render();
    }
}