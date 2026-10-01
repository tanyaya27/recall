    const closeBy = async (how) => { if (how === 'backdrop') { await page.mouse.click(195, 30); await page.waitForTimeout(150); await page.mouse.click(195, 80); } else if (how === 'esc') await page.keyboard.press('Escape'); else if (how === 'back') await page.evaluate(() => history.back()); await page.waitForTimeout(900); console.log('   closed by', how); };
    for (const how of ['backdrop', 'esc', 'back']) {
      await fresh(`C-${how}: Choose place with answer landed (sure KC), then close by ${how}`);
      await shoot('real_desk.jpg', KCa, 300); await btn(/A different place/); await page.waitForTimeout(1200); await S('choose');
      await closeBy(how); await S('after close'); await shot(`f6-choose-closed-${how}`);
      if (await page.locator('.lc-shutter').count()) { await saveNow(); await S('after save attempt'); console.log('screen:', (await cardText()).slice(0, 200)); }
      else console.log('   camera gone; screen:', (await cardText()).slice(0, 200));
      await store();
    }
    for (const how of ['backdrop', 'esc', 'back']) {
      await fresh(`M-${how}: "This photo is…" closed by ${how}`);
      await shoot('real_desk.jpg', { name: 'x' }, 300); await S('modal');
      await closeBy(how); await S('after close'); await shot(`f6-modal-closed-${how}`);
      if (await page.locator('.lc-shutter').count()) { await shoot('closet.jpg'); await S('shoot again'); }
    }
    await fresh('C-esc with non-match answer "x"'); await shoot('real_desk.jpg', { name: 'x' }, 300); await btn(/A different place/); await page.waitForTimeout(1200); await S('choose');
    await closeBy('esc'); await S('after esc'); await saveNow(); await store();
