import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyPrefs } from './lib/prefs.js';

applyPrefs(); // palette + text size, before the first paint
createRoot(document.getElementById('root')).render(<App />);
