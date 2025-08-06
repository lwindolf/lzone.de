import "fake-indexeddb/auto";

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