# lzone.de

A backend less content aggregator for Markdown and RSS. Collect and hoard knowledge like in the 90s!

- Install tech knowledge from a curated catalog [lwindolf/lzone-cheat-sheets](https://github.com/lwindolf/lzone-cheat-sheets).
- Integration with ollama / HuggingFace models
- No AI slop! Real human expert knowledge.

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

## Setup

1. Clone the repo
2. `git submodule init`
3. `git submodule update`
4. Put the content of `www` into your webserver

## Configuration

- To customize the PWA edit `www/js/config.js`.
- To add/remove CLI commands edit `www/js/command.js`
- Customize check tools in `www/js/views/Checks.js`
- Update base URL + title in `www/index.html` and `www/manifest.json`

## Building / Testing

    npm install
    npm test
    npm start

## Updating Dependencies

    npm run build
