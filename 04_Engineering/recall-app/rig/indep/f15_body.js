    await fresh('O5 first look late (4s, KC) -> Cancel -> 2nd shot look (0.3s, zz)');
    WHERE.push(KCa, { name: 'zz' }); NEXT_WHERE_DELAY = 4000; await cam('real_desk.jpg'); await shutter(); await page.waitForTimeout(700);
    await btn(/A different place/, 500); await cancelChoose();
    await shoot('closet.jpg'); await btn(/A different place/, 800); await S('2nd choose @~1s'); await page.waitForTimeout(4500); await S('2nd choose after 1st late answer'); await shot('f15-two-looks');
    console.log('reqTimes', reqTimes.join(','));
    await cancelChoose(); await saveNow(); await store();
    await fresh('O6 garbled -> Cancel -> Save'); NEXT_WHERE_BADJSON = true; await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/, 1500); await S('choose'); await cancelChoose(); await S('after cancel'); await saveNow(); await store();
    await shoot('closet.jpg', { name: 'zz' }, 300); await S('next shot asks?');
