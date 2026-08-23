import { recommendOutfit, type SnudlySituation } from '../../packages/snudly-engine';
import { getConditionLabel, getGarmentImage, getWeatherIcon } from '../../src/lib/monter-assets';
import type { WeatherHourly, WeatherNow } from '../../src/lib/met-no/types';
import type { OnboardingDraft } from './app-flow';

export type HomeGarment = {
  id: string;
  name: string;
  role: string;
  image: string | null;
};

export type HomeViewModel = {
  engine: 'snudly-engine-v1';
  childName: string;
  situationLabel: string;
  garmentCount: number;
  garments: HomeGarment[];
  summary: string;
  reason: string;
  weather: {
    temperature: string;
    feelsLike: string;
    condition: string;
    wind: string;
    precipitation: string;
    icon: string | null;
    symbolCode: string;
  };
  nextChange: { time: string; action: string } | null;
};

type BuildHomeViewModelInput = {
  profile: OnboardingDraft;
  situation: SnudlySituation;
  weatherNow: WeatherNow;
  hourly: WeatherHourly[];
  evaluatedAt: Date;
};

export function ageInCompleteMonths(birthDate: string, evaluatedAt: Date): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(birthDate);
  if (!match) throw new Error('invalid child birth date');
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const parsedBirth = new Date(`${birthDate}T12:00:00.000Z`);
  if (
    !Number.isFinite(parsedBirth.getTime())
    || parsedBirth.getUTCFullYear() !== birthYear
    || parsedBirth.getUTCMonth() + 1 !== birthMonth
    || parsedBirth.getUTCDate() !== birthDay
    || parsedBirth.getTime() > evaluatedAt.getTime()
  ) throw new Error('invalid child birth date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(evaluatedAt);
  const currentYear = Number(parts.find((part) => part.type === 'year')?.value);
  const currentMonth = Number(parts.find((part) => part.type === 'month')?.value);
  const currentDay = Number(parts.find((part) => part.type === 'day')?.value);
  const raw = (currentYear - birthYear) * 12 + currentMonth - birthMonth;
  const ageMonths = raw - (currentDay < birthDay ? 1 : 0);
  if (ageMonths < 0 || ageMonths > 24) throw new Error('invalid child birth date');
  return ageMonths;
}

function roundTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value);
}

function engineInput(ageMonths: number, situation: SnudlySituation, weather: WeatherHourly | WeatherNow) {
  return {
    childAgeMonths: ageMonths,
    situation,
    weather: {
      temperatureC: weather.tempC,
      feelsLikeC: weather.feelsLikeC,
      windMetersPerSecond: weather.windMs,
      precipitationMillimetersPerHour: weather.precipMmH,
      symbolCode: weather.symbolCode,
    },
  } as const;
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toLocaleLowerCase('nb-NO')}${value.slice(1)}`;
}

function changeAction(current: HomeGarment[], future: HomeGarment[]): string | null {
  const futureIds = new Set(future.map((garment) => garment.id));
  const currentIds = new Set(current.map((garment) => garment.id));
  const removed = current.find((garment) => !futureIds.has(garment.id));
  if (removed) return `Ta av ${lowerFirst(removed.name)}`;
  const added = future.find((garment) => !currentIds.has(garment.id));
  if (added) return `Ta på ${lowerFirst(added.name)}`;
  return null;
}

function toHomeGarments(garments: ReturnType<typeof recommendOutfit>['garments']): HomeGarment[] {
  return garments.map((garment) => ({
    ...garment,
    image: getGarmentImage(garment.id),
  }));
}

export function buildHomeViewModel(input: BuildHomeViewModelInput): HomeViewModel {
  const ageMonths = ageInCompleteMonths(input.profile.birthDate, input.evaluatedAt);
  const current = recommendOutfit(engineInput(ageMonths, input.situation, input.weatherNow));
  const garments = toHomeGarments(current.garments);
  const currentIds = current.garments.map((garment) => garment.id).join('|');
  let nextChange: HomeViewModel['nextChange'] = null;

  for (const point of input.hourly) {
    if (point.time.getTime() <= input.evaluatedAt.getTime()) continue;
    const future = recommendOutfit(engineInput(ageMonths, input.situation, point));
    if (future.garments.map((garment) => garment.id).join('|') === currentIds) continue;
    const action = changeAction(garments, toHomeGarments(future.garments));
    if (!action) continue;
    nextChange = {
      time: new Intl.DateTimeFormat('nb-NO', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(point.time),
      action,
    };
    break;
  }

  const childName = input.profile.name.trim() || 'barnet';
  const situationLabel = input.situation === 'stroller' ? 'I vogn' : 'Utelek';
  return {
    engine: current.engine,
    childName,
    situationLabel,
    garmentCount: garments.length,
    garments,
    summary: `${garments.length} plagg for ${childName} · ${situationLabel}`,
    reason: `fordi det føles som ${roundTemperature(input.weatherNow.feelsLikeC)}`,
    weather: {
      temperature: roundTemperature(input.weatherNow.tempC),
      feelsLike: roundTemperature(input.weatherNow.feelsLikeC),
      condition: getConditionLabel(input.weatherNow.symbolCode),
      wind: `${formatDecimal(input.weatherNow.windMs)} m/s`,
      precipitation: `${formatDecimal(input.weatherNow.precipMmH)} mm`,
      icon: getWeatherIcon(input.weatherNow.symbolCode),
      symbolCode: input.weatherNow.symbolCode,
    },
    nextChange,
  };
}
