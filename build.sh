#!/bin/bash


set -euo pipefail

cd node_modules
cp \
	dompurify/dist/purify.es.mjs \
	handlebars/dist/handlebars.min.js \
	webamp/built/webamp.bundle.min.js \
	lunr/lunr.min.js \
	mermaid/dist/mermaid.esm.min.mjs \
	split.js/dist/split.es.js \
	rst2html/dist/rst2html.min.js \
	pdfjs-dist/build/pdf.mjs \
	pdfjs-dist/build/pdf.sandbox.mjs \
	pdfjs-dist/build/pdf.worker.mjs \
	../www/js/vendor

# Mermaid has chunks it wants to load
test -d ../www/js/vendor/chunks || mkdir ../www/js/vendor/chunks
cp -r mermaid/dist/chunks/mermaid.esm.min ../www/js/vendor/chunks

# PDF.js viewer has to be copied as well
test -d ../www/js/vendor/pdf_viewer || mkdir ../www/js/vendor/pdf_viewer
cp -r pdfjs-dist/web/* ../www/js/vendor/pdf_viewer

# Run build.sh for rss-finder
( cd ../www/rss-finder; npm run build )
