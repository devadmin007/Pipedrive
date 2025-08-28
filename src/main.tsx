import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("✅ SW registered:", registration);
      })
      .catch(console.error);
  }
createRoot(document.getElementById('root')!).render(<App />);
