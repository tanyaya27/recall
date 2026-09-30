    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    page.on('request', (r) => { if (/anthropic/.test(r.url())) { const b = JSON.parse(r.postData() || '{}'); const t = (b.messages?.[0]?.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n'); if (/MOVES:/.test(t)) console.log('WHERE PROMPT (SAVED lines):\n' + t.split('\n').filter(l => /SAVED|pool|known/i.test(l)).join('\n').slice(0, 1500), '\nimages:', (b.messages?.[0]?.content || []).filter(x => x.type === 'image').length); } });
    await home(); await page.click(LOG); await page.waitForTimeout(900);
    AI = { name: 'usb stick' }; await cam('keys.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 });
    WHERE.push({ name: 'drawer', known: 'Desk drawer', moves: false }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 2500 });
    console.log('lastPool', lastPool);
