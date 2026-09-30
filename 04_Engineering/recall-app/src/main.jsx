import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyPrefs } from './lib/prefs.js';
import { watchKeyboard } from './lib/kb.js';

applyPrefs(); // palette + text size, before the first paint
watchKeyboard(); // sheets ride above the iPhone keyboard
createRoot(document.getElementById('root')).render(<App />);
