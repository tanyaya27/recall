// src/lib/names.js
var DROP = /* @__PURE__ */ new Set(["your", "the", "my", "a", "an", "her", "his", "our"]);
function normName(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !DROP.has(w)).map((w) => w.replace(/s$/, "")).join(" ");
}

// src/lib/graph.js
var G = { items: [], edges: [], byId: /* @__PURE__ */ new Map(), open: /* @__PURE__ */ new Map() };
function setGraph(items2 = [], edges2 = []) {
  const byId = new Map(items2.map((it2) => [it2.id, it2]));
  const open = /* @__PURE__ */ new Map();
  edges2.filter((e) => e.rel === "in" && !e.until).sort((a, b) => (a.since || 0) - (b.since || 0)).forEach((e) => open.set(e.from, e));
  G = { items: items2, edges: edges2, byId, open };
}
function openEdge(itemId, g = G) {
  return g.open.get(itemId) || null;
}
function holderOf(item, g = G) {
  const e = item && openEdge(item.id, g);
  if (!e || !e.to || e.to.t !== "thing") return null;
  const h = g.byId.get(e.to.id);
  return h && !h.deleted ? h : null;
}
function chainOf(item, g = G, max = 6) {
  const out = [];
  const seen = /* @__PURE__ */ new Set([item && item.id]);
  let cur = item;
  while (cur && out.length < max) {
    const h = holderOf(cur, g);
    if (!h || seen.has(h.id)) break;
    out.push(h);
    seen.add(h.id);
    cur = h;
  }
  return out;
}
function wouldLoop(item, dest, g = G) {
  if (!item || !dest) return false;
  if (dest.id === item.id) return true;
  return chainOf(dest, g).some((c) => c.id === item.id);
}
function contentsOf(thing, g = G) {
  if (!thing) return [];
  return g.items.filter((x) => !x.deleted && x.id !== thing.id && holderOf(x, g) === thing).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
}
function outerPlace(item, g = G) {
  const chain = chainOf(item, g);
  const last = chain.length ? chain[chain.length - 1] : item;
  return last && last.location || "";
}
function atPlace(name, g = G) {
  const n = (name || "").trim().toLowerCase();
  if (!n) return [];
  return g.items.filter((x) => !x.deleted && !holderOf(x, g) && (x.location || "").trim().toLowerCase() === n);
}
function topLevel(items2, g = G) {
  return items2.filter((x) => !holderOf(x, g) || x.promoted);
}
function inPhrase(c) {
  const n = (c.name || "").trim().replace(/^(my|the|our)\s+/i, "");
  if (!n) return "In a box";
  return /\d/.test(n) || /[A-Z]/.test(n.slice(1)) ? `In ${n}` : `In the ${n.toLowerCase()}`;
}
function placeWords(item, g = G) {
  const chain = chainOf(item, g);
  if (!chain.length) return null;
  const lead = chain.slice(0, 2).map((c, i) => i === 0 ? inPhrase(c) : inPhrase(c).replace(/^In /, "in ")).join(", ");
  return { lead, where: outerPlace(item, g), chain };
}
var LEAD = /^\s*(in|inside|into|on|at|under)\s+(the\s+|my\s+|a\s+|an\s+)?/i;
function destOf(text, item = null, g = G) {
  const raw = (text || "").trim();
  if (!raw) return null;
  const bare = raw.replace(LEAD, "");
  const head = bare.split(/\s*,\s*/)[0];
  const names = (x) => [x.name, ...x.aliases || []].map(normName).filter(Boolean);
  for (const cand of [bare, head]) {
    const n = normName(cand);
    if (!n) continue;
    const hit = g.items.find((x) => !x.deleted && x.name && (!item || x.id !== item.id) && names(x).includes(n));
    if (hit && !(item && wouldLoop(item, hit, g))) return { t: "thing", id: hit.id, name: hit.name };
  }
  return { t: "place", name: raw };
}

