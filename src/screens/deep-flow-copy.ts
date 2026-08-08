import { displayNameForDbString, garmentDisplayName } from '../data/garment-display-names';
import type { GarmentId } from '../data/garment-illustrations';

export type DeepFlowLanguage = 'da' | 'en' | 'no' | 'sv';

type StatusCopy = Readonly<{
  key: 'varm' | 'perfekt' | 'kald';
  title: string;
  signal: string;
  action: string;
  ariaLabel: string;
}>;

export type DeepFlowCopy = Readonly<{
  common: Readonly<{
    back: string;
    childFallback: string;
    close: string;
    garmentFallback: string;
    garments: (count: number) => string;
    months: (count: number) => string;
  }>;
  finn: Readonly<{
    adjust: string;
    findOutfit: string;
    adjustHeading: string;
    findHeading: string;
    weatherNow: string;
    weatherAtPlace: (place: string) => string;
    temperature: string;
    wind: string;
    precipitation: string;
    weatherInstruments: string;
    activity: string;
    outsideStroller: string;
    inStroller: string;
    calculateAgain: string;
    calculate: string;
    calculating: string;
    calculatingSubline: string;
    layerByLayer: string;
    assembling: string;
    temperatureAria: string;
    windAria: string;
    precipitationAria: string;
    oneDegreeWarmer: string;
    oneDegreeColder: string;
    strongerWind: string;
    weakerWind: string;
    morePrecipitation: string;
    lessPrecipitation: string;
    actualWeatherNow: (value: string) => string;
    temperatureValue: (value: string, band: string) => string;
    windValue: (value: number, band: string) => string;
    precipitationValue: (value: string, band: string) => string;
    trust: string;
    outfit: string;
    outdated: string;
    why: string;
    showWhy: string;
    hideWhy: string;
    sources: string;
    tempBands: readonly [string, string, string, string, string];
    windBands: readonly [string, string, string, string, string];
    precipitationBands: readonly [string, string, string, string, string];
    feelsLike: (temperature: string) => string;
    windNeedsShell: string;
    frostNeedsWool: string;
    rainNeedsShell: string;
    strollerNoHeat: string;
    whyTemperature: (temperature: string, band: string) => string;
    whyStrongWind: (wind: number, band: string) => string;
    whyWindIncluded: (wind: number, band: string) => string;
    whyRain: (precipitation: string, band: string) => string;
    whyStroller: string;
    whyActive: string;
    whySummary: (count: number, weather: string) => string;
    weatherHeadlines: readonly [string, string, string, string, string];
  }>;
  library: Readonly<{
    title: string;
    fullCatalog: string;
    sortAlphabetical: string;
    sortAlphabeticalOn: string;
    search: string;
    clearSearch: string;
    filterAria: string;
    filters: Readonly<Record<'alle' | 'ull' | 'bomull' | 'vanntett' | 'mellomlag' | 'sove' | 'vinter', string>>;
    groups: Readonly<Record<string, string>>;
    materials: Readonly<Record<string, string>>;
    noResults: string;
    noResultsFor: (query: string) => string;
    detailsFor: (name: string, material: string | null) => string;
    add: string;
    addAria: string;
  }>;
  outfit: Readonly<{
    categories: Readonly<Record<string, string>>;
    bodyRegions: Readonly<Record<string, string>>;
    mapUnavailable: string;
    map: string;
    bodyGarment: string;
    swap: string;
    noAlternatives: (garment: string) => string;
    swapGarment: (garment: string) => string;
    dressingOrder: string;
    insideToOutside: string;
    bring: string;
    swapSuggestion: string;
    swapTitle: (source: string, target: string) => string;
    advantages: string;
    tradeoffs: string;
    genericAdvantage: string;
    genericTradeoff: string;
    resultingOutfit: string;
    equipment: string;
    cancel: string;
    chooseOutfit: string;
    reset: string;
    original: string;
    updated: string;
    outfitList: string;
    outfit: string;
    dressBaseFirst: string;
    completeOutfit: string;
    unavailable: string;
    recoveryTitle: string;
    recoveryInstruction: string;
    recoveryButton: string;
    neutralAvatar: string;
    verifiedAvatar: string;
  }>;
  planned: Readonly<{
    closePlanned: string;
    closeToday: string;
    unavailableTitle: string;
    unavailableBody: string;
    todayOutfit: string;
    plannedOutfit: string;
    todaySituation: string;
    plannedSituation: string;
    activities: Readonly<Record<string, string>>;
    sleeping: string;
    awake: string;
    weather: Readonly<Record<string, string>>;
    weatherFallback: string;
    availableToday: string;
    availablePlan: string;
    unavailablePlan: string;
    ageWeather: (months: number, weather: string, temperature: number, feelsLike: number) => string;
    dressingOrder: string;
    equipment: string;
    whyTitle: string;
    why: (subject: string, weather: string, wind: string, precipitation: string) => string;
    outfitSubject: string;
    planSubject: string;
  }>;
  tog: Readonly<{
    title: string;
    recommendationForNight: string;
    forChild: (name: string, months: number) => string;
    recommended: string;
    roomTemperature: string;
    setRoomTemperature: string;
    sliderHint: string;
    sliderValue: (temperature: number, tog: string) => string;
    presetsAria: string;
    dressHeadingStart: string;
    dressHeadingEmphasis: string;
    layerCount: (count: number) => string;
    layerStep: (order: number, position: 'inner' | 'mid' | 'outer') => string;
    skin: string;
    middle: string;
    detailFor: (name: string) => string;
    safety: string;
    safetyTitle: string;
    safetyBody: string;
    zone: (min: number | null, max: number | null, safe: number | null) => string;
  }>;
  warmCold: Readonly<{
    pageTitle: string;
    title: string;
    heroAria: string;
    eyebrow: string;
    recoveryTitle: string;
    recoveryInstruction: string;
    signals: string;
    statuses: readonly [StatusCopy, StatusCopy, StatusCopy];
    footnoteBefore: string;
    footnoteEmphasis: string;
    footnoteAfter: string;
    done: string;
    doneAria: string;
  }>;
  winter: Readonly<{
    overviewBack: string;
    lessonCrumb: (week: number) => string;
    crumb: string;
    title: string;
    intro: string;
    premiumProgress: (week: number, count: number) => string;
    freeProgress: string;
    plus: string;
    recommendedThisWeek: string;
    freeTaste: string;
    recommendedWeek: (week: number) => string;
    weekAria: (week: number, title: string, state: string | null) => string;
  }>;
}>;

export function normalizeDeepFlowLanguage(language: string | null | undefined): DeepFlowLanguage {
  const base = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'sv' || base === 'da') return base;
  if (base === 'no' || base === 'nb' || base === 'nn') return 'no';
  return 'en';
}

const common = (values: Omit<DeepFlowCopy['common'], 'garments' | 'months'> & {
  garmentSingular: string;
  garmentPlural: string;
  monthSingular: string;
  monthPlural: string;
}): DeepFlowCopy['common'] => ({
  ...values,
  garments: (count) => `${count} ${count === 1 ? values.garmentSingular : values.garmentPlural}`,
  months: (count) => `${count} ${count === 1 ? values.monthSingular : values.monthPlural}`,
});

