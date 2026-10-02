    const moveIt = async (nm) => { await openItem(nm); await tap('button:has-text("Move it")', { wait: 1200 }); };
    const geo = async (label) => { const r = await page.evaluate(() => { const H = innerHeight, W = innerWidth; const kb = document.getElementById('__kbv'); const kbTop = kb ? kb.getBoundingClientRect().top : H;
      const sels = ['.lc-top', '.w1-prompt', '.w1-words input', '.w1-mic', '.w1-in', '.w1-in-open', '.w1-in .x', '.lc-x', '.lc-shutter', '.lc-k.sv', '.lc-card', 'button:is(.o)', '.w1-last, .w1 .last'];
      const out = []; const rects = {};
      for (const s of sels) { const e = document.querySelector(s); if (!e) continue; const b = e.getBoundingClientRect(); if (!b.width) continue; rects[s] = b; const cut = b.top < 0 || b.bottom > H + 0.5 || b.left < 0 || b.right > W + 0.5; const underKb = b.bottom > kbTop + 0.5; out.push(`${s}@${Math.round(b.top)}-${Math.round(b.bottom)} x${Math.round(b.left)}-${Math.round(b.right)}${cut ? ' CUT' : ''}${underKb ? ' UNDER-KB' : ''}`); }
      // overflowing text (ellipsis or clipped)
      const clipped = [...document.querySelectorAll('.lc *, .sheet *')].filter(e => e.children.length === 0 && e.innerText && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(e => `"${e.innerText.slice(0, 40)}"(${e.scrollWidth}>${e.clientWidth})`);
      const ov = []; const keys = Object.keys(rects); for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = rects[keys[i]], b = rects[keys[j]]; const contains = (p, q) => p.left <= q.left + 1 && p.right >= q.right - 1 && p.top <= q.top + 1 && p.bottom >= q.bottom - 1; if (contains(a, b) || contains(b, a)) continue; const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (x > 2 && y > 2) ov.push(`${keys[i]} x ${keys[j]} (${Math.round(x)}x${Math.round(y)})`); }
      return { H, kbTop: Math.round(kbTop), out, clipped: clipped.slice(0, 8), ov }; }); console.log(`GEO[${label}] H=${r.H} kbTop=${r.kbTop}\n   ${r.out.join('\n   ')}\n   clipped: ${r.clipped.join(' ; ') || 'none'}\n   overlaps: ${r.ov.join(' ; ') || 'none'}`); };
    const setSize = async (dark) => { await page.setViewportSize({ width: 375, height: 667 }); await home(); await tap('.menu-btn', { wait: 500 }); await tap('.drawer-row:has-text("Text size")', { wait: 600 }); if (!dark) await ui('text size sheet'); await tap('button:text-is("Largest")', { wait: 400 }); if (dark) { const d = page.locator('button').filter({ hasText: /^Dusk/ }).first(); console.log('dark btn', await d.count()); if (await d.count()) await d.click(); await page.waitForTimeout(400); } await page.keyboard.press('Escape'); await home(); };
    const pass = async (tag, dark) => {
      await fresh2(); await kbInit(); await setSize(dark); await shot(`${tag}-home`);
      await logStart('egg timer', 'real_spoon.jpg'); await shot(`${tag}-cam`); await geo(`${tag} cam`);
      await page.locator('.w1-words input').click(); await kbUp(); await page.waitForTimeout(500); await shot(`${tag}-cam-kb`); await geo(`${tag} cam kb`);
      await page.keyboard.type('in the wooden box in the memorabilia box, under the yearbook from 1978, left side', { delay: 5 }); await page.waitForTimeout(300); await shot(`${tag}-cam-kb-long`); await geo(`${tag} cam kb long`);
      await kbDown(); await page.waitForTimeout(300); await openIn(); await shot(`${tag}-in-sheet`); await geo(`${tag} in sheet`);
      await pickIn('Wooden box'); await shot(`${tag}-chip`); await geo(`${tag} chip`);
      await page.locator('.w1-words input').click(); await kbUp(); await page.waitForTimeout(500); await shot(`${tag}-chip-kb`); await geo(`${tag} chip kb`); await kbDown();
      await doSave(); await itemPage('egg timer', `${tag}-itempage`);
      await moveIt('egg timer'); await shot(`${tag}-move`); await geo(`${tag} move`); await page.locator('.w1-words input').click(); await kbUp(); await page.waitForTimeout(500); await shot(`${tag}-move-kb`); await geo(`${tag} move kb`); await kbDown();
      await press('.lc-x'); await page.waitForTimeout(600);
      await home(); await page.click(LOG); await page.waitForTimeout(900); AI = { name: 'wallet' }; SAME = { index: 1, sure: true }; await cam('wallet.jpg'); await tap('.lc-shutter', { wait: 2500 }); await shot(`${tag}-wallet-ask`); await geo(`${tag} wallet ask`); SAME = { index: -1, sure: false };
      await page.locator('.w1-words input').click(); await kbUp(); await page.waitForTimeout(500); await shot(`${tag}-wallet-ask-kb`); await geo(`${tag} wallet kb`); await kbDown();
    };
    await pass('xldusk', true);
