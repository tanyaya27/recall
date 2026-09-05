# SSR smoke test — renders every screen in node, no browser, no Firebase

Catches reference errors and missing imports in every render path. Does NOT test the
camera, the AI call or Firestore.

```
npm i --no-save react@18.3.1 react-dom@18.3.1        # not kept; React ships from the CDN
npx esbuild smoke/smoke.jsx --bundle --platform=node --format=cjs --jsx=automatic \
  --define:__BUILD__="'smoke'" \
  --alias:firebase/firestore=./smoke/stubs/firestore.js \
  --alias:firebase/app=./smoke/stubs/fbapp.js --alias:firebase/auth=./smoke/stubs/fbauth.js \
  --outfile=/tmp/smoke.cjs && node /tmp/smoke.cjs
```
Expected: a JSON object where every screen key is `true` and `boardOrder` is `c,a,b`.
