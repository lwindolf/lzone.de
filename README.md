# lzone.de

A backend less content aggregator for Markdown and RSS. Collect and hoard knowledge like in the 90s!

- Install tech knowledge from a curated catalog [lwindolf/lzone-cheat-sheets](https://github.com/lwindolf/lzone-cheat-sheets).
- No AI slop! Real human expert knowledge.
- Integration with local ollama / HuggingFace models

## What is this?

On the functional side this web app

- allows you to install hundreds of cheat sheets from a curated catalog
- read your installed cheat sheets offline
- "own" the content forever if needed
- search it using the app, stop googling
- embedded feed reader

On the technical side

- Vanilla JS progressive web app with minimal dependencies
- using Cloudflare CORS proxy for RSS
- backend-less offline content caching app
- for now: Web only (mobile is not focus)

## Deploying

You can copy the `www` directly into your webserver root.

Although you might want to customize stuff first:

1. To customize the PWA edit `src/js/config.js`.
2. To add/remove CLI commands edit `src/js/command.js`
3. Update base URL + title in `src/index.html` and `src/manifest.json`

## Building / Testing

Update dependencies

    npm i

Test source without bundling in `src`

    git submodule init
    git submodule update

    npm run startDev

Bundle and test production source in `www`

    npm run build
    npm start