const COPY: Record<DeepFlowLanguage, DeepFlowCopy> = {
  en: {
    common: common({ back: 'Back', childFallback: 'your child', close: 'Close', garmentFallback: 'Garment', garmentSingular: 'garment', garmentPlural: 'garments', monthSingular: 'month', monthPlural: 'months' }),
    finn: {
      adjust: 'Adjust', findOutfit: 'Find an outfit', adjustHeading: "Adjust your child's outfit", findHeading: "Find an outfit for your child", weatherNow: 'Weather now', weatherAtPlace: (place) => `${place} · weather now`, temperature: 'Temperature', wind: 'Wind', precipitation: 'Precipitation', weatherInstruments: 'Weather controls', activity: 'Activity', outsideStroller: 'Out of the stroller', inStroller: 'In the stroller', calculateAgain: 'Calculate again', calculate: 'Find an outfit', calculating: 'Calculating the outfit…', calculatingSubline: 'This only takes a moment.', layerByLayer: 'Layer by layer', assembling: 'putting it together…', temperatureAria: 'Temperature in degrees Celsius', windAria: 'Wind speed in metres per second', precipitationAria: 'Precipitation in millimetres per hour', oneDegreeWarmer: 'One degree warmer', oneDegreeColder: 'One degree colder', strongerWind: 'Stronger wind', weakerWind: 'Weaker wind', morePrecipitation: 'More precipitation', lessPrecipitation: 'Less precipitation', actualWeatherNow: (value) => `Actual weather now: ${value}`, temperatureValue: (value, band) => `${value}, ${band}`, windValue: (value, band) => `${value} metres per second, ${band}`, precipitationValue: (value, band) => `${value} millimetres per hour, ${band}`, trust: 'Temperature, wind and precipitation are assessed together', outfit: 'The outfit', outdated: 'Outdated', why: 'WHY', showWhy: 'Show why', hideWhy: 'Hide why', sources: 'Based on Norwegian public-health guidance · the TOG standard · weather from met.no', tempBands: ['freezing', 'cold', 'mild', 'warm', 'tropical'], windBands: ['calm', 'light', 'fresh', 'strong', 'storm'], precipitationBands: ['dry', 'drizzle', 'moderate', 'heavy', 'very heavy'], feelsLike: (temperature) => `Feels like ${temperature}`, windNeedsShell: 'wind calls for a windproof outer layer', frostNeedsWool: 'freezing weather calls for full wool layers', rainNeedsShell: 'precipitation calls for waterproof outerwear', strollerNoHeat: 'a child in a stroller does not generate much body heat', whyTemperature: (temperature, band) => `It feels like ${temperature} (${band}) — this determines how many layers are needed.`, whyStrongWind: (wind, band) => `Wind at ${wind} m/s (${band}) calls for a windproof outer layer.`, whyWindIncluded: (wind, band) => `Wind at ${wind} m/s (${band}) is included in the calculation.`, whyRain: (precipitation, band) => `${precipitation} mm/h precipitation (${band}) calls for waterproof outerwear.`, whyStroller: 'Your child lies still in the stroller and does not generate much body heat, so an extra layer compensates.', whyActive: 'Your child generates body heat during active play, and the calculation accounts for that.', whySummary: (count, weather) => `Together this gives ${count} ${count === 1 ? 'garment' : 'garments'}, suited to ${weather} weather.`, weatherHeadlines: ['freezing', 'cold', 'mild', 'warm', 'tropical'],
    },
    library: { title: 'Garment library', fullCatalog: 'Full catalogue', sortAlphabetical: 'Sort A–Z', sortAlphabeticalOn: 'A–Z sorting is on. Press to return to dressing order', search: 'Search garments', clearSearch: 'Clear search', filterAria: 'Filter garments', filters: { alle: 'All', ull: 'Wool', bomull: 'Cotton', vanntett: 'Waterproof', mellomlag: 'Mid layer', sove: 'Sleep', vinter: 'Winter' }, groups: { innerst: 'Base layers', mellomlag: 'Mid layers', yttertoy: 'Outer layers', ekstra: 'Accessories', utstyr: 'Equipment' }, materials: { ull: 'Wool', bomull: 'Cotton', vanntett: 'Waterproof' }, noResults: 'No garments found.', noResultsFor: (query) => `No garments match “${query}”.`, detailsFor: (name, material) => `View details for ${name}${material ? ` — ${material}` : ''}`, add: 'Add garment', addAria: 'Add a new garment' },
    outfit: { categories: { innerst: 'Base layer', mellomlag: 'Mid layer', yttertoy: 'Outer layer', ekstra: 'Accessory', utstyr: 'Equipment' }, bodyRegions: { head: 'head', neck: 'neck', torso: 'torso', arms: 'arms', hands: 'hands', hips: 'hips', legs: 'legs', feet: 'feet', whole_body: 'whole body', unknown: 'body garment' }, mapUnavailable: 'The body map is not available for this outfit. The complete outfit is listed below.', map: 'Outfit map', bodyGarment: 'body garment', swap: 'Swap', noAlternatives: (garment) => `No recommended alternatives for ${garment}.`, swapGarment: (garment) => `Swap ${garment}`, dressingOrder: 'Dressing order', insideToOutside: 'Base to outer layer', bring: 'Bring', swapSuggestion: 'Suggested swap', swapTitle: (source, target) => `${source} to ${target}`, advantages: 'Advantages', tradeoffs: 'Trade-offs', genericAdvantage: 'A practical alternative with different material benefits.', genericTradeoff: 'Check warmth, moisture handling and care before choosing.', resultingOutfit: 'Resulting outfit', equipment: 'Equipment', cancel: 'Cancel', chooseOutfit: 'Choose this outfit', reset: 'Reset outfit', original: 'Original outfit', updated: 'The outfit has been updated', outfitList: 'Outfit list', outfit: 'Outfit', dressBaseFirst: 'Put on the base layer first', completeOutfit: 'Complete outfit', unavailable: 'The outfit recommendation is unavailable.', recoveryTitle: 'Check the neck after 10–15 minutes', recoveryInstruction: 'Warm and dry means just right. Damp or sweaty means remove a layer. Cool or cold means add one.', recoveryButton: 'Open the warm-or-cold guide', neutralAvatar: 'Neutral child figure — the outfit is listed separately', verifiedAvatar: 'Verified outfit illustration' },
    planned: { closePlanned: 'Close planned outfit', closeToday: "Close today's outfit", unavailableTitle: 'The planned outfit is unavailable', unavailableBody: 'Access to future outfits is not active. Close this view and return to Plan.', todayOutfit: "Today's outfit", plannedOutfit: 'Planned outfit', todaySituation: "Today's situation", plannedSituation: 'Planned situation', activities: { vogn: 'Stroller', baeresele: 'Carrier', utelek: 'Outdoor play', soevn: 'Sleep' }, sleeping: 'sleeping', awake: 'awake', weather: { clearsky: 'clear skies', fair: 'light cloud', partlycloudy: 'partly cloudy', cloudy: 'cloudy', fog: 'fog', lightrain: 'light rain', lightrainshowers: 'light rain', rain: 'rain', rainshowers: 'rain', heavyrain: 'heavy rain', heavyrainshowers: 'heavy rain', lightsnow: 'light snow', lightsnowshowers: 'light snow', snow: 'snow', snowshowers: 'snow', heavysnow: 'heavy snow', heavysnowshowers: 'heavy snow', sleet: 'sleet', sleetshowers: 'sleet' }, weatherFallback: "today's weather", availableToday: "Today's outfit is available", availablePlan: 'The plan is available', unavailablePlan: 'The plan is unavailable', ageWeather: (months, weather, temperature, feelsLike) => `${months} months · ${weather} · ${temperature}° (feels like ${feelsLike}°)`, dressingOrder: 'Dressing order', equipment: 'Equipment', whyTitle: 'Why this outfit?', why: (subject, weather, wind, precipitation) => `${subject} is designed for ${weather}, wind at ${wind} m/s and precipitation at ${precipitation} mm/h.`, outfitSubject: 'The outfit', planSubject: 'The plan' },
    tog: { title: 'Indoor sleep', recommendationForNight: 'Recommendation for tonight', forChild: (name, months) => `For ${name} · ${months} months`, recommended: 'Recommended', roomTemperature: 'Room temperature', setRoomTemperature: 'SET ROOM TEMPERATURE', sliderHint: 'Slide or choose below', sliderValue: (temperature, tog) => `${temperature} degrees Celsius, recommended TOG ${tog}`, presetsAria: 'Preset temperature steps', dressHeadingStart: 'How to', dressHeadingEmphasis: 'dress', layerCount: (count) => `${count} ${count === 1 ? 'layer' : 'layers'}`, layerStep: (order, position) => `Layer ${order} · ${position === 'inner' ? 'Base' : position === 'mid' ? 'Middle' : 'Outer'}`, skin: 'Skin', middle: 'Middle', detailFor: (name) => `View details for ${name}`, safety: 'Safety', safetyTitle: 'Safe-sleep rule', safetyBody: 'Never use a duvet, pillow or loose blankets together with a sleep sack before your child is over one year old.', zone: (min, max, safe) => min === null ? `Comfort zone up to ${max}°${safe === null ? '' : ` · suitable up to ${safe}°`}` : max === null ? `Comfort zone from ${min}°` : `Comfort zone ${min}–${max}°${safe === null ? '' : ` · suitable from ${safe}°`}` },
    warmCold: { pageTitle: 'Too warm or too cold — a checklist for parents', title: 'Too warm or too cold?', heroAria: "Feel your baby's neck", eyebrow: 'TWO-FINGER CHECK', recoveryTitle: 'Check the neck after 10–15 minutes', recoveryInstruction: 'Warm and dry means just right. Damp or sweaty means remove a layer. Cool or cold means add one.', signals: 'Three possible signals', statuses: [{ key: 'varm', title: 'Too warm', signal: 'Damp or sweaty neck', action: 'REMOVE', ariaLabel: 'Too warm. Damp or sweaty neck. Remove one layer.' }, { key: 'perfekt', title: 'Just right', signal: 'Warm and dry neck', action: 'KEEP', ariaLabel: 'Just right. Warm and dry neck. Keep the outfit.' }, { key: 'kald', title: 'Too cold', signal: 'Cool or cold neck', action: 'ADD', ariaLabel: 'Too cold. Cool or cold neck. Add one layer.' }], footnoteBefore: 'Cold hands and feet are normal and do ', footnoteEmphasis: 'not', footnoteAfter: ' mean your child is cold.', done: 'Done', doneAria: 'Done — return to overview' },
    winter: { overviewBack: 'Back to the programme overview', lessonCrumb: (week) => `First winter · week ${week}`, crumb: 'Guide · knowledge', title: 'First winter with a baby', intro: 'Eight short lessons about winter clothing. The programme suggests one a week, but you set the pace. It uses the same public-health guidance as the recommendations in the app.', premiumProgress: (week, count) => `Recommended week ${week} of ${count} · open whenever you like`, freeProgress: 'Suggested pace: one a week · week 1 is free', plus: 'With Babyora Plus', recommendedThisWeek: 'Recommended this week', freeTaste: 'Free preview', recommendedWeek: (week) => `Recommended week ${week}`, weekAria: (week, title, state) => `Week ${week}: ${title}.${state ? ` ${state}.` : ''}` },
  },
  sv: {
    common: common({ back: 'Tillbaka', childFallback: 'barnet', close: 'Stäng', garmentFallback: 'Plagg', garmentSingular: 'plagg', garmentPlural: 'plagg', monthSingular: 'månad', monthPlural: 'månader' }),
    finn: { adjust: 'Justera', findOutfit: 'Hitta kläder', adjustHeading: 'Justera kläderna för ditt barn', findHeading: 'Hitta kläder för ditt barn', weatherNow: 'Vädret nu', weatherAtPlace: (place) => `${place} · vädret nu`, temperature: 'Temperatur', wind: 'Vind', precipitation: 'Nederbörd', weatherInstruments: 'Väderreglage', activity: 'Aktivitet', outsideStroller: 'Utanför vagnen', inStroller: 'I vagnen', calculateAgain: 'Beräkna igen', calculate: 'Hitta kläder', calculating: 'Beräknar kläderna…', calculatingSubline: 'Det tar bara ett ögonblick.', layerByLayer: 'Lager för lager', assembling: 'sätter ihop…', temperatureAria: 'Temperatur i grader Celsius', windAria: 'Vindstyrka i meter per sekund', precipitationAria: 'Nederbörd i millimeter per timme', oneDegreeWarmer: 'En grad varmare', oneDegreeColder: 'En grad kallare', strongerWind: 'Starkare vind', weakerWind: 'Svagare vind', morePrecipitation: 'Mer nederbörd', lessPrecipitation: 'Mindre nederbörd', actualWeatherNow: (value) => `Faktiskt väder nu: ${value}`, temperatureValue: (value, band) => `${value}, ${band}`, windValue: (value, band) => `${value} meter per sekund, ${band}`, precipitationValue: (value, band) => `${value} millimeter per timme, ${band}`, trust: 'Temperatur, vind och nederbörd bedöms tillsammans', outfit: 'Kläderna', outdated: 'Inaktuellt', why: 'VARFÖR', showWhy: 'Visa varför', hideWhy: 'Dölj varför', sources: 'Baserat på norska hälsoråd · TOG-standarden · väder från met.no', tempBands: ['frost', 'kallt', 'milt', 'varmt', 'tropiskt'], windBands: ['lugnt', 'lätt', 'friskt', 'starkt', 'storm'], precipitationBands: ['torrt', 'duggregn', 'måttligt', 'mycket', 'kraftigt'], feelsLike: (temperature) => `Känns som ${temperature}`, windNeedsShell: 'vinden kräver ett vindtätt ytterlager', frostNeedsWool: 'frost kräver hela ullager', rainNeedsShell: 'nederbörd kräver vattentäta ytterkläder', strollerNoHeat: 'i vagnen skapar barnet inte egen värme', whyTemperature: (temperature, band) => `Det känns som ${temperature} (${band}) — det avgör hur många lager som behövs.`, whyStrongWind: (wind, band) => `Vind på ${wind} m/s (${band}) kräver ett vindtätt ytterlager.`, whyWindIncluded: (wind, band) => `Vind på ${wind} m/s (${band}) ingår i beräkningen.`, whyRain: (precipitation, band) => `${precipitation} mm/t nederbörd (${band}) kräver vattentäta ytterkläder.`, whyStroller: 'Barnet ligger stilla i vagnen och skapar inte egen värme, så ett extra lager kompenserar.', whyActive: 'Barnet skapar egen värme under aktiv lek, och beräkningen tar hänsyn till det.', whySummary: (count, weather) => `Tillsammans ger det ${count} plagg, anpassade för ${weather} väder.`, weatherHeadlines: ['frostigt', 'kallt', 'milt', 'varmt', 'tropiskt'] },
    library: { title: 'Plaggbibliotek', fullCatalog: 'Hela katalogen', sortAlphabetical: 'Sortera A–Ö', sortAlphabeticalOn: 'Sortering A–Ö är på. Tryck för att återgå till påklädningsordning', search: 'Sök bland plagg', clearSearch: 'Rensa sökningen', filterAria: 'Filtrera plagg', filters: { alle: 'Alla', ull: 'Ull', bomull: 'Bomull', vanntett: 'Vattentätt', mellomlag: 'Mellanlager', sove: 'Sömn', vinter: 'Vinter' }, groups: { innerst: 'Innerlager', mellomlag: 'Mellanlager', yttertoy: 'Ytterlager', ekstra: 'Tillbehör', utstyr: 'Utrustning' }, materials: { ull: 'Ull', bomull: 'Bomull', vanntett: 'Vattentätt' }, noResults: 'Inga plagg hittades.', noResultsFor: (query) => `Inga plagg matchar ”${query}”.`, detailsFor: (name, material) => `Visa detaljer för ${name}${material ? ` — ${material}` : ''}`, add: 'Lägg till plagg', addAria: 'Lägg till ett nytt plagg' },
    outfit: { categories: { innerst: 'Innerlager', mellomlag: 'Mellanlager', yttertoy: 'Ytterlager', ekstra: 'Tillbehör', utstyr: 'Utrustning' }, bodyRegions: { head: 'huvud', neck: 'hals', torso: 'överkropp', arms: 'armar', hands: 'händer', hips: 'höfter', legs: 'ben', feet: 'fötter', whole_body: 'hela kroppen', unknown: 'kroppsplagg' }, mapUnavailable: 'Kroppskartan är inte tillgänglig för de här kläderna. Alla plagg finns i listan nedan.', map: 'Klädkarta', bodyGarment: 'kroppsplagg', swap: 'Byt', noAlternatives: (garment) => `Inga rekommenderade alternativ för ${garment}.`, swapGarment: (garment) => `Byt ${garment}`, dressingOrder: 'Påklädningsordning', insideToOutside: 'Innerst till ytterst', bring: 'Ta med', swapSuggestion: 'Förslag på byte', swapTitle: (source, target) => `${source} till ${target}`, advantages: 'Fördelar', tradeoffs: 'Avvägningar', genericAdvantage: 'Ett praktiskt alternativ med andra materialfördelar.', genericTradeoff: 'Kontrollera värme, fukthantering och skötsel innan du väljer.', resultingOutfit: 'Så blir kläderna', equipment: 'Utrustning', cancel: 'Avbryt', chooseOutfit: 'Välj de här kläderna', reset: 'Återställ kläderna', original: 'Ursprungliga kläder', updated: 'Kläderna har uppdaterats', outfitList: 'Klädlista', outfit: 'Kläder', dressBaseFirst: 'Ta på innersta lagret först', completeOutfit: 'Alla kläder', unavailable: 'Klädrekommendationen är inte tillgänglig.', recoveryTitle: 'Känn i nacken efter 10–15 minuter', recoveryInstruction: 'Varmt och torrt är lagom. Fuktigt eller svettigt betyder ta av ett lager. Svalt eller kallt betyder lägg till ett.', recoveryButton: 'Öppna guiden för varmt eller kallt', neutralAvatar: 'Neutral barnfigur — kläderna står i listan', verifiedAvatar: 'Verifierad klädillustration' },
    planned: { closePlanned: 'Stäng planerade kläder', closeToday: 'Stäng dagens kläder', unavailableTitle: 'De planerade kläderna är inte tillgängliga', unavailableBody: 'Åtkomst till framtida kläder är inte aktiv. Stäng och gå tillbaka till Planera.', todayOutfit: 'Dagens kläder', plannedOutfit: 'Planerade kläder', todaySituation: 'Dagens situation', plannedSituation: 'Planerad situation', activities: { vogn: 'Vagn', baeresele: 'Bärsele', utelek: 'Utelek', soevn: 'Sömn' }, sleeping: 'sovande', awake: 'vaken', weather: { clearsky: 'klart väder', fair: 'lätt molnighet', partlycloudy: 'delvis molnigt', cloudy: 'molnigt', fog: 'dimma', lightrain: 'lätt regn', lightrainshowers: 'lätt regn', rain: 'regn', rainshowers: 'regn', heavyrain: 'kraftigt regn', heavyrainshowers: 'kraftigt regn', lightsnow: 'lätt snö', lightsnowshowers: 'lätt snö', snow: 'snö', snowshowers: 'snö', heavysnow: 'kraftigt snöfall', heavysnowshowers: 'kraftigt snöfall', sleet: 'snöblandat regn', sleetshowers: 'snöblandat regn' }, weatherFallback: 'dagens väder', availableToday: 'Dagens kläder är tillgängliga', availablePlan: 'Planen är tillgänglig', unavailablePlan: 'Planen är inte tillgänglig', ageWeather: (months, weather, temperature, feelsLike) => `${months} mån · ${weather} · ${temperature}° (känns som ${feelsLike}°)`, dressingOrder: 'Påklädningsordning', equipment: 'Utrustning', whyTitle: 'Varför de här kläderna?', why: (subject, weather, wind, precipitation) => `${subject} är anpassade för ${weather}, vind på ${wind} m/s och nederbörd på ${precipitation} mm/t.`, outfitSubject: 'Kläderna', planSubject: 'Planen' },
    tog: { title: 'Sömn inomhus', recommendationForNight: 'Rekommendation för natten', forChild: (name, months) => `För ${name} · ${months} mån`, recommended: 'Rekommenderat', roomTemperature: 'Rumstemperatur', setRoomTemperature: 'STÄLL IN RUMSTEMPERATUR', sliderHint: 'Dra eller välj nedan', sliderValue: (temperature, tog) => `${temperature} grader Celsius, rekommenderat TOG ${tog}`, presetsAria: 'Förvalda temperatursteg', dressHeadingStart: 'Så', dressHeadingEmphasis: 'klär', layerCount: (count) => `${count} ${count === 1 ? 'lager' : 'lager'}`, layerStep: (order, position) => `Lager ${order} · ${position === 'inner' ? 'Innerst' : position === 'mid' ? 'Mellan' : 'Ytterst'}`, skin: 'Hud', middle: 'Mellan', detailFor: (name) => `Visa detaljer för ${name}`, safety: 'Säkerhet', safetyTitle: 'Regel för säker sömn', safetyBody: 'Använd aldrig täcke, kudde eller lösa filtar tillsammans med sovsäck innan barnet är över ett år.', zone: (min, max, safe) => min === null ? `Komfortzon upp till ${max}°${safe === null ? '' : ` · lämplig upp till ${safe}°`}` : max === null ? `Komfortzon från ${min}°` : `Komfortzon ${min}–${max}°${safe === null ? '' : ` · lämplig från ${safe}°`}` },
    warmCold: { pageTitle: 'För varmt eller för kallt — checklista för föräldrar', title: 'För varmt eller för kallt?', heroAria: 'Känn på barnets nacke', eyebrow: 'TVÅFINGERSTEST', recoveryTitle: 'Känn i nacken efter 10–15 minuter', recoveryInstruction: 'Varmt och torrt är lagom. Fuktigt eller svettigt betyder ta av ett lager. Svalt eller kallt betyder lägg till ett.', signals: 'Tre möjliga signaler', statuses: [{ key: 'varm', title: 'För varmt', signal: 'Fuktig eller svettig nacke', action: 'TA AV', ariaLabel: 'För varmt. Fuktig eller svettig nacke. Ta av ett lager.' }, { key: 'perfekt', title: 'Lagom', signal: 'Varm och torr nacke', action: 'BEHÅLL', ariaLabel: 'Lagom. Varm och torr nacke. Behåll kläderna.' }, { key: 'kald', title: 'För kallt', signal: 'Sval eller kall nacke', action: 'LÄGG TILL', ariaLabel: 'För kallt. Sval eller kall nacke. Lägg till ett lager.' }], footnoteBefore: 'Kalla händer och fötter är normalt och betyder ', footnoteEmphasis: 'inte', footnoteAfter: ' att barnet fryser.', done: 'Klar', doneAria: 'Klar — tillbaka till översikten' },
    winter: { overviewBack: 'Tillbaka till programöversikten', lessonCrumb: (week) => `Första vintern · vecka ${week}`, crumb: 'Guide · kunskap', title: 'Första vintern med en baby', intro: 'Åtta korta lektioner om vinterkläder. Programmet föreslår en i veckan, men du bestämmer takten. Det bygger på samma hälsoråd som rekommendationerna i appen.', premiumProgress: (week, count) => `Rekommenderad vecka ${week} av ${count} · öppna när du vill`, freeProgress: 'Föreslagen takt: en i veckan · vecka 1 är gratis', plus: 'Med Babyora Plus', recommendedThisWeek: 'Rekommenderas denna vecka', freeTaste: 'Gratis smakprov', recommendedWeek: (week) => `Rekommenderad vecka ${week}`, weekAria: (week, title, state) => `Vecka ${week}: ${title}.${state ? ` ${state}.` : ''}` },
  },
  da: {
    common: common({ back: 'Tilbage', childFallback: 'barnet', close: 'Luk', garmentFallback: 'Beklædningsdel', garmentSingular: 'del', garmentPlural: 'dele', monthSingular: 'måned', monthPlural: 'måneder' }),
    finn: { adjust: 'Juster', findOutfit: 'Find tøj', adjustHeading: 'Juster tøjet til dit barn', findHeading: 'Find tøj til dit barn', weatherNow: 'Vejret nu', weatherAtPlace: (place) => `${place} · vejret nu`, temperature: 'Temperatur', wind: 'Vind', precipitation: 'Nedbør', weatherInstruments: 'Vejrregulering', activity: 'Aktivitet', outsideStroller: 'Uden for barnevognen', inStroller: 'I barnevognen', calculateAgain: 'Beregn igen', calculate: 'Find tøj', calculating: 'Beregner tøjet…', calculatingSubline: 'Det tager kun et øjeblik.', layerByLayer: 'Lag for lag', assembling: 'sætter sammen…', temperatureAria: 'Temperatur i grader Celsius', windAria: 'Vindstyrke i meter pr. sekund', precipitationAria: 'Nedbør i millimeter pr. time', oneDegreeWarmer: 'En grad varmere', oneDegreeColder: 'En grad koldere', strongerWind: 'Stærkere vind', weakerWind: 'Svagere vind', morePrecipitation: 'Mere nedbør', lessPrecipitation: 'Mindre nedbør', actualWeatherNow: (value) => `Faktisk vejr nu: ${value}`, temperatureValue: (value, band) => `${value}, ${band}`, windValue: (value, band) => `${value} meter pr. sekund, ${band}`, precipitationValue: (value, band) => `${value} millimeter pr. time, ${band}`, trust: 'Temperatur, vind og nedbør vurderes samlet', outfit: 'Tøjet', outdated: 'Forældet', why: 'HVORFOR', showWhy: 'Vis hvorfor', hideWhy: 'Skjul hvorfor', sources: 'Baseret på norske sundhedsråd · TOG-standarden · vejr fra met.no', tempBands: ['frost', 'koldt', 'mildt', 'varmt', 'tropisk'], windBands: ['stille', 'let', 'frisk', 'stærk', 'storm'], precipitationBands: ['tørt', 'støvregn', 'moderat', 'meget', 'kraftigt'], feelsLike: (temperature) => `Føles som ${temperature}`, windNeedsShell: 'vind kræver et vindtæt yderlag', frostNeedsWool: 'frost kræver alle uldlag', rainNeedsShell: 'nedbør kræver vandtæt overtøj', strollerNoHeat: 'i barnevognen danner barnet ikke egen varme', whyTemperature: (temperature, band) => `Det føles som ${temperature} (${band}) — det afgør, hvor mange lag der er brug for.`, whyStrongWind: (wind, band) => `Vind på ${wind} m/s (${band}) kræver et vindtæt yderlag.`, whyWindIncluded: (wind, band) => `Vind på ${wind} m/s (${band}) indgår i beregningen.`, whyRain: (precipitation, band) => `${precipitation} mm/t nedbør (${band}) kræver vandtæt overtøj.`, whyStroller: 'Barnet ligger stille i barnevognen og danner ikke egen varme, så et ekstra lag kompenserer.', whyActive: 'Barnet danner egen varme under aktiv leg, og beregningen tager højde for det.', whySummary: (count, weather) => `Samlet giver det ${count} dele, tilpasset ${weather} vejr.`, weatherHeadlines: ['frostvejr', 'koldt', 'mildt', 'varmt', 'tropisk'] },
    library: { title: 'Tøjbibliotek', fullCatalog: 'Hele kataloget', sortAlphabetical: 'Sortér A–Å', sortAlphabeticalOn: 'Sortering A–Å er slået til. Tryk for at vende tilbage til påklædningsrækkefølgen', search: 'Søg i tøj', clearSearch: 'Ryd søgningen', filterAria: 'Filtrer tøj', filters: { alle: 'Alle', ull: 'Uld', bomull: 'Bomuld', vanntett: 'Vandtæt', mellomlag: 'Mellemlag', sove: 'Søvn', vinter: 'Vinter' }, groups: { innerst: 'Inderste lag', mellomlag: 'Mellemlag', yttertoy: 'Yderlag', ekstra: 'Tilbehør', utstyr: 'Udstyr' }, materials: { ull: 'Uld', bomull: 'Bomuld', vanntett: 'Vandtæt' }, noResults: 'Der blev ikke fundet noget tøj.', noResultsFor: (query) => `Intet tøj matcher “${query}”.`, detailsFor: (name, material) => `Vis detaljer for ${name}${material ? ` — ${material}` : ''}`, add: 'Tilføj tøj', addAria: 'Tilføj en ny beklædningsdel' },
    outfit: { categories: { innerst: 'Inderste lag', mellomlag: 'Mellemlag', yttertoy: 'Yderlag', ekstra: 'Tilbehør', utstyr: 'Udstyr' }, bodyRegions: { head: 'hoved', neck: 'hals', torso: 'overkrop', arms: 'arme', hands: 'hænder', hips: 'hofter', legs: 'ben', feet: 'fødder', whole_body: 'hele kroppen', unknown: 'kropsbeklædning' }, mapUnavailable: 'Kropskortet er ikke tilgængeligt for dette tøj. Alt tøjet står på listen nedenfor.', map: 'Tøjkort', bodyGarment: 'kropsbeklædning', swap: 'Skift', noAlternatives: (garment) => `Ingen anbefalede alternativer til ${garment}.`, swapGarment: (garment) => `Skift ${garment}`, dressingOrder: 'Påklædningsrækkefølge', insideToOutside: 'Inderst til yderst', bring: 'Tag med', swapSuggestion: 'Forslag til skift', swapTitle: (source, target) => `${source} til ${target}`, advantages: 'Fordele', tradeoffs: 'Afvejninger', genericAdvantage: 'Et praktisk alternativ med andre materialefordele.', genericTradeoff: 'Tjek varme, fugthåndtering og pleje, før du vælger.', resultingOutfit: 'Sådan bliver tøjet', equipment: 'Udstyr', cancel: 'Annuller', chooseOutfit: 'Vælg dette tøj', reset: 'Nulstil tøjet', original: 'Oprindeligt tøj', updated: 'Tøjet er opdateret', outfitList: 'Tøjliste', outfit: 'Tøj', dressBaseFirst: 'Tag det inderste lag på først', completeOutfit: 'Alt tøjet', unavailable: 'Anbefalingen er ikke tilgængelig.', recoveryTitle: 'Mærk i nakken efter 10–15 minutter', recoveryInstruction: 'Varm og tør betyder tilpas. Fugtig eller svedig betyder tag et lag af. Kølig eller kold betyder læg et lag til.', recoveryButton: 'Åbn guiden til varm eller kold', neutralAvatar: 'Neutral barnefigur — tøjet står på listen', verifiedAvatar: 'Verificeret tøjillustration' },
    planned: { closePlanned: 'Luk planlagt tøj', closeToday: 'Luk dagens tøj', unavailableTitle: 'Det planlagte tøj er ikke tilgængeligt', unavailableBody: 'Adgang til fremtidigt tøj er ikke aktiv. Luk og gå tilbage til Planlæg.', todayOutfit: 'Dagens tøj', plannedOutfit: 'Planlagt tøj', todaySituation: 'Dagens situation', plannedSituation: 'Planlagt situation', activities: { vogn: 'Barnevogn', baeresele: 'Bæresele', utelek: 'Udendørs leg', soevn: 'Søvn' }, sleeping: 'sovende', awake: 'vågen', weather: { clearsky: 'klart vejr', fair: 'let skyet', partlycloudy: 'delvist skyet', cloudy: 'skyet', fog: 'tåge', lightrain: 'let regn', lightrainshowers: 'let regn', rain: 'regn', rainshowers: 'regn', heavyrain: 'kraftig regn', heavyrainshowers: 'kraftig regn', lightsnow: 'let sne', lightsnowshowers: 'let sne', snow: 'sne', snowshowers: 'sne', heavysnow: 'kraftigt snefald', heavysnowshowers: 'kraftigt snefald', sleet: 'slud', sleetshowers: 'slud' }, weatherFallback: 'dagens vejr', availableToday: 'Dagens tøj er tilgængeligt', availablePlan: 'Planen er tilgængelig', unavailablePlan: 'Planen er ikke tilgængelig', ageWeather: (months, weather, temperature, feelsLike) => `${months} mdr. · ${weather} · ${temperature}° (føles som ${feelsLike}°)`, dressingOrder: 'Påklædningsrækkefølge', equipment: 'Udstyr', whyTitle: 'Hvorfor dette tøj?', why: (subject, weather, wind, precipitation) => `${subject} er tilpasset ${weather}, vind på ${wind} m/s og nedbør på ${precipitation} mm/t.`, outfitSubject: 'Tøjet', planSubject: 'Planen' },
    tog: { title: 'Søvn indendørs', recommendationForNight: 'Anbefaling til natten', forChild: (name, months) => `Til ${name} · ${months} mdr.`, recommended: 'Anbefalet', roomTemperature: 'Rumtemperatur', setRoomTemperature: 'INDSTIL RUMTEMPERATUR', sliderHint: 'Skub eller vælg nedenfor', sliderValue: (temperature, tog) => `${temperature} grader Celsius, anbefalet TOG ${tog}`, presetsAria: 'Forvalgte temperaturtrin', dressHeadingStart: 'Sådan', dressHeadingEmphasis: 'giver', layerCount: (count) => `${count} ${count === 1 ? 'lag' : 'lag'}`, layerStep: (order, position) => `Lag ${order} · ${position === 'inner' ? 'Inderst' : position === 'mid' ? 'Mellem' : 'Yderst'}`, skin: 'Hud', middle: 'Mellem', detailFor: (name) => `Vis detaljer for ${name}`, safety: 'Sikkerhed', safetyTitle: 'Regel for sikker søvn', safetyBody: 'Brug aldrig dyne, pude eller løse tæpper sammen med sovepose, før barnet er over et år.', zone: (min, max, safe) => min === null ? `Komfortzone op til ${max}°${safe === null ? '' : ` · egnet op til ${safe}°`}` : max === null ? `Komfortzone fra ${min}°` : `Komfortzone ${min}–${max}°${safe === null ? '' : ` · egnet fra ${safe}°`}` },
    warmCold: { pageTitle: 'For varm eller for kold — tjekliste til forældre', title: 'For varm eller for kold?', heroAria: 'Mærk på barnets nakke', eyebrow: 'TOFINGERTEST', recoveryTitle: 'Mærk i nakken efter 10–15 minutter', recoveryInstruction: 'Varm og tør betyder tilpas. Fugtig eller svedig betyder tag et lag af. Kølig eller kold betyder læg et lag til.', signals: 'Tre mulige signaler', statuses: [{ key: 'varm', title: 'For varm', signal: 'Fugtig eller svedig nakke', action: 'TAG AF', ariaLabel: 'For varm. Fugtig eller svedig nakke. Tag et lag af.' }, { key: 'perfekt', title: 'Tilpas', signal: 'Varm og tør nakke', action: 'BEHOLD', ariaLabel: 'Tilpas. Varm og tør nakke. Behold tøjet.' }, { key: 'kald', title: 'For kold', signal: 'Kølig eller kold nakke', action: 'LÆG TIL', ariaLabel: 'For kold. Kølig eller kold nakke. Læg et lag til.' }], footnoteBefore: 'Kolde hænder og fødder er normalt og betyder ', footnoteEmphasis: 'ikke', footnoteAfter: ', at barnet fryser.', done: 'Færdig', doneAria: 'Færdig — tilbage til oversigten' },
    winter: { overviewBack: 'Tilbage til programoversigten', lessonCrumb: (week) => `Første vinter · uge ${week}`, crumb: 'Guide · viden', title: 'Første vinter med en baby', intro: 'Otte korte lektioner om vintertøj. Programmet foreslår én om ugen, men du bestemmer tempoet. Det bygger på de samme sundhedsråd som anbefalingerne i appen.', premiumProgress: (week, count) => `Anbefalet uge ${week} af ${count} · åbn, når du vil`, freeProgress: 'Foreslået tempo: én om ugen · uge 1 er gratis', plus: 'Med Babyora Plus', recommendedThisWeek: 'Anbefalet i denne uge', freeTaste: 'Gratis smagsprøve', recommendedWeek: (week) => `Anbefalet uge ${week}`, weekAria: (week, title, state) => `Uge ${week}: ${title}.${state ? ` ${state}.` : ''}` },
  },
  no: {
    common: common({ back: 'Tilbake', childFallback: 'barnet', close: 'Lukk', garmentFallback: 'Plagg', garmentSingular: 'plagg', garmentPlural: 'plagg', monthSingular: 'md.', monthPlural: 'mnd' }),
    finn: { adjust: 'Juster', findOutfit: 'Finn antrekk', adjustHeading: 'Juster antrekket for barnet ditt', findHeading: 'Finn antrekk for barnet ditt', weatherNow: 'Været nå', weatherAtPlace: (place) => `${place} · været nå`, temperature: 'Temperatur', wind: 'Vind', precipitation: 'Nedbør', weatherInstruments: 'Vær-instrumenter', activity: 'Aktivitet', outsideStroller: 'Utenfor vogn', inStroller: 'I vogn', calculateAgain: 'Beregn på nytt', calculate: 'Finn antrekk', calculating: 'Regner ut antrekket…', calculatingSubline: 'Tar bare et lite øyeblikk.', layerByLayer: 'Lag for lag', assembling: 'setter sammen…', temperatureAria: 'Temperatur i celsius', windAria: 'Vindstyrke i meter per sekund', precipitationAria: 'Nedbør i millimeter per time', oneDegreeWarmer: 'Én grad varmere', oneDegreeColder: 'Én grad kaldere', strongerWind: 'Sterkere vind', weakerWind: 'Svakere vind', morePrecipitation: 'Mer nedbør', lessPrecipitation: 'Mindre nedbør', actualWeatherNow: (value) => `Faktisk vær nå: ${value}`, temperatureValue: (value, band) => `${value}, ${band}`, windValue: (value, band) => `${value} meter per sekund, ${band}`, precipitationValue: (value, band) => `${value} millimeter per time, ${band}`, trust: 'Temperatur, vind og nedbør vurderes sammen', outfit: 'Antrekket', outdated: 'Utdatert', why: 'HVORFOR', showWhy: 'Vis hvorfor', hideWhy: 'Skjul hvorfor', sources: 'Basert på norske offentlige helseråd · TOG-standarden · vær fra met.no', tempBands: ['frost', 'kjølig', 'mildt', 'varmt', 'tropisk'], windBands: ['stille', 'lett', 'frisk', 'sterk', 'storm'], precipitationBands: ['tørt', 'yr', 'moderat', 'mye', 'kraftig'], feelsLike: (temperature) => `Føles som ${temperature}`, windNeedsShell: 'vind krever vindtett ytterlag', frostNeedsWool: 'frost krever fullt ullsett', rainNeedsShell: 'nedbør krever vanntett yttertøy', strollerNoHeat: 'i vogn lager barnet ikke egen varme', whyTemperature: (temperature, band) => `Temperaturen føles som ${temperature} (${band}) — det avgjør hvor mange lag som trengs.`, whyStrongWind: (wind, band) => `Vind på ${wind} m/s (${band}) krever et vindtett ytterlag.`, whyWindIncluded: (wind, band) => `Vind på ${wind} m/s (${band}) er tatt med i beregningen.`, whyRain: (precipitation, band) => `${precipitation} mm/t nedbør (${band}) krever vanntett yttertøy.`, whyStroller: 'Barnet ligger stille i vogn og produserer ikke egen varme — det kompenseres med et ekstra lag.', whyActive: 'Barnet er i aktiv lek og lager egen varme — det er tatt med i beregningen.', whySummary: (count, weather) => `Til sammen gir dette ${count} plagg, tilpasset ${weather} vær.`, weatherHeadlines: ['frost', 'kaldt', 'mildt', 'varmt', 'tropisk'] },
    library: { title: 'Plaggbiblioteket', fullCatalog: 'Hele katalogen', sortAlphabetical: 'Sorter A–Å', sortAlphabeticalOn: 'Sorter A–Å: på. Trykk for å gå tilbake til påkledningsrekkefølge', search: 'Søk i plagg', clearSearch: 'Tøm søket', filterAria: 'Filtrer plagg', filters: { alle: 'Alle', ull: 'Ull', bomull: 'Bomull', vanntett: 'Vanntett', mellomlag: 'Mellomlag', sove: 'Sove', vinter: 'Vinter' }, groups: { innerst: 'Innerlag', mellomlag: 'Mellomlag', yttertoy: 'Ytterlag', ekstra: 'Tilbehør', utstyr: 'Utstyr' }, materials: { ull: 'Ull', bomull: 'Bomull', vanntett: 'Vanntett' }, noResults: 'Fant ingen plagg.', noResultsFor: (query) => `Fant ingen plagg som matcher «${query}».`, detailsFor: (name, material) => `Vis detalj for ${name}${material ? ` — ${material}` : ''}`, add: 'Legg til plagg', addAria: 'Legg til nytt plagg' },
    outfit: { categories: { innerst: 'Innerst', mellomlag: 'Mellomlag', yttertoy: 'Ytterst', ekstra: 'Tilbehør', utstyr: 'Utstyr' }, bodyRegions: { head: 'hode', neck: 'hals', torso: 'overkropp', arms: 'armer', hands: 'hender', hips: 'hofter', legs: 'ben', feet: 'føtter', whole_body: 'hele kroppen', unknown: 'kroppsplagg' }, mapUnavailable: 'Kroppskart er ikke tilgjengelig for dette antrekket. Hele antrekket står i listen nedenfor.', map: 'Antrekkskart', bodyGarment: 'kroppsplagg', swap: 'Bytt', noAlternatives: (garment) => `Ingen anbefalte alternativer for ${garment}.`, swapGarment: (garment) => `Bytt ${garment}`, dressingOrder: 'Påkledningsrekkefølge', insideToOutside: 'Innerst til ytterst', bring: 'Ta med', swapSuggestion: 'Forslag til bytte', swapTitle: (source, target) => `${source} til ${target}`, advantages: 'Fordeler', tradeoffs: 'Avveininger', genericAdvantage: 'Et praktisk alternativ med andre materialfordeler.', genericTradeoff: 'Sjekk varme, fukthåndtering og stell før du velger.', resultingOutfit: 'Slik blir antrekket', equipment: 'Utstyr', cancel: 'Avbryt', chooseOutfit: 'Velg dette antrekket', reset: 'Tilbakestill antrekk', original: 'Opprinnelig antrekk', updated: 'Antrekket er oppdatert', outfitList: 'Antrekksliste', outfit: 'Antrekk', dressBaseFirst: 'Ta på innerst først', completeOutfit: 'Hele antrekket', unavailable: 'Antrekksanbefalingen er ikke tilgjengelig.', recoveryTitle: 'Sjekk nakken etter 10–15 minutter', recoveryInstruction: 'Varm og tørr betyr passe. Klam eller svett betyr ta av ett lag. Kjølig eller kald betyr legg til ett.', recoveryButton: 'Se varm eller kald-guiden', neutralAvatar: 'Nøytral barnefigur — antrekket står i listen', verifiedAvatar: 'Verifisert antrekksillustrasjon' },
    planned: { closePlanned: 'Lukk planlagt antrekk', closeToday: 'Lukk dagens antrekk', unavailableTitle: 'Planlagt antrekk er ikke tilgjengelig', unavailableBody: 'Tilgangen til fremtidige antrekk er ikke aktiv. Lukk og gå tilbake til Planlegg.', todayOutfit: 'Dagens antrekk', plannedOutfit: 'Planlagt antrekk', todaySituation: 'Dagens situasjon', plannedSituation: 'Planlagt situasjon', activities: { vogn: 'Vogn', baeresele: 'Bæresele', utelek: 'Utelek', soevn: 'Søvn' }, sleeping: 'sovende', awake: 'våken', weather: { clearsky: 'klarvær', fair: 'lettskyet', partlycloudy: 'delvis skyet', cloudy: 'skyet', fog: 'tåke', lightrain: 'lett regn', lightrainshowers: 'lett regn', rain: 'regn', rainshowers: 'regn', heavyrain: 'kraftig regn', heavyrainshowers: 'kraftig regn', lightsnow: 'lett snø', lightsnowshowers: 'lett snø', snow: 'snø', snowshowers: 'snø', heavysnow: 'kraftig snø', heavysnowshowers: 'kraftig snø', sleet: 'sludd', sleetshowers: 'sludd' }, weatherFallback: 'været i dag', availableToday: 'Dagens antrekk er tilgjengelig', availablePlan: 'Planen er tilgjengelig', unavailablePlan: 'Planen er ikke tilgjengelig', ageWeather: (months, weather, temperature, feelsLike) => `${months} mnd · ${weather} · ${temperature}° (føles som ${feelsLike}°)`, dressingOrder: 'Påkledningsrekkefølge', equipment: 'Utstyr', whyTitle: 'Hvorfor dette antrekket?', why: (subject, weather, wind, precipitation) => `${subject} er laget for ${weather}, vind på ${wind} m/s og nedbør på ${precipitation} mm/t.`, outfitSubject: 'Antrekket', planSubject: 'Planen' },
    tog: { title: 'Soving innendørs', recommendationForNight: 'Anbefaling for natten', forChild: (name, months) => `For ${name} · ${months} mnd`, recommended: 'Anbefalt', roomTemperature: 'Romtemperatur', setRoomTemperature: 'SETT ROMTEMPERATUR', sliderHint: 'Skyv eller velg under', sliderValue: (temperature, tog) => `${temperature} grader celsius, anbefalt TOG ${tog}`, presetsAria: 'Forhåndsvalgte temperatur-steg', dressHeadingStart: 'Slik', dressHeadingEmphasis: 'kler', layerCount: (count) => `${count} ${count === 1 ? 'lag' : 'lag'}`, layerStep: (order, position) => `Lag ${order} · ${position === 'inner' ? 'Innerst' : position === 'mid' ? 'Mellom' : 'Ytterst'}`, skin: 'Hud', middle: 'Mellom', detailFor: (name) => `Vis detalj for ${name}`, safety: 'Sikkerhet', safetyTitle: 'Trygg-natt-regel', safetyBody: 'Bruk aldri dyne, pute eller løse tepper sammen med sovepose før barnet er over 1 år.', zone: (min, max, safe) => min === null ? `Komfortsone til ${max}°${safe === null ? '' : ` · trygg til ${safe}°`}` : max === null ? `Komfortsone fra ${min}°` : `Komfortsone for ${min}–${max}°${safe === null ? '' : ` · trygg fra ${safe}°`}` },
    warmCold: { pageTitle: 'Varm eller kald — sjekkliste for foreldre', title: 'Varm eller kald?', heroAria: 'Kjenn på babyens nakke', eyebrow: '2-FINGER-TEST', recoveryTitle: 'Sjekk nakken etter 10–15 minutter', recoveryInstruction: 'Varm og tørr betyr passe. Klam eller svett betyr ta av ett lag. Kjølig eller kald betyr legg til ett.', signals: 'Tre mulige signaler', statuses: [{ key: 'varm', title: 'For varm', signal: 'Svett eller fuktig nakke', action: 'TA AV', ariaLabel: 'For varm. Svett eller fuktig nakke. Ta av ett lag.' }, { key: 'perfekt', title: 'Perfekt', signal: 'Varm og tørr nakke', action: 'BEHOLD', ariaLabel: 'Perfekt. Varm og tørr nakke. Behold antrekket.' }, { key: 'kald', title: 'For kald', signal: 'Kjølig eller kald nakke', action: 'LEGG TIL', ariaLabel: 'For kald. Kjølig eller kald nakke. Legg til ett lag.' }], footnoteBefore: 'Kalde hender og føtter er normalt og betyr ', footnoteEmphasis: 'ikke', footnoteAfter: ' at barnet fryser.', done: 'Ferdig', doneAria: 'Ferdig — tilbake til oversikt' },
    winter: { overviewBack: 'Tilbake til programoversikten', lessonCrumb: (week) => `Første vinter · uke ${week}`, crumb: 'Guide · kunnskap', title: 'Første vinter med baby', intro: 'Åtte korte leksjoner om vinterpåkledning. Programmet foreslår én i uka, men du bestemmer tempoet selv. Bygget på de samme offentlige helserådene som anbefalingene i appen.', premiumProgress: (week, count) => `Anbefalt uke ${week} av ${count} · åpne når du vil`, freeProgress: 'Anbefalt tempo: én i uka · uke 1 er gratis', plus: 'Med Babyora Pluss', recommendedThisWeek: 'Anbefalt denne uka', freeTaste: 'Gratis smakebit', recommendedWeek: (week) => `Anbefalt uke ${week}`, weekAria: (week, title, state) => `Uke ${week}: ${title}.${state ? ` ${state}.` : ''}` },
  },
};

export function deepFlowCopyFor(language: string | null | undefined): DeepFlowCopy {
  return COPY[normalizeDeepFlowLanguage(language)];
}

export function localizedGarmentDisplayName(
  raw: string,
  language: string | null | undefined,
): string {
  const normalized = normalizeDeepFlowLanguage(language);
  const localized = displayNameForDbString(raw, normalized);
  if (normalized === 'no') return localized;
  return localized.trim().length > 0 ? localized : COPY[normalized].common.garmentFallback;
}

export function localizedGarmentIdName(
  id: GarmentId,
  language: string | null | undefined,
): string {
  const normalized = normalizeDeepFlowLanguage(language);
  const localized = garmentDisplayName(id, normalized);
  if (normalized === 'no') return localized;
  return localized.trim().length > 0 ? localized : COPY[normalized].common.garmentFallback;
}

export function localeTagFor(language: string | null | undefined): string {
  switch (normalizeDeepFlowLanguage(language)) {
    case 'sv': return 'sv-SE';
    case 'da': return 'da-DK';
    case 'no': return 'nb-NO';
    default: return 'en-GB';
  }
}
