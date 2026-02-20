#!/bin/bash


set -euo pipefail

test -d www/ && find www/ -delete
mkdir -vp www/js
cp -vL src/js/config.js www/js
cp -vrL src/js/vendor www/js
cp -vr src/css www
( cd src && cp -vL *.png *.ico *.svg *.xml *.json worker.js index.html ../www )

sed -i "s/devMode = true/devMode = false/" www/index.html

# Update index.html title, feeds and blogroll
cat <<EOT | node --input-type=module

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './www/js/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const indexPath = path.join(__dirname, 'www', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(indexPath, indexContent.replace(/<!-- head insertion marker -->/, Config.head));

EOT

npx webpack ${@-}
