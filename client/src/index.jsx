import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Preconnect/dns-prefetch to API origin to speed up first request
try {
  if (import.meta.env.VITE_API_URL) {
    const api = new URL(import.meta.env.VITE_API_URL);
    const origin = `${api.protocol}//${api.host}`;
    const linkPc = document.createElement('link');
    linkPc.rel = 'preconnect';
    linkPc.href = origin;
    linkPc.crossOrigin = '';
    document.head.appendChild(linkPc);
    const linkDns = document.createElement('link');
    linkDns.rel = 'dns-prefetch';
    linkDns.href = origin;
    document.head.appendChild(linkDns);
  }
} catch (_) {}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


