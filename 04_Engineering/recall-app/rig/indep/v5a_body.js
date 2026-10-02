    await grant();
    await fresh4('LP1 loop made by another phone: Log thimble, In=Cookie tin + t2 Red crate; Robert puts Red crate INTO Cookie tin; Save');
    await grant();
    await logStart('thimble', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Red crate'); await card('before remote');
    let s0 = await snapAll(); await remoteIn('rc', T_('ct', 'cookie tin')); await card('after remote'); await shot('lp1-card');
    s0 = await snapAll(); await doSave(); await shot('lp1-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP1 save');
    await st4('LP1', ['thimble', 'cookie tin', 'red crate']);
    if (await camOpen()) { await card('still on camera'); await tierX(1); await card('after x t2'); s0 = await snapAll(); await doSave(); await shot('lp1-resave'); await msg(); await diffSnap(s0, 'LP1 resave'); await st4('LP1 resave', ['thimble', 'cookie tin', 'red crate']);
      if (await undoCount()) { s0 = await snapAll(); await undo('LP1 resave'); await msg(); await diffSnap(s0, 'LP1 undo'); await st4('LP1 undo', ['cookie tin', 'red crate']); } }

    await fresh4('LP2 Move it BLUE BIN (in Red crate) -> In Cookie tin; Robert puts Cookie tin INTO Green bag (green bag is in blue bin); Save');
    await moveIt('blue bin'); await openIn(); await pickIn('Cookie tin'); await card('mv');
    await remoteIn('ct', T_('gb', 'green bag')); await card('after remote');
    s0 = await snapAll(); await doSave(); await shot('lp2-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP2 save'); await st4('LP2', ['blue bin', 'cookie tin', 'green bag']);
    if (await camOpen()) await leaveCam();

    await fresh4('LP3 place loop: Log lamp, In=Cookie tin + t2 Upstairs hall + t3 Basement; Robert puts Basement INTO Attic (Attic is in Upstairs hall); Save');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Upstairs hall'); await addTier(); await pickIn('Basement'); await card('3');
    await remoteIn('pB', { t: 'place', name: 'Attic' }); await card('after remote');
    s0 = await snapAll(); await doSave(); await shot('lp3-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP3 save'); await st4('LP3', ['lamp', 'cookie tin', 'upstairs hall', 'basement', 'attic']);
    if (await camOpen()) await leaveCam();

    await fresh4('LP4 self loop via another phone: Move it COOKIE TIN -> In Sewing box; Robert puts Sewing box INTO Cookie tin; Save');
    await moveIt('cookie tin'); await card('start'); await btn(/Put it somewhere/, 1200).catch(() => {}); await card('start2'); await openIn(); await pickIn('Sewing box'); await card('mv');
    await remoteIn('sb', T_('ct', 'cookie tin'));
    s0 = await snapAll(); await doSave(); await shot('lp4-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP4 save'); await st4('LP4', ['cookie tin', 'sewing box', 'button jar']);
    if (await camOpen()) await leaveCam();

    await fresh4('LP5 legit moves inside own chain (no loop): Move it GREEN BAG -> In Red crate (its grandparent); Undo');
    await moveIt('green bag'); await openIn(); console.log('   In list offers red crate', await listHas('Red crate'), 'blue bin', await listHas('Blue bin')); await pickIn('Red crate');
    s0 = await snapAll(); await doSave(); await msg(); await diffSnap(s0, 'LP5 save'); await st4('LP5', ['green bag', 'blue bin']);
    s0 = await snapAll(); await undo('LP5'); await msg(); await diffSnap(s0, 'LP5 undo'); await st4('LP5 undo', ['green bag', 'blue bin']);
    console.log('-- LP5b Move it BASEBALL CARD -> In Memorabilia box (grandparent); Undo');
    await moveIt('baseball card'); await openIn(); await pickIn('Memorabilia box'); s0 = await snapAll(); await doSave(); await msg(); await diffSnap(s0, 'LP5b save'); await st4('LP5b', ['baseball card']);
    s0 = await snapAll(); await undo('LP5b'); await msg(); await diffSnap(s0, 'LP5b undo'); await st4('LP5b undo', ['baseball card']);

    await fresh4('LP6 same name box vs place (no loop): box "upstairs hall" (no place); Log ball, In = box Upstairs hall + t2 place Attic (Attic is in place Upstairs hall)');
    await page.evaluate(() => { const now = Date.now(); window.__rig.seed([{ id: 'uhb', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: 'upstairs hall', location: '', photo: null, thumb: null, written: true, holds: true, order: now - 3e6, createdAt: now - 3e6, lastSeenAt: now - 3e6, logId: 'l_uhb', photoCount: 0, history: [{ location: '', at: now - 3e6 }] }]); });
    await page.waitForTimeout(800);
    await logStart('ball', 'real_spoon.jpg'); await openIn(); console.log('   In rows:', JSON.stringify(await listNames())); await pickKind('Upstairs hall', /a box/); await card('In box UH');
    if (await addTier()) { console.log('   t2 has place Attic?', await listHas('Attic')); const ok = await pickKind('Attic', /place/); await card('t2 attic'); await shot('lp6-card'); }
    s0 = await snapAll(); await doSave(); await shot('lp6-after'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP6 save');
    if (await camOpen()) await leaveCam();
    console.log('-- LP6b Log cup, In = place Attic? read-only; In = place Upstairs hall + t2 box "Upstairs hall"?');
    await logStart('cup', 'real_spoon.jpg'); await openIn(); await pickKind('Upstairs hall', /place/); await card('In place UH'); if (await addTier()) { console.log('   t2 rows', JSON.stringify(await listNames())); await cancelList(); } await leaveCam();
    console.log('   ', errs());
