    const remoteMove = async (id, place) => page.evaluate(([id, place]) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const t = Date.now(); const edges = d.filter(x => x.kind === 'edge' && x.from === id && !x.until).map(e => ({ ...e, until: t })); const { id: _i, ...rest } = it;
      window.__rig.seed([{ id, ...rest, location: place, needsPlace: false, lastSeenAt: t, updatedAt: t, history: [...(it.history || []), { location: place, at: t, w: 1, said: 'robert moved it', by: 'robert' }] }, ...edges, { id: 'eR' + t, kind: 'edge', rel: 'in', from: id, to: { t: 'place', name: place }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); }, [id, place]);
    await fresh4('U1 stale Undo, tier box: Log, In=Cookie tin + t2 Kitchen counter; Save; Robert moves Cookie tin to Linen closet; Margaret taps Undo');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await doSave(); await st4('U1 save', ['fork', 'cookie tin']);
    await remoteMove('ct', 'Linen closet'); await page.waitForTimeout(1500); await raw('cookie tin'); console.log('   undo visible', await undoCount());
    if (await undoCount()) { await undo('U1'); await shot('u1-after-undo'); await st4('U1 undo', ['cookie tin']); await raw('cookie tin'); console.log('   fork:', JSON.stringify(await itemDoc('fork') ? 'STILL THERE' : 'deleted')); }
    await fresh4('U2 stale Undo, tier-2 box: Log, In=Cookie tin + t2 Sewing box + t3 Pantry shelf; Save; Robert moves Sewing box to Attic; Undo');
    await logStart('pin', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await doSave();
    await remoteMove('sb', 'Attic'); await page.waitForTimeout(1500); console.log('   undo visible', await undoCount());
    if (await undoCount()) { await undo('U2'); await shot('u2-after-undo'); await st4('U2 undo', ['cookie tin', 'sewing box']); await raw('sewing box'); }
    await fresh4('U3 stale Undo, Move it with tiers: Move it baseball card -> Cookie tin + t2 KC; Robert moves Cookie tin to Attic; Undo on the page note');
    await moveIt('baseball card'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await doSave();
    await remoteMove('ct', 'Attic'); await page.waitForTimeout(1500); console.log('   undo visible', await undoCount());
    if (await undoCount()) { await undo('U3'); await shot('u3-after-undo'); await st4('U3 undo', ['baseball card', 'cookie tin']); await raw('cookie tin'); }
    console.log('   ', errs());
    await fresh4('G1 secrets in the tier search and tier words');
    await logStart('router', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier();
    for (const q of ['pass: hunter2', 'Pass: hunter2', 'PIN4821', 'p/w hunter2', 'login bob hunter2', 'pw: hunter2', 'wifi password hunter2']) await srchT(q);
    const nn = (await listNames()).find(x => /New place/.test(x)); if (nn) { await tapNew(/New place/); await card('secret tier'); await shot('g1-secret-tier'); await doSave(); await st4('G1', ['router', 'cookie tin']); } else { await cancelList(); await setWords('in the cookie tin, pass: hunter2'); await addTier(); console.log('   tier list with secret words:', await listNames()); await cancelList(); await leaveCam(); await allPlaces(); }
