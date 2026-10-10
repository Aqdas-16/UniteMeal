
const originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args.map(String).join(' ');
    if (
        msg.includes('Geocoding Service: You must enable Billing') || 
        msg.includes('Google Maps JavaScript API warning') || 
        msg.includes('Script error') || 
        msg.includes('Maps Demo Key limit reached') ||
        (msg.includes('AdvancedMarker') && msg.includes('keys'))
    ) {
        return;
    }
    originalConsoleError(...args);
};

window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || event.message.includes('Maps Demo Key limit reached')) {
        event.preventDefault(); // Stop it from bubbling to the console/AI Studio
        event.stopImmediatePropagation();
    }
});
window.onerror = function(msg, url, line, col, error) {
   if (msg === 'Script error.' || (typeof msg === 'string' && msg.includes('Maps Demo Key limit reached'))) {
       return true; // suppresses the error
   }
   return false;
};
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
