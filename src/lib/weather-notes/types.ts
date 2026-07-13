export type WeatherNoteSeverity = 'info' | 'tip' | 'warning';

export type WeatherNote = {
  id: string;
  severity: WeatherNoteSeverity;
  message: string;
};
