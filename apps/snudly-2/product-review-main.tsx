import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductApp } from './ProductApp';
import { installProductReviewForecast } from './product-review-weather';
import './design-system.css';
import './snudly.css';
import './reference-parity.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

installProductReviewForecast();

createRoot(root).render(
  <StrictMode>
    <ProductApp initialProfile={{ name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' }} />
  </StrictMode>,
);
