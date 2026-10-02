    console.log('\n######## P1 explore tiers: Log egg timer, In = Kitchen counter');
    await logStart('egg timer', 'real_spoon.jpg'); await setWords('on the counter in the garage');
    await openIn(); await pickIn('Kitchen counter'); await ui('after In=Kitchen counter'); await shot('p1-in-kc');
    console.log(await HTML('.lc'));
    const add = page.locator('button').filter({ hasText: /What is the .* in\?/ }).filter({ visible: true });
    console.log('   add-tier buttons:', await add.allInnerTexts());
    if (await add.count()) { await add.first().click(); await page.waitForTimeout(900); await ui('tier2 list'); await shot('p1-tier2-list');
      console.log('   SHEET:', await sheetText('.in-list')); }
