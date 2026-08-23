import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeScreen } from './HomeScreen';
import { homeReviewWeatherLoader } from './home-review-fixture';
import './design-system.css';
import './snudly.css';

const root = document.getElementById('snudly-root');
if (!root) throw new Error('snudly-root missing');

createRoot(root).render(
  <StrictMode>
    <HomeScreen
      profile={{ name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' }}
      loadWeather={homeReviewWeatherLoader}
    />
  </StrictMode>,
);
