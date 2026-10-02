    // ---- v6 helpers ----
    const NS = []; let S0;
    const mv = async (nm) => { await openItem(nm); await btn(/Put it somewhere|Move it/, 1200); };
    const sv = async (label, expectSave = true) => { S0 = await snapAll(); await doSave(); await shot(label); const m = await msg(); const open = await camOpen(); const ch = await diffSnap(S0, label);
      const refused = m.some(x => /Not saved/.test(x)); console.log(`   RESULT[${label}] refused=${refused} camOpen=${open} changes=${ch.length}`);
      if (expectSave && (refused || ch.length === 0)) { NS.push(label + ': ' + (m.join(' | ') || 'no message') + ' changes=' + ch.length); console.log('   !!!! UNEXPECTED (legit save not written)'); }
      if (!expectSave && !refused) { NS.push('NOT REFUSED ' + label + ' changes=' + ch.length); console.log('   !!!! EXPECTED A REFUSAL'); }
      return { refused, open, ch }; };
    const svNext = async (label) => { S0 = await snapAll(); await hold('.lc-k.sv', 1200); await page.waitForTimeout(1500); await shot(label); const m = await msg(); const ch = await diffSnap(S0, label); const refused = m.some(x => /Not saved/.test(x)); console.log(`   RESULT[${label}] refused=${refused} changes=${ch.length}`); if (refused || !ch.length) { NS.push(label + ': ' + (m.join(' | ') || 'no message') + ' changes=' + ch.length); console.log('   !!!! UNEXPECTED'); } };
    const summary = () => { console.log('\n==== WRONG/UNEXPECTED: ' + (NS.length ? '\n  ' + NS.join('\n  ') : 'none')); };
