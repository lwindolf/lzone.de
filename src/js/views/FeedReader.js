// vim: set ts=4 sw=4:

// This view embeds the feed reader component

export class FeedReaderView {
    static #initialized = false;

    constructor() {
        // The static FeedReader class is reacting to location changes itself 
        // and renders the appropriate content automatically, we just to 
        // initialize it one the first instantiation of this view
        if(!FeedReaderView.#initialized)
            window.app.FeedReader.setup(document.getElementById('feedreader'));

        FeedReaderView.#initialized = true;
    }
}