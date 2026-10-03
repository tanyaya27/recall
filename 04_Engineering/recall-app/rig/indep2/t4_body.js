    await fresh4('L3u Log thimble In=Red crate, t2=Cookie tin, t3=Green bag (inside the In) -> Save -> Home Undo');
    await logStart('thimble', 'real_spoon.jpg'); await openIn(); await pickIn('Red crate'); await addTier(); await pickIn('Cookie tin'); await addTier(); await pickIn('Green bag'); await doSave(); await shot('l3u-home');
    await st4('L3u', ['thimble', 'red crate', 'cookie tin']); await undo('L3u'); await st4('L3u undo', ['red crate', 'cookie tin', 'green bag']); await raw('cookie tin');

    await fresh4('N1 new places at every tier: Log, words "in the bread bin", In=New place; t2 New place Larder; t3 New place Cellar; Save; Undo');
    await logStart('whisk', 'real_spoon.jpg'); await setWords('in the bread bin'); await openIn(); await tapNew(/New place/); await card('In new');
    await addTier(); await srchT('Larder'); await tapNew(/New place: Larder/); await card('t2 new');
    await addTier(); await srchT('larder'); await srchT('bread bin'); await srchT('Cellar'); await tapNew(/New place: Cellar/); await card('t3 new'); await shot('n1-card');
    await doSave(); await st4('N1', ['whisk', 'bread bin', 'larder']); await raw('whisk');
    await undo('N1'); await st4('N1 undo', ['bread bin', 'larder', 'cellar']);

    await fresh4('N2 same name twice: In=Cookie tin, t2 New place "Attic shelf", t3 search "attic shelf" / "Attic Shelf " / "ATTIC SHELF"');
    await logStart('trowel', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await srchT('Attic shelf'); await tapNew(/New place: Attic shelf/); await addTier();
    for (const q of ['attic shelf', 'Attic Shelf ', 'ATTIC SHELF', ' attic  shelf', 'Attic shelf.']) await srchT(q);
    const hasNew = (await listNames()).find(x => /New place/.test(x)); if (hasNew) { await tapNew(/New place/); await card('dup'); await shot('n2-dup'); await doSave(); await st4('N2', ['trowel', 'cookie tin']); } else { await srchT('Pantry shelf'); await pickIn('Pantry shelf'); await doSave(); await st4('N2b', ['trowel', 'cookie tin', 'attic shelf']); }
    console.log('-- N3 In = New place "Bread bin" then t2 search "bread bin" (same name as In)');
    await logStart('scoop', 'real_spoon.jpg'); await setWords('in the bread bin'); await openIn(); await tapNew(/New place: Bread bin/); await addTier(); await srchT('bread bin'); await srchT('Bread Bin'); 
    const hn = (await listNames()).find(x => /New place/.test(x)); if (hn) { await tapNew(/New place/); await card('dup In'); await shot('n3-dup'); await doSave(); await st4('N3', ['scoop']); } else { await cancelList(); await leaveCam(); }

    await fresh4('X1 x on the MIDDLE row: In=Cookie tin, t2=Sewing box? (has jar inside, fine), t3=Red crate; x on t2');
    await logStart('tape', 'real_pencil.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Kitchen counter'); await card('3 tiers');
    await tierX(1); await card('after x middle'); await shot('x1-after-x');
    await doSave(); await st4('X1', ['tape', 'cookie tin', 'sewing box']); await undo('X1'); await st4('X1 undo', ['cookie tin', 'sewing box']);
    console.log('-- X2 x on the In with 2 tiers');
    await logStart('tape2', 'real_pencil.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await tierX(0); await card('after x In'); await openIn(); await pickIn('Red crate'); await card('In red crate'); await doSave(); await st4('X2', ['tape2', 'red crate', 'cookie tin']);

    await fresh4('C1 change the In after tiers: In=Cookie tin, t2=Sewing box(box), t3=Kitchen counter; change In -> Kitchen counter (a place)');
    await logStart('cup', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Sewing box'); await addTier(); await pickIn('Pantry shelf'); await card('3');
    await openIn(); await pickIn('Kitchen counter'); await card('In -> KC'); await shot('c1-changed'); await doSave(); await st4('C1', ['cup', 'kitchen counter', 'cookie tin', 'sewing box']);
    console.log('-- C2 In=Cookie tin + t2 Pantry shelf; change In to Wooden box (has saved above)');
    await logStart('mug', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Pantry shelf'); await openIn(); await pickIn('Wooden box'); await card('In -> wooden'); await shot('c2'); await doSave(); await st4('C2', ['mug', 'wooden box', 'cookie tin']);
    console.log('-- C3 In=Kitchen counter + t2 Linen closet; change In to Sewing box (box)');
    await logStart('jug', 'real_spoon.jpg'); await openIn(); await pickIn('Kitchen counter'); await addTier(); await pickIn('Linen closet'); await openIn(); await pickIn('Sewing box'); await card('In -> sewing'); await doSave(); await st4('C3', ['jug', 'sewing box', 'kitchen counter']);
    console.log('-- C4 wooden box (has above) as t2: In=Cookie tin, t2=Wooden box -> + offered?');
    await logStart('dish', 'real_spoon.jpg'); await openIn(); await pickIn('Cookie tin'); await addTier(); await pickIn('Wooden box'); await card('t2 wooden'); await shot('c4'); await doSave(); await st4('C4', ['dish', 'cookie tin', 'wooden box']); await undo('C4'); await st4('C4 undo', ['cookie tin', 'wooden box']);
    console.log('   ', errs());
