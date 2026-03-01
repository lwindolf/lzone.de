import "fake-indexeddb/auto";
import '../src/js/config.js';
import '../src/js/helpers/log.js';
import { Settings } from '../src/js/models/Settings.js';

// JSDOM is missing structured clone used for IndexedDB store (https://stackoverflow.com/questions/73607410/referenceerror-structuredclone-is-not-defined-using-jest-with-nodejs-typesc)
global.structuredClone = v => JSON.parse(JSON.stringify(v));

// FIXME: load index.html instead!
document.body.innerHTML = `
<div id='main'>
<div class='view' id='itemlist'>
        <header id='itemlistViewTitle'></header>
        <div class='feedInfoError'></div>
        <div id='itemlistViewContent'></div>
</div>
<div class='view' id='item'>
        <header id='itemViewTitle'></header>
        <div id='itemViewContent'></div>
</div>
<div id='linkHover'></div>
</div>`;

window.HTMLElement.prototype.scrollIntoView = jest.fn()

Settings.get = jest.fn((key) => {
        if (key === 'feedreader:::refreshInterval') return 1;
        if (key === 'feedreader:::refreshIntervalUnit') return 'days';
        return undefined;
})

// For debugging use
//
// window.Config.debug.all = true;
// window.Config.debug.feed = true;
// window.Config.debug.feedlist = true;
// ...
