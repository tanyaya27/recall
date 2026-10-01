    const PLUS = async () => { await press('.lv-sq.plus'); await page.waitForTimeout(500); };
    const L3 = async () => { await page.locator('.lv-sq[aria-label^="Level 3"]').first().click(); await page.waitForTimeout(500); console.log('   L3 selected?', JSON.stringify(await state())); };
    const L2 = async () => { await page.locator('.lv-sq[aria-label^="Level 2"]').first().click(); await page.waitForTimeout(500); };
    let rowY = null;
    const S = [
      { id: 'D1', desc: 'LOG egg timer: + then shoot L1, sure KC @4.5s; sheet Cancel + Save (unanswered)', mode: 'log', pre: PLUS, answers: [{ ans: KC, delay: 4500 }], steps: [[3500, 'shot', 'sheet'], [5300, 'shot', 'after late']] },
      { id: 'D2', desc: 'LOG: + shoot, never; sheet Cancel + Save', mode: 'log', pre: PLUS, answers: [{ ans: KC, delay: 60000 }], steps: [[3500, 'shot', 'sheet']] },
      { id: 'D3', desc: 'LOG: + shoot, NEW lowercase "hall closet" @0.5s; sheet Cancel + Save', mode: 'log', pre: PLUS, answers: [{ ans: NEW, delay: 500 }], steps: [] },
      { id: 'D4', desc: 'LOG overlap: L1 KC sure @9s; sheet Cancel, +, shoot L2 "garage wall" @0.5s, Use this name for L2 at 6.5s; wait; Save', mode: 'log', pre: PLUS, answers: [{ ans: KC, delay: 9000 }, { ans: { name: 'garage wall' } }],
        steps: [[3700, 'press', '.btn-quiet:has-text("Cancel")'], [4100, 'press', '.lv-sq.plus'], [4500, 'shoot', 500], [6500, 'press', 'button.btn-primary:has-text("Use this name")'], [7000, 'shot', 'L2 named'], [9800, 'shot', 'tier1 late answer arrives on L2'], [9900, 'ui', '']] },
      { id: 'D5', desc: 'MOVE L3 Crawl space (outer, scrolled into view) shot; AI: it is Crawl space, sure, @0.5s', pre: L3, answers: [{ ans: { name: 'crawl space', known: 'Crawl space', sure: true }, delay: 500 }], steps: [[1500, 'shot', 'crawl answer']] },
      { id: 'D6', desc: 'MOVE L2 memorabilia box shot; AI memorabilia box sure @4.5s (late); tap suggestion', pre: L2, answers: [{ ans: { name: 'memorabilia box', known: 'memorabilia box', sure: true }, delay: 4500 }], steps: [[3500, 'shot', 'sheet'], [5300, 'shot', 'late'], [5400, 'press', '.wl-sugg'], [6200, 'shot', 'after sugg']] },
      { id: 'D7', desc: 'MOVE L1: late KC @4.5s lands just as she taps the Desk drawer row where she saw it (list jump)', answers: [{ ans: KC, delay: 4500 }],
        steps: [[3600, 'fn', async () => { const b = await bb('.wl-row:not(.wl-sugg):has-text("Desk drawer")'); rowY = b && (b.y + b.height / 2); console.log('   Desk drawer row centre y before answer', rowY); }],
          [4300, 'fn', async () => { const t = Date.now(); while (Date.now() - t < 2500) { if ((await state()).sug) break; await page.waitForTimeout(20); } await page.mouse.click(200, rowY); console.log(`   tapped y=${rowY} right after the answer @${Date.now() - T0}ms`); }], [5200, 'shot', 'what got picked']] },
      { id: 'D8', desc: 'Cancel camera @1.5s (Throw away? sheet up), answer never; at 3 s does Choose place open over the confirm? then Keep going', answers: [{ ans: KC, delay: 60000 }], steps: [[1500, 'press', '.lc-x'], [3600, 'shot', 'at 3.6s confirm'], [3700, 'ui', ''], [3800, 'press', 'button:has-text("Keep going")'], [4500, 'shot', 'after keep going']] },
      { id: 'D9', desc: 'Throw away during the look, answer KC @2s arrives after', answers: [{ ans: KC, delay: 2000 }], steps: [[1000, 'press', '.lc-x'], [1400, 'press', 'button:has-text("Throw away")'], [3600, 'shot', 'after throw away + answer'], [3700, 'fn', async () => console.log('   page:', (await bodyText()).replace(/\s+/g, ' ').slice(0, 200))]], saveAtEnd: false },
      { id: 'D10', desc: 'MOVE L1 after timeout: hold Save (Save + Next) with "A place"', answers: [{ ans: KC, delay: 60000 }], steps: [[3700, 'press', '.btn-quiet:has-text("Cancel")'], [4200, 'hold', '.lc-k.sv'], [5500, 'shot', 'after hold save'], [5600, 'ui', '']], saveAtEnd: false },
    ];
    const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
    for (const sc of S) if (!only || only.includes(sc.id)) await runScn(sc);
