    await fresh4('L1 loop: Move it SEWING BOX, In=Cookie tin, tier2 = Button jar (inside the item) / Sewing box (the item)');
    await openItem('sewing box'); console.log('   sewing box page:', (await bodyText()).replace(/\s+/g, ' ').slice(-400));
    console.log('-- L1b Move it BLUE BIN (in Red crate, nothing above): In preset Red crate; t2 = Green bag (inside item) / Blue bin (item)');
    await moveIt('blue bin'); await card('start'); await addTier(); console.log('   t2 offers green bag', await listHas('Green bag'), 'blue(item)', await listHas('Blue bin'), 'red(self)', await listHas('Red crate')); await srchT('green'); await srchT('blue'); await srchT('');
    if (await listHas('Green bag')) { await pickIn('Green bag'); await card('LOOP'); await shot('l1-loop'); await doSave(); await st4('L1', ['blue bin', 'green bag', 'red crate']); } else await cancelList();
    console.log('-- L1c same, but change the In to Cookie tin; t2 = Green bag / Blue bin');
    await leaveCam().catch(() => {}); await moveIt('blue bin'); await openIn(); console.log('   In list offers green bag (inside item)?', await listHas('Green bag'), 'blue?', await listHas('Blue bin')); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers green bag', await listHas('Green bag'), 'blue(item)', await listHas('Blue bin'), 'red crate', await listHas('Red crate')); await srchT('green'); await srchT('');
    if (await listHas('Green bag')) { await pickIn('Green bag'); await card('LOOP c'); await doSave(); await st4('L1c', ['blue bin', 'green bag']); } else { await pickIn('Red crate'); await card('t2 red crate (blue bin\'s old box)'); await shot('l1c'); await doSave(); await st4('L1c', ['blue bin', 'green bag', 'cookie tin', 'red crate']); await undo('L1c'); await st4('L1c undo', ['blue bin', 'green bag', 'cookie tin', 'red crate']); }

    await fresh4('L2 loop: Log, In=Red crate? no: In = Blue bin has above. Move it RED CRATE, In=Cookie tin, t2=Blue bin/Green bag (inside item)');
    await moveIt('red crate'); await openIn(); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers blue', await listHas('Blue bin'), 'green', await listHas('Green bag'));
    await srchT('green'); await srchT('blue'); await srchT(''); await cancelList();
    // tier3 loop: In cookie tin, t2 sewing box, t3 = ? (red crate ok); Move it on GREEN BAG? green bag has above.
    console.log('\n######## L3 box inside the In: Log, In=Red crate? has nothing above; t2 = Blue bin (inside the In) / Green bag');
    await leaveCam().catch(() => {}); await fresh4('L3'); await logStart('thimble', 'real_spoon.jpg'); await openIn(); await pickIn('Red crate'); await card('In red crate');
    await addTier(); console.log('   t2 offers blue (inside In)', await listHas('Blue bin'), 'green (2 deep)', await listHas('Green bag'), 'cookie', await listHas('Cookie tin')); await srchT('blue'); await srchT('green'); await srchT('');
    if (await listHas('Blue bin')) { await pickIn('Blue bin'); await card('LOOP3'); await shot('l3-loop'); await doSave(); await st4('L3', ['thimble', 'red crate', 'blue bin']); } else { await pickIn('Cookie tin'); await addTier(); console.log('   t3 offers blue', await listHas('Blue bin'), 'green', await listHas('Green bag'), 'red', await listHas('Red crate')); await srchT('green'); await srchT(''); await cancelList(); await leaveCam(); }

    await fresh4('L4 place loop: In=Cookie tin, t2=Upstairs hall? (Attic is in it) t3 = Attic (below in the chain)');
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); console.log('   t2 offers Upstairs', await listHas('Upstairs hall'), 'Attic(has above)', await listHas('Attic'));
    await pickIn('Upstairs hall'); await card('t2 upstairs'); await addTier(); console.log('   t3 offers Attic (inside Upstairs)', await listHas('Attic'), 'Upstairs', await listHas('Upstairs hall'), 'boxes? sewing', await listHas('Sewing box')); await srchT('attic'); await srchT('sewing'); await srchT('upstairs'); await srchT('');
    if (await listHas('Attic')) { await pickIn('Attic'); await card('PLACE LOOP'); await shot('l4-loop'); await doSave(); await st4('L4', ['lamp', 'attic', 'upstairs hall']); } else { await cancelList(); await leaveCam(); }

    await fresh4('L5 In = Attic (has saved Upstairs above): read-only chain, no +');
    await logStart('fan', 'real_desk.jpg'); await openIn(); await pickIn('Attic'); await card('In attic'); await shot('l5-attic'); await leaveCam();
    console.log('   ', errs());
