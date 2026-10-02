    const remoteEdit = async (id, patch, label) => { await page.evaluate(([id, patch]) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const { id: _i, ...rest } = it; window.__rig.seed([{ id, ...rest, ...patch, updatedAt: Date.now() }]); }, [id, patch]); console.log('   REMOTE edit (robert):', label); await page.waitForTimeout(1500); };
    await grant();
    await fresh4('ST1 (#3) her "in" row for a box another phone just placed: ladle In=Cookie tin + t2 Kitchen counter; Robert puts Cookie tin INTO Linen closet; Save');
    await logStart('ladle', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await card('before');
    await remoteIn('ct', { t: 'place', name: 'Linen closet' }); await card('after remote'); await shot('st1-card');
    let r = await sv('ST1 save', false); await st4('ST1', ['ladle', 'cookie tin']);
    if (r.open) { await card('st1 still'); await tierX(1); await card('after x'); await sv('ST1 resave'); await st4('ST1 resave', ['ladle', 'cookie tin']); if (await undoCount()) { S0 = await snapAll(); await undo('ST1'); await msg(); await diffSnap(S0, 'ST1 undo'); await st4('ST1 undo', ['ladle', 'cookie tin']); } if (await camOpen()) await leaveCam(); }

    await fresh4('ST1b NOT a conflict: ladle In=Cookie tin + t2 Kitchen counter; Robert puts Cookie tin into Kitchen counter too (same place); Save');
    await logStart('ladle', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter');
    await remoteIn('ct', { t: 'place', name: 'Kitchen counter' }); await card('after remote'); await shot('st1b-card');
    r = await sv('ST1b save'); await st4('ST1b', ['ladle', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('ST2 tier-2 box placed by another phone: awl In=Cookie tin + t2 Sewing box + t3 Basement; Robert puts Sewing box into Attic; Save');
    await logStart('awl', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Basement');
    await remoteIn('sb', { t: 'place', name: 'Attic' }); await card('after remote'); await shot('st2-card');
    r = await sv('ST2 save', false); await st4('ST2', ['awl', 'cookie tin', 'sewing box']);
    if (r.open) { await tierX(2); await card('after x t3'); await sv('ST2 resave'); await st4('ST2 resave', ['awl', 'cookie tin', 'sewing box']); if (await camOpen()) await leaveCam(); }

    await fresh4('ST3 no "in" row for the moved box: thread In=Cookie tin (only); Robert puts Cookie tin into Linen closet; Save (should save)');
    await logStart('thread', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await card('In');
    await remoteIn('ct', { t: 'place', name: 'Linen closet' }); await card('after remote'); await shot('st3-card');
    r = await sv('ST3 save'); await st4('ST3', ['thread', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('ST4 Robert RENAMES the cookie tin while camera open: In=Cookie tin + t2 Pantry shelf; Save (should save)');
    await logStart('pin', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Pantry shelf');
    await remoteEdit('ct', { name: 'biscuit tin' }, 'cookie tin -> biscuit tin'); await card('after rename'); await shot('st4-card');
    r = await sv('ST4 save'); await st4('ST4', ['pin', 'biscuit tin']); if (r.open) await leaveCam();

    await fresh4('ST5 Robert moves an UNRELATED box while camera open: In=Cookie tin + t2 Sewing box; Robert moves Red crate to Basement; Save (should save)');
    await logStart('needle', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box');
    await remoteIn('rc', { t: 'place', name: 'Basement' }); await card('after remote');
    r = await sv('ST5 save'); await st4('ST5', ['needle', 'cookie tin', 'sewing box', 'red crate']); if (r.open) await leaveCam();

    await fresh4('ST6 Robert LOGS a new thing into the Cookie tin while camera open: In=Cookie tin + t2 Kitchen counter; Save (should save)');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter');
    await remoteNew('rhoe', 'hoe', T_('ct', 'cookie tin')); await card('after remote');
    r = await sv('ST6 save'); await st4('ST6', ['fork', 'hoe', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('ST7 Robert moves the tier-2 PLACE (Basement into Attic) — no loop: In=Cookie tin + t2 Basement; Save (her chain is still true: cookie tin in Basement)');
    await logStart('wick', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Basement');
    await remoteIn('pB', { t: 'place', name: 'Attic' }); await card('after remote'); await shot('st7-card');
    r = await sv('ST7 save'); await st4('ST7', ['wick', 'cookie tin', 'basement']); if (r.open) await leaveCam();

    await fresh4('ST8 Move it with remote: Move it BLUE BIN -> Cookie tin + t2 Pantry shelf; Robert puts Cookie tin into Linen closet; Save');
    await mv('blue bin'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Pantry shelf');
    await remoteIn('ct', { t: 'place', name: 'Linen closet' }); await card('after remote'); await shot('st8-card');
    r = await sv('ST8 save', false); await st4('ST8', ['blue bin', 'cookie tin', 'green bag']); if (r.open) await leaveCam();
    console.log('   ', errs()); summary();
