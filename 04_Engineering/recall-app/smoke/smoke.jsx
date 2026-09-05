import { renderToString } from 'react-dom/server';
import Board from '../src/components/Board.jsx';
import ThingCard from '../src/components/ThingCard.jsx';
import PhotoCard from '../src/components/PhotoCard.jsx';
import Ask from '../src/components/Ask.jsx';
import Settings from '../src/components/Settings.jsx';
import { boardOrder, findByName } from '../src/lib/db.js';
import { whenSeen, dayLine } from '../src/lib/format.js';

globalThis.localStorage = { getItem: () => null, setItem() {} }; globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }; globalThis.document = { documentElement: { dataset: {}, style: { setProperty() {} } } };
globalThis.navigator = { language: 'en-US' };
globalThis.window = globalThis;
const now = Date.now();
const items = [
  { id: 'a', name: 'Keys', location: 'Hook by the door', thumb: 'data:,', photo: 'data:,', lastSeenAt: now - 3600e3, createdAt: now - 5e6, pinnedOrder: 2 },
  { id: 'b', name: '', location: '', thumb: 'data:,', photo: 'data:,', lastSeenAt: now - 90000e3, createdAt: now - 4e6, order: now - 4e6, naming: false },
  { id: 'c', name: 'Reading glasses', location: 'Kitchen counter', restingOn: 'on the folded shorts', thumb: 'data:,', photo: 'data:,', lastSeenAt: now - 200000e3, createdAt: now - 3e6, pinnedOrder: 0 },
];
const engine = { ready: true };
const out = {};
out.boardOrder = boardOrder(items).map((i) => i.id).join(',');
out.match = findByName(items, 'reading GLASSES ')?.id;
out.when = [whenSeen(now - 60e3), whenSeen(now - 3*3600e3), whenSeen(now - 26*3600e3), whenSeen(now - 3*86400e3), whenSeen(now - 20*86400e3)];
out.day = dayLine();
out.board = renderToString(<Board items={items} ready={true} onOpenThing={()=>{}} onPhoto={()=>{}} onAsk={()=>{}} onSettings={()=>{}} />).length;
out.boardNoKey = renderToString(<Board items={[]} ready={false} onOpenThing={()=>{}} onPhoto={()=>{}} onAsk={()=>{}} onSettings={()=>{}} />).includes('One-time setup');
out.boardEmpty = renderToString(<Board items={[]} ready={true} onOpenThing={()=>{}} onPhoto={()=>{}} onAsk={()=>{}} onSettings={()=>{}} />).includes('Photograph something');
out.thing = renderToString(<ThingCard item={items[2]} items={items} onBack={()=>{}} onFoundFile={()=>{}} />).includes('Found it');
out.thingUnnamed = renderToString(<ThingCard item={items[1]} items={items} onBack={()=>{}} onFoundFile={()=>{}} />).includes('No place saved');
out.photo = renderToString(<PhotoCard file={{}} engine={engine} items={items} onDone={()=>{}} onCancel={()=>{}} />).length;
out.ask = renderToString(<Ask engine={engine} items={items} onResult={()=>{}} onBack={()=>{}} />).includes('Where is my');
out.settings = renderToString(<Settings removed={[items[0]]} onBack={()=>{}} onConfigSaved={()=>{}} />).includes('Check the key works');
console.log(JSON.stringify(out, null, 1));
