    await logStart('egg timer', 'real_spoon.jpg'); await setWords('under the stairs'); await doSave(); await openItem('egg timer'); await tap('button:has-text("Put it in a place or a box")', { wait: 1000 }); await srch('pass: hunter2', 'b-putin-search'); await srch('PIN4821'); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await allPlaces();

    console.log('\n######## C Write it down');
    await wid('drill'); await widElse('In the shoebox under the bed'); await wsave(); await raw('drill'); await allPlaces();
    await wid('saw'); await widElse('pantry SHELF'); await wsave(); await raw('saw');
    await wid('nails'); await widElse('  craft NOOK  '); await wsave(); await raw('nails');
    await wid('screws'); await widElse('Tin box'); await wsave(); await raw('screws');
    await wid('fan'); await widPick(); await srchW('Attic'); await page.locator('button').filter({ hasText: /New place: Attic/ }).first().click(); await page.waitForTimeout(700); await shot('c-attic'); await wsave(); await raw('fan'); await allPlaces();
    console.log('   ', errs());
