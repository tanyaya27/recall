    const ANS = JSON.parse(process.env.ANS || '{"name":"kitchen counter","known":"Kitchen counter","sure":true}');
    const DELAYS = (process.env.DELAYS || '500,2900,3100,4500,9000,60000').split(',').map(Number);
    for (const d of DELAYS) {
      await seedHouse(); await page.evaluate(() => window.__rig.rules(true)); await snapBase();
      console.log(`\n##### TRIAL ${process.env.LABEL} delay=${d} ans=${JSON.stringify(ANS)}`);
      await moveStart('baseball card');
      if (process.env.LEVEL) await sel(process.env.LEVEL);
      if (process.env.PLUS) { await press('.lv-sq.plus'); await page.waitForTimeout(500); }
      console.log('before:', JSON.stringify(await state()));
      WHERE.push({ ...ANS }); NEXT_WHERE_DELAY = d; if (process.env.BAD) NEXT_WHERE_BADJSON = true;
      await cam('real_desk.jpg'); await shutter();
      await at(2600); if (d >= 2900) await shot(`${process.env.LABEL}-d${d}-2.6s`);
      await at(3400); await shot(`${process.env.LABEL}-d${d}-3.4s`);
      await at(Math.min(d, 12000) + 1500); await shot(`${process.env.LABEL}-d${d}-after`);
      console.log('reqTimes', reqTimes, 'pool', lastPoolNames.join('/'));
      // close whatever is open with its Cancel (sheet) then save
      if ((await state()).sheet) { await press('.btn-quiet:has-text("Cancel")'); await page.waitForTimeout(500); console.log('after sheet Cancel:', JSON.stringify(await state())); await shot(`${process.env.LABEL}-d${d}-sheetcancel`); }
      const s = await state(); if (s.dis[2] === 'e') { await save(); console.log('saved; text:', (await bodyText()).slice(0, 200).replace(/\s+/g, ' ')); } else console.log('SAVE DISABLED at end; state', JSON.stringify(s));
      await storeDiff('baseball card');
    }
