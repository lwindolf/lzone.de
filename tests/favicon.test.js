// vim: set ts=4 sw=4:

import { Favicon } from "../www/js/feedreader/parsers/favicon";

let responses = {
    "https://arstechnica.com/test1": `<!DOCTYPE html>
    <html lang="en-us">
    
    <head>
        <title>Ars Technica</title>
        <link rel="shortcut icon" href="https://cdn.arstechnica.net/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-ios-icon-d9a45f558c.png" />
        <link rel="mask-icon" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-macos-safari-8997f76b21.svg" color="#ff4e00">
        <link rel="icon" sizes="192x192" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png" />
    </head>
    <body>
        <p>content</p>
    </body>
    </html>`,

    "https://arstechnica.com/test2": `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    
    <head>
        <title>Ars Technica</title>
        <link rel="shortcut icon" href="https://cdn.arstechnica.net/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-ios-icon-d9a45f558c.png" />
        <link rel="mask-icon" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-macos-safari-8997f76b21.svg" color="#ff4e00">
        <link rel="icon" sizes="192x192" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png" />
    </head>
    <body>
        <p>content</p>
    </body>
    </html>`,

    "https://arstechnica.com/test3": `<!DOCTYPE html>
    <html lang="en-us">
    
    <head>
        <title>Ars Technica</title>
        <link rel="shortcut icon" href="https://cdn.arstechnica.net/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-ios-icon-d9a45f558c.png" />
        <link rel="mask-icon" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/ars-macos-safari-8997f76b21.svg" color="#ff4e00">
        <link rel="icon" sizes="192x192" href="https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png" />
    </head>
    <body>
        <p>content</p>
    </body>
    </html>`,

    "https://arstechnica.com/test4": `<!DOCTYPE html>
    <html lang="en-us">
    
    <head>
        <title>Ars Technica</title>
    </head>
    <body>
        <p>content</p>
    </body>
    </html>
    `
}

global['fetch'] = jest.fn().mockImplementation((r) =>
    Promise.resolve({
        text: () => Promise.resolve(responses[r])
    })
);

test("Large Icon in HTML5", async () => {
    let icon = await Favicon.discover("https://arstechnica.com/test1");
    
    expect(icon).toBe('https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png');
});

test("Large Icon in XHTML", async () => {
    let icon = await Favicon.discover("https://arstechnica.com/test2");
    
    expect(icon).toBe('https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png');
});

test("Large Icon no DOCTYPE", async () => {
    let icon = await Favicon.discover("https://arstechnica.com/test3");
    
    expect(icon).toBe('https://cdn.arstechnica.net/wp-content/themes/ars/www/img/material-ars-db41652381.png');
});

test("Default to favicon.ico", async () => {
    let icon = await Favicon.discover("https://arstechnica.com/test4");
    
    expect(icon).toBe('https://arstechnica.com/test4/favicon.ico');
});

