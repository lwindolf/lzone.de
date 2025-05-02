# lzone.de

lzone.de is a static PWA, which means it is backend-less and you can host a copy of it whereever you want.

## Setup

1. Clone the repo
2. `git submodule init`
3. `git submodule update`
4. Put the content of `www` into your webserver

## Configuration

- To customize the PWA edit `www/js/config.js`.
- To add more CLI commands edit `www/js/command.js`
- Customize check tools in `www/js/views/Checks.js`

FIXME: describe how to setup SaaS multi status updating!

## Building / Testing

    npm install
    npm test
    npm start

## Updating Dependencies

    npm run installDeps