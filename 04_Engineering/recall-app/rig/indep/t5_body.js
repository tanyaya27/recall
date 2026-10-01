    const L = (n) => async () => { await sel(n); };
    const PLUS = async () => { await press('.lv-sq.plus'); await page.waitForTimeout(500); };
    const obs = [[2600, 'shot', '2.6s'], [3500, 'shot', '3.5s']];
    const endShot = (t) => [[t, 'shot', 'after answer']];
    const S = [
      { id: 'C1', desc: 'LOG new item, L1, sure KC @4.5s, no action; then sheet Cancel + Save', mode: 'log', answers: [{ ans: KC, delay: 4500 }], steps: [...obs, ...endShot(5500)] },
      { id: 'C2', desc: 'LOG new item, L1, NEW "hall closet" @0.5s; sheet Cancel + Save', mode: 'log', answers: [{ ans: NEW, delay: 500 }], steps: [[1500, 'shot', 'sheet']] },
      { id: 'C3', desc: 'LOG new item, L1, garbled @0.5s', mode: 'log', bad: true, answers: [{ ans: NEW, delay: 500 }], steps: [[1500, 'shot', 'garbled']] },
      { id: 'C4', desc: 'MOVE L1, garbled @4.5s (sheet already open)', bad: true, answers: [{ ans: NEW, delay: 4500 }], steps: [[3500, 'shot', 'sheet'], [5500, 'shot', 'after garbled']] },
      { id: 'C5', desc: 'MOVE L2 (memorabilia box, middle) shot, sure KC @4.5s; sheet Cancel + Save', pre: L(2), answers: [{ ans: KC, delay: 4500 }], steps: [[500, 'shot', 'look'], ...obs, ...endShot(5500)] },
      { id: 'C6', desc: 'MOVE L2 (middle) shot, never answers; sheet Cancel + Save', pre: L(2), answers: [{ ans: KC, delay: 60000 }], steps: [[3500, 'shot', 'sheet']] },
      { id: 'C7', desc: 'MOVE + new L4 on top of Crawl space, sure KC @4.5s; sheet Cancel + Save', pre: PLUS, answers: [{ ans: KC, delay: 4500 }], steps: [[500, 'shot', 'look'], ...obs, ...endShot(5500)] },
      { id: 'C8', desc: 'MOVE + new L4, NEW @0.5s', pre: PLUS, answers: [{ ans: NEW, delay: 500 }], steps: [[1500, 'shot', 'sheet']] },
      { id: 'C9', desc: 'MOVE shoot CURRENT L1 (wooden box), AI: it IS the wooden box, sure, @0.5s -> Yes', answers: [{ ans: { name: 'wooden box', known: 'wooden box', sure: true }, delay: 500 }], steps: [[1400, 'shot', 'ask'], [1500, 'press', 'button:has-text("Yes")'], [2300, 'shot', 'after yes']] },
      { id: 'C10', desc: 'MOVE shoot CURRENT L1 (wooden box), AI says wooden box sure @4.5s (after sheet)', answers: [{ ans: { name: 'wooden box', known: 'wooden box', sure: true }, delay: 4500 }], steps: [[3500, 'shot', 'sheet'], [5300, 'shot', 'after late'], [5400, 'press', '.wl-sugg'], [6200, 'shot', 'after sugg']] },
      { id: 'C11', desc: 'MOVE shoot CURRENT L1 wooden box, AI wooden box NOT sure @0.5s', answers: [{ ans: { name: 'wooden box', known: 'wooden box', sure: false }, delay: 500 }], steps: [[1500, 'shot', 'unsure']] },
      { id: 'C12', desc: 'MOVE select L3 (Crawl space, inherited outer) and shoot it; AI says Crawl space sure @0.5s', pre: L(3), answers: [{ ans: { name: 'crawl space', known: 'Crawl space', sure: true }, delay: 500 }], steps: [[1500, 'shot', 'crawl']] },
      { id: 'C13', desc: 'MOVE select L2 memorabilia box and shoot it; AI says memorabilia box sure @0.5s -> Yes', pre: L(2), answers: [{ ans: { name: 'memorabilia box', known: 'memorabilia box', sure: true }, delay: 500 }], steps: [[1400, 'shot', 'ask'], [1500, 'press', 'button:has-text("Yes")'], [2300, 'shot', 'after yes']] },
      { id: 'C14', desc: 'MOVE L1 double-tap shutter (40 ms apart), NEW @0.5s', answers: [{ ans: NEW, delay: 500 }, { ans: { name: 'second' } }], steps: [[40, 'press', '.lc-shutter'], [1500, 'shot', 'dbl']] },
    ];
    const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
    for (const sc of S) if (!only || only.includes(sc.id)) await runScn(sc);
