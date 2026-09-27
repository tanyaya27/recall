# Board: containers as a graph (2026-09-25)

Ravi's rulings (DECISIONS 2026-09-25):
- The relationship is a **first-class edge**, not a stored name match and not a field on the thing.
- A box's contents stay off Home, but any one of them can be promoted back to Home.
- **Home follows the box you tap**, and a fixed place opens the same way.
- Things can be logged first and put away later, and putting them away must be **very, very fast**.

Drawings (from the app's stylesheet, `rig/gen_s5.py` → `render_s5.js` → `compose_s5.py`):
- `mockups/S5_home_inside.jpg`: Home inside a box. Option A (Back + banner) or B (trail), plus promoting a thing to Home.
- `mockups/S5_put_away.jpg`: putting things away. P-A (where first, then tap things), P-B (from inside the box), P-C (drag, as an extra).

The example throughout is Ravi's: baseball card → wooden box → memorabilia box → crawl space.

## The model (the same whatever is picked below)

- **Nodes:** things (card, wooden box, memorabilia box) and fixed places (crawl space). A container is simply a thing that has things in it. There is no container type and nobody is ever asked "is this a container?"
- **An edge is its own record:** `{ kind:'edge', rel:'in', from:<thing>, to:<thing or place>, since, until:null, by, how:'typed'|'said'|'picked'|'sweep'|'session'|'guess', owner }`.
  - Moving something closes its open edge (`until` = now) and opens a new one, in one batch.
  - A thing has at most one open "in" edge.
  - Nothing can end up inside itself; that's checked before writing.
- **Where a thing is** means following its open edges outward: card → wooden box → memorabilia box → crawl space. "Where was it before?" is its closed edges, which replace today's history list over time.
- **The place text stays on each thing** as a copy that's rewritten when its edge changes. Old things, search, the AI prompt and a helper's view keep working, so there's no migration day. A thing with no edge yet is still read from its place text.
- **Home, top level:** things with no open "in" edge to another *thing*, plus promoted things (`promoted: true` on the thing).
- **Home inside X:** things whose open edge points at X. For a fixed place, it's also things there with no edge yet whose place text says so.
- **Later, at no extra cost:** "lent to Dan" and "goes with the camera" become edges with a different `rel`.
- **Rules:**
  - Edges live in the same collection with `kind:'edge'`.
  - Reading an edge follows the thing it starts from, so a private thing's edges are private.
  - The owner and "Can help" helpers may create and close edges; only the owner deletes.
  - All of this is proven on the real rules engine before deploy.
- **Offline and speed:** one open-edge write and one close-edge write per move, batched. A put-away of 5 things is one batch.

## H · Home inside a box

- **A · Back and a banner.** The box's name at the top, with a banner showing its photo, where it is, and "About this box" (its own card). Back steps out one level.
- **B · A trail.** Home › Crawl space › Memorabilia box › **Wooden box**. Any step can be tapped to jump out, and a fixed place opens the same way (B, frame 2).

Positions:
- **Devin (design): A.** One level at a time is how you'd go through a real box. The trail starts to look like a folder tree, which Ravi ruled out on 09-24.
- **Maya (PM): A,** but with the banner's line *saying* the chain ("In the memorabilia box · Crawl space"), which A already does.
- **Sam (architect):** no preference; both read the same edges. B needs the whole chain on screen at Largest, where it wraps to two or three lines.
- **Margaret:** A. "Back is back."
- **Linda (storage unit):** B. "Unit 214 › Box 14 › the blue bag — that's literally how I think about it."
- **Board recommendation: A.** In A, a long-press on Back could later show the chain as a jump list, if Linda's case turns out to be common.

**Promote:** hold a thing inside a box and pick **Show on Home too**. Its Home tile then says where it lives ("in the wooden box"). The sheet also offers **Take it out…** (pick where it goes now) and **Open its card**.

## P · Putting things away

- **P-A · Where first, then tap things.** Tap the "Not put away · 4" chip, pick *where* (containers and places, with photos), then tap each thing that goes there and tap **Put 2 in the wooden box**. That's one batch, with a toast offering Undo.
- **P-B · From inside the box.** Tap **Put in**, and a sheet shows the things not yet put away. Tap them, then Done.
- **P-C · Drag a tile onto a box.** An extra only.

Positions:
- **Priyanka (engineer):** P-A and P-B share one picker grid and one batch write, so building both costs about as much as one. P-C is a separate gesture system; later.
- **Devin:** P-A is the everyday one (a pile on the table). P-B is for packing a box. Both, with P-A reachable from the Home chip.
- **Dr Kim (tremor):** P-C must never be the only way. P-A and P-B are all taps.
- **Robert (garage):** P-B while packing. "Open the bin, tap tap tap, done."
- **Board recommendation: P-A + P-B now, P-C later.**

## Rulings needed

1. **Home inside a box: A (Back + banner; board) or B (trail)?**
2. **Putting away: P-A + P-B now, drag later (board)?**

After that, the build order:
1. Edges and their rules, plus the real rules engine tests.
2. Home inside a box, plus promote.
3. Put away.
4. The thing's card answering through edges (option B from 09-24).

Each step gets its own audit, and you see screenshots before any push.
