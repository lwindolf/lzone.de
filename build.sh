#!/bin/bash


set -euo pipefail

cd node_modules
cp \
	dompurify/dist/purify.es.mjs \
	handlebars/dist/handlebars.min.js \
	webamp/built/webamp.bundle.min.js \
	glightbox/dist/js/glightbox.min.js \
	lunr/lunr.min.js \
	mermaid/dist/mermaid.esm.min.mjs \
	split.js/dist/split.min.js \
	rst2html/dist/rst2html.min.js \
	../www/js/vendor

# Mermaid has chunks it wants to load
test -d ../www/js/vendor/chunks || mkdir ../www/js/vendor/chunks
cp -r mermaid/dist/chunks/mermaid.esm.min ../www/js/vendor/chunks

cp glightbox/dist/css/glightbox.min.css ../www/css
