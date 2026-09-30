  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('X', 'suite ran', false, e.message); try { await shot('fatal'); } catch {} }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  for (const r of results.filter((x) => !x.ok)) console.log('FAILED:', r.req, r.name, r.note);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors:', consoleErrors.length ? consoleErrors.slice(0, 10) : 'none');
  server.close(); process.exit(0);
})();
