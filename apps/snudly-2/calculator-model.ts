import { recommendOutfit, type SnudlySituation } from '../../packages/snudly-engine';
import { togForRoomTemp } from '../../src/lib/research/tog-table';

export type WeatherCalculatorInput = Readonly<{
  childAgeMonths: number;
  temperatureC: number;
  feelsLikeC: number;
  windMetersPerSecond: number;
  precipitationMillimetersPerHour: number;
  situation: SnudlySituation;
}>;

export function calculateWeatherOutfit(input: WeatherCalculatorInput) {
  return recommendOutfit({
    childAgeMonths: Math.max(0, Math.min(24, Math.round(input.childAgeMonths))),
    situation: input.situation,
    weather: {
      temperatureC: input.temperatureC,
      feelsLikeC: input.feelsLikeC,
      windMetersPerSecond: input.windMetersPerSecond,
      precipitationMillimetersPerHour: input.precipitationMillimetersPerHour,
      symbolCode: input.precipitationMillimetersPerHour > 0 ? 'rain' : 'partlycloudy_day',
    },
  });
}

export function calculateSleepLayers(roomTemperatureC: number) {
  const safeTemperature = Math.max(10, Math.min(30, roomTemperatureC));
  const recommendation = togForRoomTemp(safeTemperature);
  return {
    roomTemperatureC: safeTemperature,
    tog: recommendation.tog,
    layersUnder: recommendation.layersUnder,
    sourceIds: recommendation.sourceIds,
  } as const;
}
