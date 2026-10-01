    const S = [
      { id: 'F1', desc: 'timeout; she types "Attic trunk" + Use this name by ~5s; sure KC answer lands @7s', answers: [{ ans: KC, delay: 7000 }], steps: [[3400, 'type', 'Attic trunk'], [5200, 'press', 'button.btn-primary:has-text("Use this name")'], [6000, 'shot', 'named'], [7800, 'shot', 'after late KC'], [7900, 'ui', '']] },
      { id: 'F5', desc: 'timeout; she types "Attic trunk" (answer NEW lands mid-typing @4.5s) then taps the sheet Cancel instead of Use this name', answers: [{ ans: NEW, delay: 4500 }], steps: [[3400, 'type', 'Attic trunk'], [5300, 'press', '.btn-quiet:has-text("Cancel")'], [5900, 'shot', 'after cancel']] },
      { id: 'F6', desc: 'timeout; she picks Desk drawer @3.5s; sure KC lands @7s', answers: [{ ans: KC, delay: 7000 }], steps: [[3500, 'pick', 'Desk drawer'], [7800, 'shot', 'after late KC']] },
    ];
    for (const sc of S) await runScn(sc);
    // F4: two unnamed saves -> how many "A place"?
    await seedHouse(); await page.evaluate(() => window.__rig.rules(true));
    for (const it of ['baseball card', 'yearbook 1978']) { await moveStart(it); WHERE.push(KC); NEXT_WHERE_DELAY = 60000; await cam('real_desk.jpg'); await shutter(); await at(3600); await press('.btn-quiet:has-text("Cancel")'); await page.waitForTimeout(400); await save(); }
    console.log('F4 places:', await places()); console.log('F4 chains', await chainOf('baseball card'), '|', await chainOf('yearbook 1978'));
    await page.evaluate(() => { location.hash = ''; }); await home(); await page.waitForTimeout(500); await shot('F4-home');
