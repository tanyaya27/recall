    await noAuto(); await openItem('baseball card'); await noAuto();
    await tap('button:has-text("Move it")', { wait: 1000 }); await S('open');
    await shoot('real_desk.jpg', { name: 'kitchen counter', known: 'Kitchen counter', sure: true }, 300); await S('modal');
    await btn(/A different place/); await page.waitForTimeout(1200); await S('choose, after 0.3s answer');
    await pickPlace('Pantry shelf'); await S('before-now'); await shot('f4-before-now');
    console.log(await HTML('.sheet'));
    // tap the Before photo
    const imgs = page.locator('.sheet img').filter({ visible: true }); console.log('imgs', await imgs.count());
    await imgs.nth(1).click().catch(e => console.log('img click fail', e.message)); await page.waitForTimeout(700); await S('viewer?'); await shot('f4-viewer');
    await page.keyboard.press('Escape'); await page.waitForTimeout(500); await S('after esc');
