    // sticky + marks on L1, L2, L3
    await fresh('K1 sticky on L1, then tap L2, L3, +, L1');
    await shoot('real_desk.jpg'); await btn(/Another photo of the Wooden box/, 1200); await S('L1 add#1');
    await shoot('closet.jpg'); await S('L1 shot#2 (no ask expected)'); await shoot('box.jpg'); await S('L1 shot#3');
    await sel(2); await S('tap L2'); if (await page.locator('.sheet-row').count()) { await btn(/^Close$/); } await S('L2 selected');
    await shoot('drawer.jpg'); await S('L2 shot -> ask?'); await shot('f7-L2-ask');
    await btn(/Another photo of the Memorabilia box/i, 1200); await S('L2 add#1'); await shot('f7-L2-added');
    await shoot('book.jpg'); await S('L2 shot#2');
    await sel(3); await S('tap L3'); if (await page.locator('.sheet-row').count()) { console.log(await page.evaluate(() => document.querySelector('.sheet').innerText)); await btn(/^Close$/); }
    await shoot('real_painting.jpg'); await S('L3 shot -> ask?'); await shot('f7-L3-ask');
    console.log(await page.evaluate(() => (document.querySelector('.photo-for') || {}).innerText));
    await btn(/Another photo of the Crawl space/i, 1200); await S('L3 add#1'); await shot('f7-L3-added');
    await sel(1); await S('back to L1'); if (await page.locator('.sheet-row').count()) { console.log(await page.evaluate(() => document.querySelector('.sheet').innerText)); await btn(/^Close$/); } await S('L1 after close');
    await shoot('closet.jpg'); await S('L1 shot after re-tap -> ask?');
    await btn(/Retake/); await S('after Retake');
    await saveNow(); console.log('screen:', await cardText()); await shot('f7-K1-saved'); await store();
    const pl = await page.evaluate(() => window.__rig.dump().filter(x => (x.kind === 'place' || x.holds) && /crawl|wooden|memorab/i.test(x.name)).map(x => ({ k: x.kind, n: x.name, photos: (x.photos || []).length, pc: x.photoCount, id: x.id })));
    console.log('PHOTO DOCS', JSON.stringify(pl));
    const ph = await page.evaluate(() => window.__rig.dump().filter(x => x.kind === 'photo' || x.kind === 'placePhoto').map(x => `${x.kind}:${x.of || x.thing || x.place || x.parent}`).join(', '));
    console.log('photo kinds:', ph || '(none)'); console.log('kinds:', await page.evaluate(() => [...new Set(window.__rig.dump().map(x => x.kind))].join(',')));
