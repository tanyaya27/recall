    const ls = async (nm) => { const d = await itemDoc(nm); return d ? `${nm}: lastSeen=${d.lastSeenAt} loc=${JSON.stringify(d.location)} needsPlace=${d.needsPlace} hist=${(d.history||[]).length}` : nm + ' MISSING'; };
    await fresh4('LS lastSeen of tier boxes: Log, In=Cookie tin, t2=Sewing box, t3=Pantry shelf; Save; Undo');
    const b0 = [await ls('cookie tin'), await ls('sewing box')]; console.log('   BEFORE', b0.join(' | '));
    await logStart('peg', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await doSave();
    console.log('   AFTER SAVE', await ls('cookie tin'), '|', await ls('sewing box')); await undo('LS'); console.log('   AFTER UNDO', await ls('cookie tin'), '|', await ls('sewing box'));
    await pageWords('cookie tin', 'ls-cookie-page');

    await fresh4('SN2 Save + Next carries the In chip: item1 In=Cookie tin + t2 Kitchen counter (Save+Next); item2: + on the carried chip -> Linen closet; Save');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500);
    AI = { name: 'knife' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); await card('item2 carried'); await shot('sn2-carried');
    if ((await upBtns()).length) { await addTier(); await pickIn('Linen closet'); await card('item2 + Linen'); await shot('sn2-card'); await doSave(); await st4('SN2', ['fork', 'knife', 'cookie tin']); await raw('cookie tin'); await undo('SN2'); await st4('SN2 undo', ['fork', 'cookie tin']); await raw('cookie tin'); } else { await leaveCam(); }

    await fresh4('N3b In = New place "Bread bin" (from words), t2 = "New place: Bread bin" exact; Save; Undo');
    await logStart('scoop', 'real_spoon.jpg'); await setWords('in the bread bin'); await openIn(); await tapNew(/New place: Bread bin/); await addTier(); console.log('   t2 list said-rows:', JSON.stringify(await listNames()));
    const n3 = await srchT('bread bin'); if (n3.find(x => /New place/.test(x))) { await tapNew(/New place: Bread bin/); await card('dup'); await shot('n3b-card'); await doSave(); await st4('N3b', ['scoop']); await undo('N3b'); await st4('N3b undo', []); } else { await cancelList(); await leaveCam(); }
    console.log('-- N3c t2 new Larder, t3 "New place: Larder" exact');
    await logStart('sieve', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await srchT('Larder'); await tapNew(/New place: Larder/); await addTier(); const n4 = await srchT('Larder');
    if (n4.find(x => /New place/.test(x))) { await tapNew(/New place: Larder/); await card('dup2'); await doSave(); await st4('N3c', ['sieve', 'cookie tin']); await undo('N3c'); await st4('N3c undo', ['cookie tin']); } else { await cancelList(); await leaveCam(); }

    await fresh4('W1 words help tiers: "in the cookie tin in the sewing box on the pantry shelf"');
    await logStart('bobbin', 'real_spoon.jpg'); await setWords('in the cookie tin in the sewing box on the pantry shelf'); await openIn(); console.log('   In list:', (await sheetText('.in-list')).slice(0, 260)); await pickIn('Cookie tin');
    await addTier(); await shot('w1-t2-list'); await pickIn('Sewing box'); await addTier(); console.log('   t3 list:', (await sheetText('.in-list')).slice(0, 260)); await pickIn('Pantry shelf'); await card('w1'); await doSave(); await st4('W1', ['bobbin']);

    await fresh4('ST2b stale: In=Cookie tin + t2 Sewing box + t3 Basement; remote puts Sewing box into Attic; Save; Undo — raw sewing box');
    await logStart('awl', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Basement');
    await page.evaluate(() => { const d = window.__rig.dump(); const it = d.find(x => x.id === 'sb'); const t = Date.now(); const { id: _i, ...rest } = it;
      window.__rig.seed([{ id: 'sb', ...rest, location: 'Attic', needsPlace: false, lastSeenAt: t, updatedAt: t, history: [...(it.history || []), { location: 'Attic', at: t, by: 'robert' }] }, { id: 'eS' + t, kind: 'edge', rel: 'in', from: 'sb', to: { t: 'place', name: 'Attic' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); });
    await page.waitForTimeout(1500); await raw('sewing box'); await doSave(); await raw('sewing box'); await undo('ST2b'); await raw('sewing box'); await st4('ST2b undo', ['sewing box']); await pageWords('sewing box', 'st2b-page'); await notPut();
    console.log('   ', errs());
