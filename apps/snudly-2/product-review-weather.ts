const UNITS = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

function reviewForecast(now = Date.now()) {
  const start = Math.floor(now / 3_600_000) * 3_600_000 - 3_600_000;
  const timeseries = Array.from({ length: 168 }, (_, index) => {
    const dailyWave = Math.sin((index % 24) / 24 * Math.PI * 2);
    const temperature = 7 + Math.round(dailyWave * 4 + index / 48);
    return {
      time: new Date(start + index * 3_600_000).toISOString(),
      data: {
        instant: {
          details: {
            air_temperature: temperature,
            wind_speed: 2,
            wind_from_direction: 210,
            relative_humidity: 78,
            cloud_area_fraction: 55,
          },
        },
        next_1_hours: {
          summary: { symbol_code: 'partlycloudy_day' },
          details: { precipitation_amount: index === 0 ? 0.4 : 0 },
        },
        next_6_hours: {
          summary: { symbol_code: 'partlycloudy_day' },
          details: { precipitation_amount: index === 0 ? 0.4 : 0 },
        },
      },
    };
  });
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [10.3951, 63.4305, 10] },
    properties: { meta: { updated_at: new Date(start).toISOString(), units: UNITS }, timeseries },
  };
}

export function installProductReviewForecast(): void {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(rawUrl, window.location.href);
    if (url.pathname === '/api/forecast') {
      return new Response(JSON.stringify(reviewForecast()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return nativeFetch(input, init);
  };
}
