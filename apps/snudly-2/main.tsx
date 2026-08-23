import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { SnudlyApp } from './SnudlyApp';
import './design-system.css';
import './snudly.css';
import './reference-parity.css';

const root = document.getElementById('snudly-root');
if (!root) throw new Error('snudly-root missing');

if (Capacitor.isNativePlatform()) document.documentElement.dataset.runtime = 'native';

createRoot(root).render(
  <StrictMode>
    <SnudlyApp />
  </StrictMode>,
);
