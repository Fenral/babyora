import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LabShell } from './LabShell';

const root = document.getElementById('lab-root');
if (!root) throw new Error('lab-root missing');

createRoot(root).render(
  <StrictMode>
    <LabShell />
  </StrictMode>,
);
