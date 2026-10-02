    const remoteEdit = async (id, patch, label) => { await page.evaluate(([id, patch]) => { const d = window.__rig.dump(); const it = d.find(x => x.id === id); const { id: _i, ...rest } = it; window.__rig.seed([{ id, ...rest, ...patch, updatedAt: Date.now() }]); }, [id, patch]); console.log('   REMOTE edit (robert):', label); await page.waitForTimeout(1500); };
    const logFork = async (nm = 'fork') => { await logStart(nm, 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await doSave(); };
    let s0;
    await grant();
    await fresh4('UG1 Undo right after Move it of a box with contents: Move it SEWING BOX (holds button jar) -> Pantry shelf; Undo');
    await openItem('sewing box'); await btn(/Put it somewhere|Move it/, 1200); await openIn(); await pickIn('Pantry shelf'); s0 = await snapAll(); await doSave(); await diffSnap(s0, 'UG1 save');
    s0 = await snapAll(); await undo('UG1'); await msg(); await shot('ug1-undo'); await diffSnap(s0, 'UG1 undo'); await st4('UG1 undo', ['sewing box', 'button jar']);
    console.log('-- UG1b Move it RED CRATE (holds blue bin > green bag) -> Cookie tin + t2 Pantry shelf; Undo at once');
    await openItem('red crate'); await btn(/Put it somewhere|Move it/, 1200); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Pantry shelf'); s0 = await snapAll(); await doSave(); await st4('UG1b', ['green bag', 'red crate']);
    s0 = await snapAll(); const u0 = Date.now(); await undo('UG1b'); await msg(); await shot('ug1b-undo'); await diffSnap(s0, 'UG1b undo'); await st4('UG1b undo', ['green bag', 'red crate', 'cookie tin']);

    await fresh4('UG2 Robert LOGS a new thing into Cookie tin (does not move it) after Margaret saved fork In=Cookie tin + t2 KC; Margaret Undo');
    await grant(); await logFork(); await remoteNew('rhoe', 'hoe', T_('ct', 'cookie tin'));
    s0 = await snapAll(); await undo('UG2'); await msg(); await shot('ug2-undo'); await diffSnap(s0, 'UG2 undo'); await st4('UG2 undo', ['fork', 'hoe', 'cookie tin']);

    await fresh4('UG3 new place at a tier, then Robert logs a hoe into it: fork In=Cookie tin + t2 New place Shed; Save; Robert hoe -> Shed; Undo');
    await grant(); await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await srchT('Shed'); await tapNew(/New place: Shed/); await doSave(); await st4('UG3', ['fork', 'cookie tin']);
    await remoteNew('rhoe', 'hoe', { t: 'place', name: 'Shed' });
    s0 = await snapAll(); await undo('UG3'); await msg(); await shot('ug3-undo'); await diffSnap(s0, 'UG3 undo'); await st4('UG3 undo', ['fork', 'hoe', 'cookie tin']);

    await fresh4('UG4 Robert RENAMES the cookie tin (no move) after the save; Undo');
    await grant(); await logFork(); await remoteEdit('ct', { name: 'biscuit tin' }, 'cookie tin -> biscuit tin');
    s0 = await snapAll(); await undo('UG4'); await msg(); await shot('ug4-undo'); await diffSnap(s0, 'UG4 undo'); await st4('UG4 undo', ['fork', 'biscuit tin', 'cookie tin']);

    await fresh4('UG5 Robert moves the BUTTON JAR out of the Sewing box after Margaret moved the sewing box (Move it -> Pantry shelf); Undo');
    await grant(); await openItem('sewing box'); await btn(/Put it somewhere|Move it/, 1200); await openIn(); await pickIn('Pantry shelf'); await doSave();
    await remoteIn('bj', { t: 'place', name: 'Basement' });
    s0 = await snapAll(); await undo('UG5'); await msg(); await shot('ug5-undo'); await diffSnap(s0, 'UG5 undo'); await st4('UG5 undo', ['sewing box', 'button jar']);

    await fresh4('UG6 Robert moves an UNRELATED item after the save; Undo');
    await grant(); await logFork(); await remoteIn('rc', { t: 'place', name: 'Basement' });
    s0 = await snapAll(); await undo('UG6'); await msg(); await diffSnap(s0, 'UG6 undo'); await st4('UG6 undo', ['fork', 'cookie tin', 'red crate']);

    await fresh4('UG7 my own later save that does not touch the moved box: fork (Cookie tin + t2 KC) Save; Log spoon into Basement; Undo (spoon)');
    await logFork(); await logStart('spoon', 'real_spoon.jpg'); await openIn(); await pickIn('Basement'); await doSave();
    s0 = await snapAll(); await undo('UG7'); await msg(); await diffSnap(s0, 'UG7 undo'); await st4('UG7 undo', ['fork', 'spoon', 'cookie tin']);
    console.log('   undo still visible (for fork)?', await undoCount());
    if (await undoCount()) { s0 = await snapAll(); await undo('UG7 second'); await msg(); await diffSnap(s0, 'UG7 second undo'); }

    await fresh4('UG8 my own later save INTO the moved box: fork (Cookie tin + t2 KC) Save; Log spoon In=Cookie tin; Undo (spoon); then is fork undo offered?');
    await logFork(); await logStart('spoon', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await card('spoon'); await doSave(); await st4('UG8', ['fork', 'spoon']);
    s0 = await snapAll(); await undo('UG8'); await msg(); await shot('ug8-undo'); await diffSnap(s0, 'UG8 undo'); await st4('UG8 undo', ['fork', 'spoon', 'cookie tin']);

    await fresh4('UG9 Move it BASEBALL CARD -> Cookie tin + t2 KC; then (same phone) Move it YEARBOOK -> In Cookie tin; back to baseball card page: Undo?');
    await moveIt('baseball card'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await doSave();
    await moveIt('yearbook 1978'); await openIn(); await pickIn('Cookie tin'); await doSave(); await openItem('baseball card'); console.log('   card page undo?', await undoCount(), (await bodyText()).replace(/\s+/g, ' ').slice(0, 260));
    if (await undoCount()) { s0 = await snapAll(); await undo('UG9'); await msg(); await shot('ug9-undo'); await diffSnap(s0, 'UG9 undo'); await st4('UG9 undo', ['baseball card', 'yearbook 1978', 'cookie tin']); }

    await fresh4('UG10 home Undo strip survives a look at the item page? fork save -> open cookie tin page -> home -> Undo');
    await logFork(); await openItem('cookie tin'); await home(); console.log('   undo on home?', await undoCount()); if (await undoCount()) { s0 = await snapAll(); await undo('UG10'); await msg(); await diffSnap(s0, 'UG10 undo'); await st4('UG10', ['fork', 'cookie tin']); }

    await fresh4('UG11 Save + Next: fork (Cookie tin + t2 KC), knife In Cookie tin (carried), camera Undo of knife; then Undo of fork from home?');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500);
    AI = { name: 'knife' }; await cam('scissors.jpg'); await tap('.lc-shutter', { wait: 2000 }); await card('knife'); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); await st4('UG11', ['fork', 'knife']);
    s0 = await snapAll(); await undo('UG11 camera'); await msg(); await shot('ug11-undo'); await diffSnap(s0, 'UG11 undo'); await st4('UG11 undo', ['fork', 'knife', 'cookie tin']);
    console.log('   another undo?', await undoCount()); await leaveCam(); console.log('   home undo?', await undoCount());
    console.log('   ', errs());
