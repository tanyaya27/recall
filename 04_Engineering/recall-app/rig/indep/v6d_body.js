    let r;
    const shut = async (nm, f = 'real_spoon.jpg') => { AI = { name: nm }; await cam(f); await tap('.lc-shutter', { wait: 2000 }); };
    const seedX = async (docs) => { await page.evaluate((s) => window.__rig.seed(s), docs); await page.waitForTimeout(600); };
    const now0 = Date.now();
    const box = (id, name, location, extra = {}) => ({ id, kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name, location, photo: null, thumb: null, written: true, holds: true, order: now0 - 4e6, createdAt: now0 - 4e6, lastSeenAt: now0 - 4e6, logId: 'l_' + id, photoCount: 0, history: [{ location, at: now0 - 4e6 }], ...extra });
    const edge = (id, from, to) => ({ id, kind: 'edge', rel: 'in', from, to, since: now0 - 4e6, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });

    await fresh4('ED Robert (editor), rules on');
    await grant(); await asUser('robert');
    await logStart('rake', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); r = await sv('ED1 robert 3-tier'); await st4('ED1', ['rake', 'cookie tin', 'sewing box']); if (r.open) await leaveCam();
    await logStart('hoe', 'real_desk.jpg'); await openIn(); await pickIn('Green bag'); r = await sv('ED2 robert into deep box'); await st4('ED2', ['hoe']); if (r.open) await leaveCam();
    await mv('red crate'); await openIn(); await pickIn('Linen closet'); r = await sv('ED3 robert Move it red crate (holds) -> Linen closet'); await st4('ED3', ['green bag', 'red crate']); if (r.open) await leaveCam();
    await mv('baseball card'); await openIn(); await pickIn('Cookie tin'); r = await sv('ED4 robert Move it card -> Cookie tin'); await st4('ED4', ['baseball card']); if (r.open) await leaveCam();
    await logStart('trowel', 'real_desk.jpg'); await openIn(); await pickIn('Upstairs hall'); if (await addTier()) await pickIn('Basement'); r = await sv('ED5 robert place>place'); await st4('ED5', ['trowel', 'upstairs hall']); if (r.open) await leaveCam();
    await logStart('twine', 'real_desk.jpg'); await openIn(); await pickIn('Blue bin'); await svNext('ED6 robert Save+Next'); await shut('gloves'); await openIn(); await pickIn('Red crate'); await card('ed6b'); r = await sv('ED6b robert item2 into red crate'); await st4('ED6', ['twine', 'gloves']); if (r.open) await leaveCam();

    await fresh4('PV private things in the chain, Robert editor (Margaret private box "safe" holds cookie tin; private "diary" inside sewing box)');
    await seedX([box('sf', 'safe', 'Linen closet', { private: true }), edge('esf', 'sf', { t: 'place', name: 'Linen closet' }), edge('ectsf', 'ct', { t: 'thing', id: 'sf', name: 'safe' }),
      { ...box('di', 'diary', 'Sewing box', { private: true }), holds: false }, edge('edi', 'di', { t: 'thing', id: 'sb', name: 'sewing box' })]);
    await page.evaluate(() => { const d = window.__rig.dump(); const ct = d.find(x => x.id === 'ct'); window.__rig.seed([{ ...ct, location: 'Safe' }]); }); await page.waitForTimeout(500);
    await grant(); await asUser('robert');
    await logStart('pin', 'real_spoon.jpg'); await openIn(); await card('pv'); const hasCt = await listHas('Cookie tin'); console.log('   robert sees Cookie tin?', hasCt); if (hasCt) { await pickIn('Cookie tin'); await card('pv ct'); r = await sv('PV1 robert into cookie tin (inside a private safe)'); await st4('PV1', ['pin', 'cookie tin']); if (r.open) await leaveCam(); } else { await cancelList(); await leaveCam(); }
    await mv('sewing box'); await openIn(); await pickIn('Pantry shelf'); r = await sv('PV2 robert Move it sewing box (holds a private diary) -> Pantry shelf'); await st4('PV2', ['sewing box', 'button jar']); if (r.open) await leaveCam();
    await logStart('pen', 'real_spoon.jpg'); await openIn(); await pickIn('Button jar'); await addTier().catch(() => {}); await card('pv3'); r = await sv('PV3 robert into button jar'); await st4('PV3', ['pen']); if (r.open) await leaveCam();
    await asUser('margaret');
    console.log('   ', errs()); summary();
