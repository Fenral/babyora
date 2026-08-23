export type SnudlySituation = 'outdoor-play' | 'stroller';

export type SnudlyWeather = {
  temperatureC: number;
  feelsLikeC: number;
  windMetersPerSecond: number;
  precipitationMillimetersPerHour: number;
  symbolCode?: string;
};

export type RecommendOutfitInput = {
  childAgeMonths: number;
  situation: SnudlySituation;
  weather: SnudlyWeather;
};

export type OutfitGarment = {
  id: string;
  name: string;
  role: 'Innerst' | 'Mellomlag' | 'Ytterst' | 'Tilbehør' | 'Utstyr';
};

export type OutfitRecommendation = {
  engine: 'snudly-engine-v1';
  garments: OutfitGarment[];
  notes: string[];
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};
