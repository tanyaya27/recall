    const leaveCam = async () => { await press('.lc-x'); await page.waitForTimeout(500); const lv = page.locator('button:has-text("Leave")'); if (await lv.count()) await lv.first().click(); await page.waitForTimeout(300); };
    const newRows = async () => page.locator('.in-list button').filter({ hasText: /New place/ }).allInnerTexts().then(a => a.map(s => s.replace(/\s+/g, ' ').trim()));
    const fromSaid = async () => page.evaluate(() => { const t = document.querySelector('.in-list').innerText; const m = t.split(/FROM WHAT YOU SAID/i)[1]; return m ? m.split(/RECENT|ALL YOUR/i)[0].replace(/\n+/g, ' / ').trim() : '(none)'; });
    const sheetFor = async (w, label) => { await setWords(w); await openIn(); console.log(`WORDS ${JSON.stringify(w)}\n      FROM-SAID: ${await fromSaid()}`); if (label) await shot(label); await cancelChoose(); };
    const srch = async (q, label) => { const i = page.locator('.in-list .wl-search input'); await i.fill(''); await i.type(q, { delay: 10 }); await page.waitForTimeout(500); console.log(`SEARCH ${JSON.stringify(q)} -> ${(await inText()).slice(0, 260)}`); if (label) await shot(label); };
    const tapNew = async (txt) => { const b = page.locator('.in-list button').filter({ hasText: txt }).first(); if (!(await b.count())) { console.log('   no new row', txt); return false; } await b.click(); await page.waitForTimeout(700); console.log('   tapped', await b.innerText().catch(() => txt)); return true; };
    const now = Date.now();
    const PL = (id, nm) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: now, createdAt: now, parent: null, photos: [] });
    await page.evaluate((s) => window.__rig.seed(s), [PL('pD', 'Desk'), PL('pB14', 'Box 14'), PL('pB1', 'Box 1'), PL('pS2', 'Shelf 2'),
      { id: 'lab', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'pantry shelf label', location: '', order: now, createdAt: now, lastSeenAt: now, logId: 'l_lab', photoCount: 0, written: true, photo: null, thumb: null, history: [] },
      { id: 'org', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'closet organizer', location: '', order: now, createdAt: now, lastSeenAt: now, logId: 'l_org', photoCount: 0, written: true, photo: null, thumb: null, history: [] }]);
    await page.reload(); await page.waitForTimeout(800); await page.evaluate(() => window.__rig.rules(true)); await allPlaces();
    await logStart('egg timer', 'real_spoon.jpg');
    for (const w of ['on the shelf in the closet under the stairs', 'in the kitchen counter drawer', 'on the desk', 'in the desk drawer', 'on the desk, in the drawer', 'in box 14', 'in box 1', 'in Box 14 on shelf 2', 'in box 140', 'on shelf 22', 'in the garage', 'in the garage cupboard', 'on the hall table', 'in the hall table drawer', 'in the coffee can', 'in the pantry', 'in the closet', 'in the label drawer', 'in the reading room', 'behind the TV', "at mom's house", 'in the blue folder in the desk drawer', 'in the drawer of the desk', 'inside the desk', 'under box 14', 'in Desk drawer 2', 'In the shed.In the bin', 'in the egg timer box'])
      await sheetFor(w, /shelf in the closet|kitchen counter drawer|box 140|desk, in/.test(w) ? w : null);
    console.log('\n######## A: several where-words -> tap a New place, Save');
    await setWords('on the shelf in the closet under the stairs'); await openIn(); const nr = await newRows(); console.log('NEW ROWS', JSON.stringify(nr)); if (nr.length) await tapNew(nr[0].replace(/^New place: /, '')); console.log('CAM', await camText()); await shot('A-chip');
    await doSave(); await dumpItem('egg timer'); await allPlaces(); await placeEdges();
    console.log('\n######## B: tap New place then x then Cancel the camera -> no stray place');
    await logStart('stapler', 'scissors.jpg'); await setWords('in the attic'); await openIn(); console.log('NEW', JSON.stringify(await newRows())); await tapNew('Attic'); await page.locator('.w1-in .x').first().click().catch(() => console.log('no x')); await page.waitForTimeout(400);
    await openIn(); await srch('Garden shed'); await tapNew('Garden shed'); await leaveCam(); await allPlaces();
    console.log('\n######## C: search "pass: hunter2" -> New place -> Save');
    await logStart('ruler', 'real_pencil.jpg'); await openIn(); await srch('pass: hunter2'); await tapNew('hunter2'); console.log('CAM', await camText(), await saveState()); await shot('C-chip'); await doSave(); await allPlaces(); await dumpItem('ruler');
    console.log('\n######## D: "in box 140" -> save');
    await logStart('hole punch', 'tin.jpg'); await setWords('in box 140'); await openIn(); const nd = await newRows(); console.log('NEW', JSON.stringify(nd)); if (nd.length) await tapNew(nd[0].replace(/^New place: /, '')); console.log('CAM', await camText()); await doSave(); await dumpItem('hole punch'); await allPlaces();
    console.log('\n######## E: search desk -> pick Desk');
    await logStart('tape', 'keys.jpg'); await setWords('on the desk'); await openIn(); await srch('desk', 'E-search-desk'); await pickIn('Desk'); console.log('CAM', await camText()); await doSave(); await dumpItem('tape');
    console.log('\n######## F: search "  attic   room  " -> new place name');
    await logStart('fan', 'closet.jpg'); await openIn(); await srch('  attic   room  '); const nf = await newRows(); console.log('NEW', JSON.stringify(nf)); if (nf.length) await tapNew('ttic'); await doSave(); await dumpItem('fan'); await allPlaces();
    console.log('\n######## G: second item, same words "under the stairs" -> must match existing Stairs (if created)');
    await logStart('mop', 'book.jpg'); await setWords('under the stairs'); await openIn(); console.log('FROM-SAID', await fromSaid(), 'NEW', JSON.stringify(await newRows())); await shot('G-sheet'); await cancelChoose(); await leaveCam();
    console.log('\n######## H: Log New place "Stairs" from words, while the place "Stairs" already exists under different case "STAIRS " via search');
    await logStart('bucket', 'box.jpg'); await openIn(); await srch('STAIRS '); await shot('H-search'); await cancelChoose(); await leaveCam();
    await allPlaces(); await placeEdges();
