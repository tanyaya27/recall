    await grant();
    await fresh4('M1 Move it BASEBALL CARD (in Wooden box): In -> Cookie tin, t2 Sewing box, t3 Pantry shelf; Save; Undo');
    await moveIt('baseball card'); await card('start'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await card('3'); await shot('m1-card');
    await doSave(); await shot('m1-saved'); console.log('   undo', await undoCount()); await st4('M1', ['baseball card', 'wooden box', 'sewing box']); await raw('baseball card');
    await undo('M1'); await shot('m1-undo'); await st4('M1 undo', ['baseball card', 'cookie tin', 'sewing box']); await raw('baseball card');
    console.log('-- M2 Move it COFFEE CAN? (needsPlace) / WALLET (old data Hall table) with tiers');
    await moveIt('wallet'); await card('wallet start'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Linen closet'); await doSave(); await st4('M2', ['wallet', 'cookie tin']); await undo('M2'); await st4('M2 undo', ['wallet', 'cookie tin']);

    await fresh4('SN1 Save + Next: item1 In=Cookie tin + t2 Kitchen counter (hold Save); item2 In=Cookie tin (now saved above); item3 In=Sewing box + t2 Pantry shelf; Undo');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); await card('after next 1'); await shot('sn1-next');
    await st4('SN1 item1', ['fork', 'cookie tin']);
    AI = { name: 'knife' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); await card('item2 start'); await openIn(); await pickIn('Cookie tin'); await card('item2 In cookie (saved above now)'); await shot('sn1-item2');
    await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); await card('after next 2');
    await st4('SN1 item2', ['fork', 'knife', 'cookie tin', 'sewing box']);
    console.log('   camera undo strip?', await undoCount()); if (await undoCount()) { await undo('SN1 camera undo of item2'); await st4('SN1 undo2', ['fork', 'cookie tin', 'sewing box']); }
    AI = { name: 'spoon' }; await cam('real_spoon.jpg'); await tap('.lc-shutter', { wait: 2000 }); await card('item3'); await openIn(); await pickIn('Sewing box'); await card('item3 In sewing'); await addTier().then(async (ok) => { if (ok) { await pickIn('Linen closet'); } });
    await doSave(); await st4('SN1 item3', ['fork', 'knife', 'spoon', 'cookie tin', 'sewing box']);
    await undo('SN1 home'); await st4('SN1 home undo', ['fork', 'cookie tin', 'sewing box']);

    await fresh4('ST1 stale: camera open, In=Cookie tin + t2 Kitchen counter; meanwhile Robert (other phone) puts Cookie tin into Linen closet; Margaret Saves');
    await logStart('ladle', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await card('before remote');
    await page.evaluate(() => { const d = window.__rig.dump(); const it = d.find(x => x.id === 'ct'); const t = Date.now(); const { id: _i, ...rest } = it;
      window.__rig.seed([{ id: 'ct', ...rest, location: 'Linen closet', needsPlace: false, updatedAt: t, history: [...(it.history || []), { location: 'Linen closet', at: t, by: 'robert' }] }, { id: 'eR' + t, kind: 'edge', rel: 'in', from: 'ct', to: { t: 'place', name: 'Linen closet' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); });
    await page.waitForTimeout(1500); await card('after remote'); await shot('st1-card'); await doSave(); await st4('ST1', ['ladle', 'cookie tin']); await raw('cookie tin');
    await undo('ST1'); await st4('ST1 undo', ['cookie tin']); await raw('cookie tin');

    await fresh4('ST2 stale tier 2: In=Cookie tin + t2 Sewing box; remote puts Sewing box into Attic; Save');
    await logStart('awl', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Basement');
    await page.evaluate(() => { const d = window.__rig.dump(); const it = d.find(x => x.id === 'sb'); const t = Date.now(); const { id: _i, ...rest } = it;
      window.__rig.seed([{ id: 'sb', ...rest, location: 'Attic', needsPlace: false, updatedAt: t, history: [...(it.history || []), { location: 'Attic', at: t, by: 'robert' }] }, { id: 'eS' + t, kind: 'edge', rel: 'in', from: 'sb', to: { t: 'place', name: 'Attic' }, since: t, until: null, how: 'chosen', owner: 'margaret', by: 'robert', private: false, roles: {}, sharedWith: [] }]); });
    await page.waitForTimeout(1500); await card('after remote'); await shot('st2-card'); await doSave(); await st4('ST2', ['awl', 'cookie tin', 'sewing box']);
    await undo('ST2'); await st4('ST2 undo', ['cookie tin', 'sewing box']);

    await fresh4('R1 Robert (editor), rules on: Log, In=Cookie tin, t2 New place "Shed", t3 New place "Yard"');
    await grant(); await asUser('robert');
    await logStart('rake', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await card('R In'); await addTier(); await srchT('Shed'); await tapNew(/New place: Shed/); await addTier(); await srchT('Yard'); await tapNew(/New place: Yard/); await card('R 3'); await shot('r1-card');
    await doSave(); await shot('r1-after'); console.log('   undo', await undoCount()); await st4('R1', ['rake', 'cookie tin', 'shed']); await raw('rake'); await raw('cookie tin');
    console.log('-- R2 Robert Move it baseball card -> Sewing box + t2 Kitchen counter');
    await moveIt('baseball card'); await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Kitchen counter'); await doSave(); await st4('R2', ['baseball card', 'sewing box']); console.log('   undo', await undoCount());
    await asUser('margaret'); await st4('R as margaret', ['rake', 'baseball card']);
    console.log('   ', errs());
