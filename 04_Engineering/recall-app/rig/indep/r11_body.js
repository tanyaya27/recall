    const cnt = async () => { const d = await D(); const k = {}; d.forEach(x => k[x.kind + (x.deleted ? '-del' : '')] = (k[x.kind + (x.deleted ? '-del' : '')] || 0) + 1); return JSON.stringify(k); };
    console.log('BEFORE', await cnt());
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'wallet' }; SAME = { index: 1, sure: true }; await cam('wallet.jpg'); await tap('.lc-shutter', { wait: 2500 });
    await words('in the kitchen drawer'); await press('.lc-k.sv'); for (let i = 0; i < 6; i++) { await page.waitForTimeout(400); console.log(i, (await bodyText()).replace(/\s+/g, ' ').slice(-220)); }
    await shot('w0-after'); console.log('AFTER', await cnt());
    const d = await D(); console.log(JSON.stringify(d.filter(x => x.kind === 'snap' || (x.kind === 'item' && x.createdAt > Date.now() - 60000)).map(x => ({ id: x.id, kind: x.kind, name: x.name, itemId: x.itemId, deleted: x.deleted }))));
    await dumpItem('wallet');
