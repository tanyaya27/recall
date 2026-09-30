    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    let pool = ''; page.on('request', (r) => { if (/anthropic/.test(r.url())) { const b = JSON.parse(r.postData() || '{}'); const t = (b.messages?.[0]?.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n'); if (/MOVES:/.test(t)) pool = t.split('\n').filter(l => /^SAVED/.test(l)).join(' ; '); } });
    const places = async () => { await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Places")', { wait: 800 }); };
    const openPlace = async (nm) => { await places(); await page.locator(`.loc-row:has-text("${nm}")`).first().click(); await page.waitForTimeout(700); };
    const plDocs = () => page.evaluate(() => window.__rig.dump().filter(x => x.kind === 'place' && !x.deleted).map(x => `${x.id}:${x.name}(${(x.photos||[]).length})`).join(', '));
    const rename = async (from, to) => { await openPlace(from); await tap('.field-value', { wait: 400 }); await page.locator('input.place-input').fill(to); await page.waitForTimeout(200); const t = await bodyText(); await shot('rename ' + from + ' to ' + to); await page.locator('button:text-is("Save")').click(); await page.waitForTimeout(700); const after = await bodyText(); console.log(`RENAME ${from} -> "${to}": sheet said: ${t.replace(/\n/g,' | ').match(/Name \|(.*?)Items|Name \|(.*?)Nothing/)?.[0] || ''} || after: ${after.replace(/\n/g,' | ').slice(0, 200)}`); console.log('  places:', await plDocs()); };
    await rename('Kitchen counter', 'pantry SHELF');
    await rename('Linen closet', 'Tin box');
    await rename('Garage shelf', '   ');
    await rename('White cardboard box', 'Desk drawer');
    await places(); console.log('PLACES:', (await bodyText()).replace(/\n/g, ' | ')); await shot('places after dup renames');
    await openPlace('Desk drawer'); const ph = await page.locator('.place-photo:not(.add)').count(); const here = await page.locator('.things-here img').evaluateAll(e => e.map(x => x.alt)); console.log('Desk drawer page photos', ph, 'items', JSON.stringify(here)); await shot('desk drawer page after merge');
    // camera: recognition pool and Choose place list after the duplicate
    await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'ruler' }; await cam('real_pencil.jpg'); await tap('.lc-shutter', { wait: 1800 });
    await tap('.lv-sq.plus', { wait: 400 }); WHERE.push({ name: 'drawer', known: 'Desk drawer', moves: false }); await cam('drawer.jpg'); await tap('.lc-shutter', { wait: 3500 });
    console.log('POOL', pool); await shot('recognise after dup'); const t = await bodyText(); console.log('asked:', (t.match(/Is this the[^?]*\?/) || ['none'])[0]);
    check('PL2', 'recognition pool has no duplicate names', new Set((pool.match(/"[^"]*"/g) || []).map(x => x.toLowerCase())).size === (pool.match(/"[^"]*"/g) || []).length, pool);
    const y = page.locator('.lc button:has-text("Yes")'); if (await y.count()) { await y.click(); await page.waitForTimeout(600); }
    await tap('.lc-k.sv', { wait: 2000 }); console.log('places after yes-save:', await plDocs());
