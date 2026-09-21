#!/bin/bash
set -e
cd /home/claude/rig
mkdir -p out
./node_modules/.bin/esbuild src/main.jsx --bundle --format=esm --jsx=automatic --define:__BUILD__="'2026-09-14T12:00:00Z'" \
  --alias:firebase/firestore=./stubs/firestore.js --alias:firebase/app=./stubs/fbapp.js --alias:firebase/auth=./stubs/fbauth.js --alias:firebase/functions=./stubs/fbfunctions.js \
  --outfile=out/app.js --log-level=warning
cp styles.css out/styles.css
cat > out/index.html <<'HTML'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>ReCall rig</title><link rel="stylesheet" href="./styles.css" /></head>
<body><div id="root"></div><script type="module" src="./app.js?v=rig1"></script></body></html>
HTML
