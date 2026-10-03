    await fresh4('L1c detail: Move it BLUE BIN; In -> Cookie tin; t2 = Green bag (inside the item)');
    await moveIt('blue bin'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Green bag'); await card('LOOP c'); await shot('l1c-loop-card');
    await doSave(); await shot('l1c-after-save'); console.log('   page:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 500), '| undo', await undoCount());
    await raw('blue bin'); await raw('cookie tin'); await st4('L1c', ['blue bin', 'green bag', 'cookie tin']);
    if (await undoCount()) { await undo('L1c'); await shot('l1c-undo'); await st4('L1c undo', ['blue bin', 'green bag', 'cookie tin']); }
    console.log('-- L1d: Log new item, In=Cookie tin, t2 = Sewing box, t3 = Button jar? (inside t2) and Move it BUTTON JAR In=Cookie tin t2=Sewing box (button jar\'s own box = above item)');
    await logStart('pin cushion', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); console.log('   t3 offers button jar', await listHas('Button jar')); await cancelList(); await leaveCam();
    await openItem('button jar'); console.log('   button jar page:', (await bodyText()).replace(/\s+/g, ' ').slice(-300)); await moveIt('button jar'); await card('bj start'); await openIn(); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers sewing (item\'s current box)', await listHas('Sewing box'));
    if (await listHas('Sewing box')) { await pickIn('Sewing box'); await card('bj'); await doSave(); await st4('L1d', ['button jar', 'cookie tin', 'sewing box']); if (await undoCount()) { await undo('L1d'); await st4('L1d undo', ['button jar', 'cookie tin', 'sewing box']); } } else { await cancelList(); await leaveCam(); }

    await fresh4('L2 RED CRATE "Put it somewhere": camera? In=Cookie tin, t2 = Blue bin / Green bag (inside the item)');
    await openItem('red crate'); await btn(/Put it somewhere/, 1200); await card('put'); console.log('   cam?', await page.locator('.lc-shutter').count(), (await bodyText()).replace(/\s+/g, ' ').slice(-300));
    if (await page.locator('.lc-shutter').count()) { await openIn(); console.log('   In offers blue/green', await listHas('Blue bin'), await listHas('Green bag')); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers blue', await listHas('Blue bin'), 'green', await listHas('Green bag')); if (await listHas('Blue bin')) { await pickIn('Blue bin'); await card('L2 loop'); await shot('l2-loop'); await doSave(); await st4('L2', ['red crate', 'cookie tin', 'blue bin']); } else { await cancelList(); await leaveCam(); } }
    else await page.keyboard.press('Escape');

    await fresh4('L3 Log thimble, In=Red crate, t2 = Blue bin (inside the In)?, t3 = Green bag?');
    await logStart('thimble', 'real_spoon.jpg'); await openIn(); await pickIn('Red crate'); await addTier(); console.log('   t2 offers blue (inside In)', await listHas('Blue bin'), 'green', await listHas('Green bag'));
    await pickIn('Cookie tin'); await addTier(); console.log('   t3 offers blue', await listHas('Blue bin'), 'green', await listHas('Green bag'), 'red', await listHas('Red crate')); await srchT('green'); await srchT('blue'); await srchT('red'); await srchT('');
    if (await listHas('Green bag')) { await pickIn('Green bag'); await card('L3 loop'); await shot('l3-loop'); await doSave(); await st4('L3', ['thimble', 'red crate', 'cookie tin', 'green bag']); } else { await cancelList(); await leaveCam(); }

    await fresh4('L4 place loop: Log lamp, In=Cookie tin, t2=Upstairs hall, t3=Attic (in Upstairs hall)');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers Upstairs', await listHas('Upstairs hall'), 'Attic', await listHas('Attic'));
    await pickIn('Upstairs hall'); await addTier(); console.log('   t3 offers Attic (inside Upstairs)', await listHas('Attic'), 'boxes? sewing', await listHas('Sewing box'), 'KC', await listHas('Kitchen counter')); await srchT('attic'); await srchT('upstairs'); await srchT('sewing'); await srchT('');
    if (await listHas('Attic')) { await pickIn('Attic'); await card('PLACE LOOP'); await shot('l4-loop'); await doSave(); await st4('L4', ['lamp', 'attic', 'upstairs hall']); } else { await cancelList(); await leaveCam(); }
    console.log('-- L4b In=Attic (has Upstairs above): read-only');
    await logStart('fan', 'real_desk.jpg'); await openIn(); await pickIn('Attic'); await card('In attic'); await shot('l4b-attic');
    console.log('-- L4c In=Upstairs hall, t2 = Attic? (Attic is in Upstairs)'); await openIn(); await pickIn('Upstairs hall'); await card('In upstairs'); await addTier(); console.log('   t2 offers Attic', await listHas('Attic'));
    if (await listHas('Attic')) { await pickIn('Attic'); await card('L4c loop'); await doSave(); await st4('L4c', ['fan', 'attic', 'upstairs hall']); } else { await cancelList(); await leaveCam(); }
    console.log('   ', errs());
