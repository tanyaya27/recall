// The pure graph module (lib/graph.js, 2026-09-26): edges decide where things are; names only make a link
// when she saves with an exact name. Build: see RIG.md (esbuild → node).
import { setGraph, holderOf, chainOf, contentsOf, placeWords, topLevel, atPlace, wouldLoop, destOf, outerPlace } from '../src/lib/graph.js';
const T = (n, ok, note = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${note ? ' — ' + note : ''}`); if (!ok) process.exitCode = 1; };
const it = (id, name, location, extra = {}) => ({ id, name, location, lastSeenAt: 1, ...extra });
const E = (from, to, extra = {}) => ({ id: `e_${from}_${to.id || to.name}`, rel: 'in', from, to, since: 1, until: null, ...extra });
const items = [it('c', 'baseball card', 'Wooden box'), it('w', 'wooden box', 'Memorabilia box'), it('m', 'memorabilia box', 'Crawl space'),
  it('g', 'reading glasses', 'Hall table'), it('p', 'Box 14', 'Storage unit 214'), it('q', 'red pouch', 'Box 14'), it('r', "grandma's ring", 'Red pouch')];
const edges = [E('c', { t: 'thing', id: 'w' }), E('w', { t: 'thing', id: 'm' }), E('m', { t: 'place', name: 'Crawl space' }),
  E('g', { t: 'place', name: 'Hall table' }), E('q', { t: 'thing', id: 'p' }), E('r', { t: 'thing', id: 'q' }),
  E('c', { t: 'place', name: 'Desk' }, { since: 0, until: 1 })]; // an old, closed edge
setGraph(items, edges);
const by = (id) => items.find((x) => x.id === id);
T('N1 the card is in the wooden box (open edge, not the closed one)', holderOf(by('c')).id === 'w');
T('N2 chain outward: wooden box, memorabilia box', chainOf(by('c')).map((x) => x.id).join() === 'w,m');
T('N3 the memorabilia box holds the wooden box', contentsOf(by('m')).map((x) => x.id).join() === 'w');
T('N4 words: "In the wooden box, in the memorabilia box" · Crawl space', placeWords(by('c')).lead === 'In the wooden box, in the memorabilia box' && placeWords(by('c')).where === 'Crawl space');
T('N5 a numbered name reads as a name: "In Box 14"', placeWords(by('q')).lead === 'In Box 14');
T('N6 Home: the card and the wooden box are not top level', topLevel(items).map((x) => x.id).sort().join() === 'g,m,p');
T('N7 a promoted thing is on Home too', topLevel(items.map((x) => (x.id === 'c' ? { ...x, promoted: true } : x))).some((x) => x.id === 'c'));
T('N8 at a place: the crawl space has the memorabilia box only', atPlace('crawl space').map((x) => x.id).join() === 'm');
T('N9 no circles: the memorabilia box can\'t go into the card', wouldLoop(by('m'), by('c')) && !wouldLoop(by('g'), by('c')));
T('N10 typed "in the wooden box" → the thing; "Garage shelf" → a place', destOf('in the wooden box', by('g')).id === 'w' && destOf('Garage shelf', by('g')).t === 'place');
T('N11 a loose name never links ("box" ≠ "wooden box")', destOf('box', by('g')).t === 'place');
T('N12 destOf never offers a circle', destOf('baseball card', by('m')).t === 'place');
setGraph(items.map((x) => (x.id === 'm' ? { ...x, location: 'Garage shelf' } : x)), edges);
T('N13 the big box moved: the card answers with the new place, nothing written to the card', outerPlace(by('c')) === 'Garage shelf');
setGraph(items.filter((x) => x.id !== 'w'), edges);
T('N14 a removed box holds nothing (its contents fall back to their own place text)', holderOf(by('c')) === null);