// tests/graph.test.js
var T = (n, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${note ? " \u2014 " + note : ""}`);
  if (!ok) process.exitCode = 1;
};
var it = (id, name, location, extra = {}) => ({ id, name, location, lastSeenAt: 1, ...extra });
var E = (from, to, extra = {}) => ({ id: `e_${from}_${to.id || to.name}`, rel: "in", from, to, since: 1, until: null, ...extra });
var items = [
  it("c", "baseball card", "Wooden box"),
  it("w", "wooden box", "Memorabilia box"),
  it("m", "memorabilia box", "Crawl space"),
  it("g", "reading glasses", "Hall table"),
  it("p", "Box 14", "Storage unit 214"),
  it("q", "red pouch", "Box 14"),
  it("r", "grandma's ring", "Red pouch")
];
var edges = [
  E("c", { t: "thing", id: "w" }),
  E("w", { t: "thing", id: "m" }),
  E("m", { t: "place", name: "Crawl space" }),
  E("g", { t: "place", name: "Hall table" }),
  E("q", { t: "thing", id: "p" }),
  E("r", { t: "thing", id: "q" }),
  E("c", { t: "place", name: "Desk" }, { since: 0, until: 1 })
];
setGraph(items, edges);
var by = (id) => items.find((x) => x.id === id);
T("N1 the card is in the wooden box (open edge, not the closed one)", holderOf(by("c")).id === "w");
T("N2 chain outward: wooden box, memorabilia box", chainOf(by("c")).map((x) => x.id).join() === "w,m");
T("N3 the memorabilia box holds the wooden box", contentsOf(by("m")).map((x) => x.id).join() === "w");
T('N4 words: "In the wooden box, in the memorabilia box" \xB7 Crawl space', placeWords(by("c")).lead === "In the wooden box, in the memorabilia box" && placeWords(by("c")).where === "Crawl space");
T('N5 a numbered name reads as a name: "In Box 14"', placeWords(by("q")).lead === "In Box 14");
T("N6 Home: the card and the wooden box are not top level", topLevel(items).map((x) => x.id).sort().join() === "g,m,p");
T("N7 a promoted thing is on Home too", topLevel(items.map((x) => x.id === "c" ? { ...x, promoted: true } : x)).some((x) => x.id === "c"));
T("N8 at a place: the crawl space has the memorabilia box only", atPlace("crawl space").map((x) => x.id).join() === "m");
T("N9 no circles: the memorabilia box can't go into the card", wouldLoop(by("m"), by("c")) && !wouldLoop(by("g"), by("c")));
T('N10 typed "in the wooden box" \u2192 the thing; "Garage shelf" \u2192 a place', destOf("in the wooden box", by("g")).id === "w" && destOf("Garage shelf", by("g")).t === "place");
T('N11 a loose name never links ("box" \u2260 "wooden box")', destOf("box", by("g")).t === "place");
T("N12 destOf never offers a circle", destOf("baseball card", by("m")).t === "place");
setGraph(items.map((x) => x.id === "m" ? { ...x, location: "Garage shelf" } : x), edges);
T("N13 the big box moved: the card answers with the new place, nothing written to the card", outerPlace(by("c")) === "Garage shelf");
setGraph(items.filter((x) => x.id !== "w"), edges);
T("N14 a removed box holds nothing (its contents fall back to their own place text)", holderOf(by("c")) === null);

// ---- build 2 (09-27): only containers hold things
{
  const { setGraph, isContainer, containers, graph } = await import('../src/lib/graph.js');
  const it = (id, name, extra = {}) => ({ id, kind: 'item', name, ...extra });
  const ed = (from, to) => ({ id: 'e' + from, kind: 'edge', rel: 'in', from, to, since: 1, until: null });
  setGraph([it('pen', 'pencil'), it('cab', 'filing cabinet'), it('tin', 'blue tin', { holds: true }), it('jar', 'cream jar', { holds: false }), it('bag', 'bag', { holds: false })],
    [ed('cab', { t: 'thing', id: 'pen', name: 'pencil' }), ed('jar', { t: 'thing', id: 'bag', name: 'bag' })]);
  const ok = (n, c) => console.log(`${c ? 'PASS' : 'FAIL'}  ${n}`);
  ok('C1 a thing marked "holds things" is a container, even empty', isContainer(graph().byId.get('tin')));
  ok('C2 a plain thing with nothing in it is not', !isContainer(graph().byId.get('jar')));
  ok('C3 something IS in it (old data, the pencil): a container, so it can be emptied', isContainer(graph().byId.get('pen')));
  ok('C4 marked off but something is in it: still a container (never hide what is inside)', isContainer(graph().byId.get('bag')));
  const names = containers(undefined, 9).map((x) => x.name);
  ok('C5 the where-lists offer only containers (tin, pencil-with-cabinet, bag), never the jar or the cabinet', names.includes('blue tin') && !names.includes('cream jar') && !names.includes('filing cabinet'));
}
