import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BareApp } from './BareApp';

const root = document.getElementById('bare-root');
if (!root) throw new Error('bare-root missing');

createRoot(root).render(
  <StrictMode>
    <BareApp />
  </StrictMode>,
);
