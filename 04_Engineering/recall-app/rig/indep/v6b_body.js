    let r;
    const shut = async (nm, f = 'real_spoon.jpg') => { AI = { name: nm }; await cam(f); await tap('.lc-shutter', { wait: 2000 }); };
    await fresh4('F1 ordinary 1-tier saves');
    await logStart('spoon', 'real_spoon.jpg'); await openIn(); await pickIn('Kitchen counter'); r = await sv('F1a place'); await st4('F1a', ['spoon']); if (r.open) await leaveCam();
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); r = await sv('F1b box no place'); await st4('F1b', ['fork', 'cookie tin']); if (r.open) await leaveCam();
    await logStart('comb', 'real_spoon.jpg'); await openIn(); await pickIn('Green bag'); await card('green bag'); r = await sv('F1c deep box'); await st4('F1c', ['comb', 'green bag']); if (r.open) await leaveCam();
    await logStart('ring', 'real_spoon.jpg'); await openIn(); await pickIn('Attic'); await card('attic'); r = await sv('F1d place in place'); await st4('F1d', ['ring']); if (r.open) await leaveCam();
    await logStart('note', 'real_spoon.jpg'); await setWords('in the cookie tin'); await page.waitForTimeout(600); await card('words'); r = await sv('F1e words only'); await st4('F1e', ['note', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('F2 ordinary 2-tier saves');
    await logStart('spoon', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Pantry shelf'); r = await sv('F2a box+place'); await st4('F2a', ['spoon', 'cookie tin']); if (r.open) await leaveCam();
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Red crate'); await card('sb in rc'); r = await sv('F2b box+box'); await st4('F2b', ['fork', 'sewing box', 'button jar']); if (r.open) await leaveCam();
    await logStart('lamp', 'real_desk.jpg'); await openIn(); await pickIn('Upstairs hall'); await card('UH'); if (await addTier()) { await pickIn('Basement'); } r = await sv('F2c place+place'); await st4('F2c', ['lamp', 'upstairs hall', 'basement']); if (r.open) await leaveCam();
    await logStart('cup', 'real_spoon.jpg'); await openIn(); await pickIn('Pantry shelf'); await card('PS'); if (await addTier()) { await srchT('Larder'); await tapNew(/New place: Larder/); } r = await sv('F2d place+new place'); await st4('F2d', ['cup']); if (r.open) await leaveCam();

    await fresh4('F3 ordinary 3-tier saves');
    await logStart('peg', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); r = await sv('F3a box>box>place'); await st4('F3a', ['peg', 'cookie tin', 'sewing box', 'button jar']); if (r.open) await leaveCam();
    await logStart('bead', 'real_spoon.jpg'); await openIn(); await pickIn('Button jar'); await card('bj'); r = await sv('F3b into button jar (deep chain)'); await st4('F3b', ['bead']); if (r.open) await leaveCam();
    await logStart('dice', 'real_spoon.jpg'); await openIn(); await pickIn('Red crate'); await addTier(); await pickIn('Upstairs hall'); if (await addTier()) await pickIn('Basement'); r = await sv('F3c box>place>place'); await st4('F3c', ['dice', 'red crate', 'blue bin', 'green bag', 'upstairs hall']); if (r.open) await leaveCam();
    await logStart('tack', 'real_spoon.jpg'); await openIn(); await srchT('Shoebox'); await tapNew(/New box|Shoebox/); await card('new box'); if (await addTier()) { await pickIn('Cookie tin'); } if (await addTier()) { await srchT('Loft'); await tapNew(/New place: Loft/); } r = await sv('F3d new box?>box>new place'); await st4('F3d', ['tack', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('RP re-pick the place an item is already in');
    await mv('baseball card'); await openIn(); await pickIn('Wooden box'); await card('rp1'); r = await sv('RP1 card -> Wooden box (same)'); await st4('RP1', ['baseball card']); if (r.open) await leaveCam();
    await mv('blue bin'); await openIn(); await pickIn('Red crate'); r = await sv('RP2 blue bin -> Red crate (same, holds green bag)'); await st4('RP2', ['blue bin', 'green bag']); if (r.open) await leaveCam();
    await mv('green bag'); await openIn(); await pickIn('Blue bin'); r = await sv('RP3 green bag -> Blue bin (same)'); await st4('RP3', ['green bag']); if (r.open) await leaveCam();
    await mv('spare batteries'); await openIn(); await pickIn('Kitchen counter'); r = await sv('RP4 batteries -> Kitchen counter (same place)'); await st4('RP4', ['spare batteries']); if (r.open) await leaveCam();
    await mv('button jar'); await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await card('rp5'); r = await sv('RP5 button jar -> Sewing box (same) + t2 Pantry shelf'); await st4('RP5', ['button jar', 'sewing box']); if (r.open) await leaveCam();
    await mv('memorabilia box'); await openIn(); await card('rp6 start'); const hasCS = await listHas('Crawl space'); console.log('   offers Crawl space?', hasCS); if (hasCS) { await pickIn('Crawl space'); r = await sv('RP6 memorabilia -> Crawl space (same, edge-only place)'); await st4('RP6', ['memorabilia box', 'baseball card']); if (r.open) await leaveCam(); } else { await cancelList(); await leaveCam(); }
    console.log('-- RP7 log a new thing, then Move it it to the same box it went into');
    await logStart('thimble', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await sv('RP7 log'); if (await camOpen()) await leaveCam();
    await mv('thimble'); await openIn(); await pickIn('Cookie tin'); await card('rp7'); r = await sv('RP7 thimble -> Cookie tin (same)'); await st4('RP7', ['thimble', 'cookie tin']); if (r.open) await leaveCam();
    await mv('cookie tin'); await openIn(); await pickIn('Kitchen counter'); r = await sv('RP8 cookie tin -> Kitchen counter (same, holds thimble)'); await st4('RP8', ['thimble', 'cookie tin']); if (r.open) await leaveCam();

    await fresh4('MV Move it on a box that holds things');
    await mv('red crate'); await openIn(); await pickIn('Pantry shelf'); r = await sv('MV1 red crate (blue bin>green bag) -> Pantry shelf'); await st4('MV1', ['green bag', 'red crate']); if (r.open) await leaveCam();
    await mv('sewing box'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); r = await sv('MV2 sewing box -> Cookie tin + t2 KC'); await st4('MV2', ['button jar', 'sewing box']); if (r.open) await leaveCam();
    await mv('blue bin'); await openIn(); await pickIn('Button jar'); await card('mv3'); r = await sv('MV3 blue bin (holds green bag) -> Button jar (deep)'); await st4('MV3', ['green bag', 'blue bin']); if (r.open) await leaveCam();
    await mv('memorabilia box'); await openIn(); await pickIn('Linen closet'); r = await sv('MV4 memorabilia (wooden box>card) -> Linen closet'); await st4('MV4', ['baseball card', 'memorabilia box']); if (r.open) await leaveCam();
    await mv('wooden box'); await openIn(); await pickIn('Red crate'); r = await sv('MV5 wooden box -> Red crate (sibling chain)'); await st4('MV5', ['baseball card']); if (r.open) await leaveCam();
    await mv('red crate'); await openIn(); await pickIn('Tote bin'); await card('mv6'); r = await sv('MV6 red crate (holds blue bin, green bag... wait blue bin moved) -> Tote bin'); await st4('MV6', ['red crate', 'wooden box', 'baseball card']); if (r.open) await leaveCam();

    await fresh4('SN Save + Next');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await svNext('SN1 item1 sb+PS'); await st4('SN1', ['fork', 'sewing box']);
    await shut('knife'); await openIn(); await pickIn('Cookie tin'); await addTier(); await card('sn2'); await pickIn('Sewing box'); await card('sn2 t2'); await svNext('SN2 item2 ct + t2 sewing box (just placed by item1)'); await st4('SN2', ['knife', 'cookie tin', 'sewing box']);
    await shut('spoon'); await card('sn3 carried'); await svNext('SN3 item3 carried In'); await st4('SN3', ['spoon']);
    await shut('ladle'); await openIn(); await pickIn('Red crate'); await addTier(); await pickIn('Cookie tin'); await card('sn4'); r = await sv('SN4 item4 Red crate + t2 Cookie tin (placed by item2)'); await st4('SN4', ['ladle', 'red crate', 'cookie tin']); if (r.open) await leaveCam();
    await fresh4('SNU Save + Next, camera Undo, then reuse the same box with a new place');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await svNext('SNU item1');
    if (await undoCount()) { S0 = await snapAll(); await undo('SNU camera undo'); await msg(); await diffSnap(S0, 'SNU undo'); }
    await st4('SNU after undo', ['fork', 'cookie tin']); if (!(await camOpen())) console.log('   camera closed after undo');
    else { await shut('knife'); await card('snu item2'); await openIn(); await pickIn('Cookie tin'); await card('snu ct'); if (await addTier()) await pickIn('Pantry shelf'); await card('snu t2'); r = await sv('SNU item2 Cookie tin + t2 Pantry shelf'); await st4('SNU', ['knife', 'cookie tin']); if (r.open) await leaveCam(); }
    await fresh4('SNM Save + Next where item1 moved the box item2 tiers again');
    await logStart('fork', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Kitchen counter'); await svNext('SNM item1');
    await shut('knife'); await openIn(); await pickIn('Blue bin'); await card('snm'); await svNext('SNM item2 blue bin'); await st4('SNM', ['knife', 'blue bin']);
    await shut('spoon'); await openIn(); await pickIn('Sewing box'); await addTier(); await pickIn('Cookie tin'); await card('snm3'); r = await sv('SNM item3 sb + t2 Cookie tin'); await st4('SNM3', ['spoon', 'sewing box', 'cookie tin']); if (r.open) await leaveCam();
    console.log('   ', errs()); summary();
