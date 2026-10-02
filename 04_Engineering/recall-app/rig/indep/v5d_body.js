    const ls = async (nm) => { const d = await itemDoc(nm); return d ? `${nm}: lastSeen=${d.lastSeenAt} loc=${JSON.stringify(d.location)} needsPlace=${d.needsPlace}` : nm + ' MISSING'; };
    let s0;
    await grant();
    await fresh4('LP7 place already inside a box, same phone: Robert had put Basement INTO Cookie tin earlier. Log lamp, In=Cookie tin; + list offers Basement?');
    await remoteIn('pB', T_('ct', 'cookie tin'));
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await card('In');
    if (await addTier()) { const has = await listHas('Basement'); console.log('   t2 offers Basement (inside the In)?', has); await srchT('basem'); if (has) { await pickIn('Basement'); await card('LOOP7'); await shot('lp7-card'); s0 = await snapAll(); await doSave(); await shot('lp7-after'); await msg(); await diffSnap(s0, 'LP7 save'); await st4('LP7', ['lamp', 'cookie tin', 'basement']); } else await cancelList(); }
    if (await camOpen()) await leaveCam();
    console.log('-- LP8 Put cookie tin somewhere: In list offers Basement (a place inside it)?');
    await openItem('cookie tin'); await btn(/Put it somewhere|Move it/, 1200); await openIn(); const h8 = await listHas('Basement'); console.log('   In list offers Basement?', h8); await srchT('basem');
    if (h8) { await pickIn('Basement'); await card('LOOP8'); await shot('lp8-card'); s0 = await snapAll(); await doSave(); await shot('lp8-after'); await msg(); await diffSnap(s0, 'LP8 save'); await st4('LP8', ['cookie tin', 'basement']); } else { await cancelList(); await leaveCam(); }
    console.log('-- LP9 Basement page: its own Move/Put: list offers Cookie tin? (Basement is in it) / place page view');
    await page.evaluate(() => 0);

    await fresh4('LP3c again: Log lamp, In=Cookie tin + t2 Basement; Robert puts Basement INTO Cookie tin; Save');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Basement');
    await remoteIn('pB', T_('ct', 'cookie tin')); await card('after remote'); await shot('lp3c-card');
    s0 = await snapAll(); await doSave(); await shot('lp3c-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP3c save'); await st4('LP3c', ['lamp', 'cookie tin', 'basement']);
    if (await camOpen()) await leaveCam(); else { await openItem('cookie tin'); await shot('lp3c-cookie-page'); console.log('   cookie tin page:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 300)); }

    await fresh4('LP3d: Log lamp, In=Upstairs hall + t2 Basement; Robert puts Basement INTO Attic; Save');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Upstairs hall'); await addTier(); await pickIn('Basement');
    await remoteIn('pB', { t: 'place', name: 'Attic' }); await card('after remote');
    s0 = await snapAll(); await doSave(); await shot('lp3d-after-save'); await msg(); console.log('   camera open?', await camOpen()); await diffSnap(s0, 'LP3d save'); await st4('LP3d', ['lamp', 'upstairs hall', 'basement']);
    if (await camOpen()) await leaveCam();

    await fresh4('UG3 new place at a tier, Robert logs a hoe into it, Margaret Undo');
    await grant(); await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await srchT('Shed'); await tapNew(/New place: Shed/); await doSave();
    await remoteNew('rhoe', 'hoe', { t: 'place', name: 'Shed' });
    s0 = await snapAll(); await undo('UG3'); await msg(); await shot('ug3-undo'); await diffSnap(s0, 'UG3 undo'); await st4('UG3 undo', ['hoe', 'cookie tin']);
    await pageWords('hoe', 'ug3-hoe-page');
    console.log('-- UG3b In-level new place: Log rake, words "in the potting shed", In = New place Potting shed; Save; Robert puts TIN BOX into Potting shed; Undo');
    await logStart('rake', 'real_desk.jpg'); await setWords('in the potting shed'); await openIn(); await tapNew(/New place: Potting shed/); await doSave(); await st4('UG3b', ['rake']);
    await remoteIn('bx1', { t: 'place', name: 'Potting shed' });
    s0 = await snapAll(); await undo('UG3b'); await msg(); await shot('ug3b-undo'); await diffSnap(s0, 'UG3b undo'); await st4('UG3b undo', ['tin box', 'rake']);
    await pageWords('tin box', 'ug3b-tinbox-page');

    await fresh4('N4 lastSeen: Log peg, In=Cookie tin + t2 Sewing box + t3 Pantry shelf; Save; Undo');
    console.log('   BEFORE', await ls('cookie tin'), '|', await ls('sewing box'));
    await logStart('peg', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await doSave();
    console.log('   AFTER SAVE', await ls('cookie tin'), '|', await ls('sewing box')); await undo('N4'); await msg(); console.log('   AFTER UNDO', await ls('cookie tin'), '|', await ls('sewing box')); await st4('N4 undo', ['cookie tin', 'sewing box']);
    await fresh4('N5 save path: In=Cookie tin + t2 New place Larder; t3 search Larder; pick Pantry shelf; Save; Undo');
    await logStart('sieve', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await srchT('Larder'); await tapNew(/New place: Larder/); await addTier(); await srchT('Larder'); await srchT('larder '); await srchT('Pantry'); await pickIn('Pantry shelf'); await doSave(); await st4('N5', ['sieve', 'cookie tin']); await undo('N5'); await st4('N5 undo', ['cookie tin', 'larder']);
    console.log('   ', errs());
