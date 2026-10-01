    const PLUS = async () => { await press('.lv-sq.plus'); await page.waitForTimeout(500); };
    const raw = async (nm) => { const r = await page.evaluate((n) => { const d = window.__rig.dump(); const it = d.find((x) => x.kind === 'item' && !x.deleted && (x.name || '').toLowerCase() === n); if (!it) return 'NO ITEM'; const es = d.filter((e) => e.kind === 'edge' && e.from === it.id); const pl = d.filter((p) => p.kind === 'place' && !p.deleted).map((p) => JSON.stringify(p.name)); return { location: it.location, history: it.history, edges: es.map((e) => ({ to: e.to, until: e.until, how: e.how })), places: pl.join(',') }; }, nm); console.log('RAW', nm, JSON.stringify(r)); };
    const offs = (process.env.OFFS || '300,640,690,720,760,850').split(',').map(Number);
    for (const mode of (process.env.MODES || 'log,move').split(',')) for (const off of offs) {
      await runScn({ id: `E-${mode}-${off}`, desc: `${mode}: NEW "hall closet" answer @500ms; Save pressed at ${off}ms`, mode, pre: mode === 'log' ? PLUS : null, answers: [{ ans: NEW, delay: 500 }],
        steps: [[off, 'save', ''], [off + 60, 'fn', async () => console.log('   +60ms', JSON.stringify(await state()))], [off + 1200, 'shot', 'after']], saveAtEnd: false, waitEnd: 1500,
        after: async () => { await raw(mode === 'log' ? 'egg timer' : 'baseball card'); } });
    }
