#!/bin/bash


set -euo pipefail

test -d www/ && find www/ -delete
mkdir -vp www/js
cp -vL src/js/config.js www/js
cp -vrL src/js/vendor www/js
cp -vr src/css www
( cd src && cp -vL *.png *.ico *.svg *.xml *.json worker.js index.html ../www )

sed -i "s/devMode = true/devMode = false/" www/index.html

npx webpack ${@-}
