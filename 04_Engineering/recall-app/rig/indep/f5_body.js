    // S1: Cancel after answer lands
    await fresh('S1 L1 different, answer 0.3s, Cancel'); await S('start');
    await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/); await page.waitForTimeout(1500); await S('choose');
    await cancelChoose(); const s1 = await S('after Cancel'); await shot('f5-S1-after-cancel');
    await shoot('closet.jpg'); await S('shoot again'); await shot('f5-S1-shoot-again');
    await btn(/Retake/); await S('after Retake');
    await store();
    // S2: Cancel before answer lands; answer lands after
    await fresh('S2 Cancel at 1s, answer at 3s'); await shoot('real_desk.jpg', KCa, 3000); await btn(/A different place/); await S('choose looking');
    await cancelChoose(); await S('after Cancel (before answer)'); await page.waitForTimeout(3000); await S('after late answer'); await shot('f5-S2-late-answer-after-cancel');
    await saveNow(); await S('after Save'); await store();
    // S3: Pick + Use before the answer lands; then the answer lands
    await fresh('S3 pick Pantry + Use, answer at 4s'); await shoot('real_desk.jpg', KCa, 4000); await btn(/A different place/);
    await pickPlace('Pantry shelf'); await btn(/Use the Pantry shelf/); await S('after Use'); await page.waitForTimeout(4000); await S('after late answer'); await shot('f5-S3-after-use-late');
    await saveNow(); console.log('screen:', await cardText()); await shot('f5-S3-saved'); await store();
    // S4: type while the answer lands
    await fresh('S4 type while answer lands at 1.5s'); await shoot('real_desk.jpg', KCa, 1500); await btn(/A different place/, 200);
    await page.locator('input.place-input').first().click(); await page.keyboard.type('Attic trunk', { delay: 180 }); await S('typed');
    await btn(/Use this name/); await S('after Use this name'); await shot('f5-S4-bn-new');
    console.log(await page.evaluate(() => (document.querySelector('.bn') || {}).innerText));
    await btn(/^Use the/); await S('after Use'); await saveNow(); console.log('screen:', await cardText()); await store();
    // S5: an existing name, odd case/spaces
    await fresh('S5 type existing name " kitchen  COUNTER "'); await shoot('real_desk.jpg', { name: 'x' }, 300); await btn(/A different place/, 600);
    await page.locator('input.place-input').first().fill(' kitchen  COUNTER '); await page.waitForTimeout(400); await S('typed'); await shot('f5-S5-typed');
    await btn(/Use this name/); await S('after Use this name'); await shot('f5-S5-after-use-name');
    console.log(await page.evaluate(() => (document.querySelector('.bn') || {}).innerText));
    await btn(/^Use the/); await saveNow(); await store();
