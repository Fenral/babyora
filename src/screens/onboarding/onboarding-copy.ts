import type { MaterialPreference } from '../../lib/clothing-engine-v2/types.js';
import type { SupportedLanguage } from '../../i18n/language-policy.js';

export type SelectableMaterialPreference = Exclude<
  MaterialPreference,
  'avoid_wool'
>;

export type RichHeading = Readonly<{
  before: string;
  emphasis: string;
  after: string;
}>;

export type MaterialOptionCopy = Readonly<{
  label: string;
  description: string;
  advantage: string;
  tradeoff: string;
}>;

export type OnboardingMaterialCopy = Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  legend: string;
  advantageLabel: string;
  tradeoffLabel: string;
  options: Readonly<Record<SelectableMaterialPreference, MaterialOptionCopy>>;
  reassurance: string;
}>;

export type OnboardingCopy = Readonly<{
  months: readonly string[];
  childFallback: string;
  childFallbackCapitalized: string;
  age: Readonly<{
    underOneMonth: string;
    months: (count: number) => string;
    years: (count: number) => string;
    yearsAndMonths: (years: number, months: number) => string;
  }>;
  navigation: Readonly<{
    back: string;
    progress: (step: number, total: number) => string;
    completed: string;
  }>;
  step1: Readonly<{
    cardAriaLabel: string;
    title: string;
    intro: string;
    fieldLabel: string;
    placeholder: string;
    privacyHint: string;
    previewLabel: string;
    previewBefore: string;
    previewAfter: string;
  }>;
  step2: Readonly<{
    eyebrow: string;
    title: (childName: string) => RichHeading;
    intro: string;
    dateLabel: string;
    chooseDate: string;
    selectedAgePrefix: (childName: string) => string;
    selectedAgeSuffix: string;
    pickerHint: string;
  }>;
  step3: Readonly<{
    eyebrow: string;
    title: RichHeading;
    intro: string;
    currentPosition: string;
    homeWeatherHint: string;
    locating: string;
    useMyPosition: string;
    searchPlace: string;
    searchInputLabel: string;
    searchPlaceholder: string;
    placesLabel: string;
    searchMore: string;
    resultCount: (count: number) => string;
    noResultsYet: string;
    error: string;
  }>;
  material: OnboardingMaterialCopy;
  step5: Readonly<{
    eyebrow: string;
    title: (childName: string) => RichHeading;
    intro: string;
    summaryLabel: string;
    nameLabel: string;
    birthdayLabel: string;
    placeLabel: string;
    materialLabel: string;
    editName: string;
    editBirthday: string;
    editPlace: string;
    editMaterial: string;
    localStorageHint: string;
    disclaimer: string;
  }>;
  step6: Readonly<{
    eyebrow: string;
    title: (childName: string) => RichHeading;
    intro: string;
    featuresLabel: string;
    todayAt: (city: string) => string;
    localWeather: string;
    layersTitle: string;
    layersDescription: (age: string) => string;
  }>;
  actions: Readonly<{
    continue: string;
    continueWithPlace: (city: string) => string;
    chooseHome: string;
    createFirstOutfit: string;
    showTodayOutfit: string;
  }>;
  formatLongDate: (day: number, month: string, year: number) => string;
}>;

const ENGLISH = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  childFallback: 'your baby',
  childFallbackCapitalized: 'Your baby',
  age: {
    underOneMonth: 'under 1 month',
    months: (count) => `${count} ${count === 1 ? 'month' : 'months'}`,
    years: (count) => `${count} ${count === 1 ? 'year' : 'years'}`,
    yearsAndMonths: (years, months) =>
      `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`,
  },
  navigation: {
    back: 'Back',
    progress: (step, total) => `Step ${step} of ${total}`,
    completed: 'Setup complete. Welcome.',
  },
  step1: {
    cardAriaLabel: 'Name or nickname',
    title: 'Who are we dressing?',
    intro: 'Use a name or nickname if you want to make the recommendations personal.',
    fieldLabel: 'Name or nickname',
    placeholder: 'For example, Iver',
    privacyHint: 'Used only in the text and stored only on this phone.',
    previewLabel: 'The name appears in recommendations',
    previewBefore: '“Then we’re ready for ',
    previewAfter: '”',
  },
  step2: {
    eyebrow: 'Age',
    title: (childName) => ({ before: `When was ${childName} `, emphasis: 'born', after: '?' }),
    intro: 'Age affects how warmly your child should be dressed.',
    dateLabel: 'Date of birth',
    chooseDate: 'Choose a date',
    selectedAgePrefix: (childName) => `${childName} is `,
    selectedAgeSuffix: ' old',
    pickerHint: 'Your phone’s standard date picker will open.',
  },
  step3: {
    eyebrow: 'Home location',
    title: { before: 'Where is ', emphasis: 'home', after: '?' },
    intro: 'The free version gives today’s recommendation for one fixed home location.',
    currentPosition: 'Your current position',
    homeWeatherHint: 'Used as the home location for today’s weather',
    locating: 'Finding your location…',
    useMyPosition: 'Use my position',
    searchPlace: 'Search for a place',
    searchInputLabel: 'Search for a city or place',
    searchPlaceholder: 'Search, for example Oslo',
    placesLabel: 'Places',
    searchMore: 'Searching… try adding more letters',
    resultCount: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
    noResultsYet: 'No results yet',
    error: 'Your position is unavailable. Search for your home location instead.',
  },
  material: {
    eyebrow: 'Materials',
    title: 'Which materials work for you?',
    intro: 'Wool, fleece and cotton do different jobs. Choose what you reach for first; Babyora only substitutes within the same layer.',
    legend: 'Preferred clothing material',
    advantageLabel: 'Benefit',
    tradeoffLabel: 'Good to know',
    options: {
      best_for_conditions: {
        label: 'Best for the conditions',
        description: 'Babyora chooses based on weather and activity.',
        advantage: 'Adapts to the day’s conditions',
        tradeoff: 'The material may vary between recommendations',
      },
      prefer_wool: {
        label: 'Wool first',
        description: 'Wool appears first when it suits the layer and conditions.',
        advantage: 'Helps manage temperature and moisture',
        tradeoff: 'Usually needs gentler care',
      },
      prefer_fleece: {
        label: 'Fleece first',
        description: 'Fleece appears first when it serves the same purpose.',
        advantage: 'Lightweight and quick-drying',
        tradeoff: 'Offers less wind protection on its own',
      },
      prefer_cotton: {
        label: 'Cotton first',
        description: 'Cotton appears close to skin when conditions are mild, dry and calm.',
        advantage: 'Soft, familiar and easy to wash',
        tradeoff: 'Holds moisture, so it does not replace wool or synthetics in cold or wet weather',
      },
    },
    reassurance: 'This is a preference, not a rule. Alternatives stay visible, and weather and safety always come first.',
  },
  step5: {
    eyebrow: 'Almost done',
    title: (childName) => ({ before: 'Everything is ', emphasis: 'ready', after: ` for ${childName}` }),
    intro: 'Check the details before Babyora creates the first recommendation.',
    summaryLabel: 'Summary',
    nameLabel: 'Name',
    birthdayLabel: 'Date of birth',
    placeLabel: 'Place',
    materialLabel: 'Material choice',
    editName: 'Edit name',
    editBirthday: 'Edit date of birth',
    editPlace: 'Edit place',
    editMaterial: 'Edit material choice',
    localStorageHint: 'The details are stored on this device and can be changed at any time.',
    disclaimer: 'Recommendations are guidance and do not replace your own judgment or advice from a healthcare professional. Always keep an eye on your child—you know them best.',
  },
  step6: {
    eyebrow: 'Babyora is ready',
    title: (childName) => ({ before: 'Today’s recommendation is ready for ', emphasis: childName, after: '' }),
    intro: 'Based on age, home location and the weather right now.',
    featuresLabel: 'What Babyora does for you',
    todayAt: (city) => `Today · ${city}`,
    localWeather: 'Local weather from MET.',
    layersTitle: 'Clothes in the right order',
    layersDescription: (age) => `Adapted to ${age} and today’s conditions.`,
  },
  actions: {
    continue: 'Continue',
    continueWithPlace: (city) => `Continue with ${city}`,
    chooseHome: 'Choose a home location',
    createFirstOutfit: 'Create the first outfit',
    showTodayOutfit: 'Show today’s outfit',
  },
  formatLongDate: (day, month, year) => `${month} ${day}, ${year}`,
} satisfies OnboardingCopy;

const SWEDISH = {
  months: [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december',
  ],
  childFallback: 'barnet',
  childFallbackCapitalized: 'Barnet',
  age: {
    underOneMonth: 'under 1 månad',
    months: (count) => `${count} ${count === 1 ? 'månad' : 'månader'}`,
    years: (count) => `${count} år`,
    yearsAndMonths: (years, months) => `${years} år ${months} ${months === 1 ? 'månad' : 'månader'}`,
  },
  navigation: {
    back: 'Tillbaka',
    progress: (step, total) => `Steg ${step} av ${total}`,
    completed: 'Inställningen är klar. Välkommen.',
  },
  step1: {
    cardAriaLabel: 'Namn eller smeknamn',
    title: 'Vem klär vi på?',
    intro: 'Använd ett namn eller smeknamn om du vill göra råden personliga.',
    fieldLabel: 'Namn eller smeknamn',
    placeholder: 'Till exempel Iver',
    privacyHint: 'Används bara i texten och sparas bara på den här telefonen.',
    previewLabel: 'Namnet används i råden',
    previewBefore: '”Då är vi redo för ',
    previewAfter: '”',
  },
  step2: {
    eyebrow: 'Ålder',
    title: (childName) => ({ before: 'När ', emphasis: 'föddes', after: ` ${childName}?` }),
    intro: 'Åldern påverkar hur varmt barnet bör kläs.',
    dateLabel: 'Födelsedatum',
    chooseDate: 'Välj datum',
    selectedAgePrefix: (childName) => `${childName} är `,
    selectedAgeSuffix: ' gammal',
    pickerHint: 'Telefonens vanliga datumväljare öppnas.',
  },
  step3: {
    eyebrow: 'Hemort',
    title: { before: 'Var är ni ', emphasis: 'hemma', after: '?' },
    intro: 'Gratisversionen ger dagens råd för en fast hemort.',
    currentPosition: 'Din nuvarande position',
    homeWeatherHint: 'Används som hemort för dagens väder',
    locating: 'Hittar din position…',
    useMyPosition: 'Använd min position',
    searchPlace: 'Sök efter en plats',
    searchInputLabel: 'Sök efter stad eller plats',
    searchPlaceholder: 'Sök, till exempel Stockholm',
    placesLabel: 'Platser',
    searchMore: 'Söker… skriv gärna fler bokstäver',
    resultCount: (count) => `${count} ${count === 1 ? 'träff' : 'träffar'}`,
    noResultsYet: 'Inga träffar ännu',
    error: 'Din position är inte tillgänglig. Sök efter hemorten i stället.',
  },
  material: {
    eyebrow: 'Material',
    title: 'Vilka material passar er?',
    intro: 'Ull, fleece och bomull fyller olika funktioner. Välj det ni brukar ta först; Babyora byter bara inom samma lager.',
    legend: 'Föredraget klädmaterial',
    advantageLabel: 'Fördel',
    tradeoffLabel: 'Bra att veta',
    options: {
      best_for_conditions: {
        label: 'Bäst för förhållandena',
        description: 'Babyora väljer utifrån väder och aktivitet.',
        advantage: 'Anpassas efter dagens förhållanden',
        tradeoff: 'Materialet kan variera mellan råden',
      },
      prefer_wool: {
        label: 'Ull först',
        description: 'Ull visas först när det passar lagret och förhållandena.',
        advantage: 'Hanterar temperatur och fukt väl',
        tradeoff: 'Behöver oftast skonsammare tvätt',
      },
      prefer_fleece: {
        label: 'Fleece först',
        description: 'Fleece visas först när det fyller samma funktion.',
        advantage: 'Lätt och snabbtorkande',
        tradeoff: 'Ger mindre vindskydd på egen hand',
      },
      prefer_cotton: {
        label: 'Bomull först',
        description: 'Bomull visas närmast huden när det är milt, torrt och lugnt.',
        advantage: 'Mjukt, välbekant och lättvättat',
        tradeoff: 'Binder fukt och ersätter därför inte ull eller syntet i kyla och väta',
      },
    },
    reassurance: 'Det här är en preferens, inte en regel. Alternativ visas och väder och säkerhet går alltid först.',
  },
  step5: {
    eyebrow: 'Nästan klart',
    title: (childName) => ({ before: 'Allt är ', emphasis: 'klart', after: ` för ${childName}` }),
    intro: 'Kontrollera uppgifterna innan Babyora skapar det första rådet.',
    summaryLabel: 'Sammanfattning',
    nameLabel: 'Namn',
    birthdayLabel: 'Födelsedatum',
    placeLabel: 'Plats',
    materialLabel: 'Materialval',
    editName: 'Ändra namn',
    editBirthday: 'Ändra födelsedatum',
    editPlace: 'Ändra plats',
    editMaterial: 'Ändra materialval',
    localStorageHint: 'Uppgifterna sparas på enheten och kan ändras när som helst.',
    disclaimer: 'Rekommendationerna är vägledande och ersätter inte ditt eget omdöme eller råd från vårdpersonal. Håll alltid uppsikt över barnet – du känner det bäst.',
  },
  step6: {
    eyebrow: 'Babyora är redo',
    title: (childName) => ({ before: 'Dagens råd är klart för ', emphasis: childName, after: '' }),
    intro: 'Baserat på ålder, hemort och vädret just nu.',
    featuresLabel: 'Det Babyora gör för dig',
    todayAt: (city) => `I dag · ${city}`,
    localWeather: 'Lokalt väder från MET.',
    layersTitle: 'Plagg i rätt ordning',
    layersDescription: (age) => `Anpassat efter ${age} och dagens förhållanden.`,
  },
  actions: {
    continue: 'Fortsätt',
    continueWithPlace: (city) => `Fortsätt med ${city}`,
    chooseHome: 'Välj hemort',
    createFirstOutfit: 'Skapa den första klädseln',
    showTodayOutfit: 'Visa dagens klädsel',
  },
  formatLongDate: (day, month, year) => `${day} ${month} ${year}`,
} satisfies OnboardingCopy;

const DANISH = {
  months: [
    'januar', 'februar', 'marts', 'april', 'maj', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'december',
  ],
  childFallback: 'barnet',
  childFallbackCapitalized: 'Barnet',
  age: {
    underOneMonth: 'under 1 måned',
    months: (count) => `${count} ${count === 1 ? 'måned' : 'måneder'}`,
    years: (count) => `${count} år`,
    yearsAndMonths: (years, months) => `${years} år ${months} ${months === 1 ? 'måned' : 'måneder'}`,
  },
  navigation: {
    back: 'Tilbage',
    progress: (step, total) => `Trin ${step} af ${total}`,
    completed: 'Opsætningen er færdig. Velkommen.',
  },
  step1: {
    cardAriaLabel: 'Navn eller kælenavn',
    title: 'Hvem klæder vi på?',
    intro: 'Brug et navn eller kælenavn, hvis du vil gøre rådene personlige.',
    fieldLabel: 'Navn eller kælenavn',
    placeholder: 'For eksempel Iver',
    privacyHint: 'Bruges kun i teksten og gemmes kun på denne telefon.',
    previewLabel: 'Navnet bruges i rådene',
    previewBefore: '”Så er vi klar til ',
    previewAfter: '”',
  },
  step2: {
    eyebrow: 'Alder',
    title: (childName) => ({ before: `Hvornår er ${childName} `, emphasis: 'født', after: '?' }),
    intro: 'Alderen påvirker, hvor varmt barnet bør klædes på.',
    dateLabel: 'Fødselsdato',
    chooseDate: 'Vælg dato',
    selectedAgePrefix: (childName) => `${childName} er `,
    selectedAgeSuffix: ' gammel',
    pickerHint: 'Telefonens almindelige datovælger åbnes.',
  },
  step3: {
    eyebrow: 'Hjemsted',
    title: { before: 'Hvor er I ', emphasis: 'hjemme', after: '?' },
    intro: 'Gratisversionen giver dagens råd for ét fast hjemsted.',
    currentPosition: 'Din nuværende position',
    homeWeatherHint: 'Bruges som hjemsted for dagens vejr',
    locating: 'Finder din position…',
    useMyPosition: 'Brug min position',
    searchPlace: 'Søg efter et sted',
    searchInputLabel: 'Søg efter by eller sted',
    searchPlaceholder: 'Søg, for eksempel København',
    placesLabel: 'Steder',
    searchMore: 'Søger… skriv gerne flere bogstaver',
    resultCount: (count) => `${count} ${count === 1 ? 'resultat' : 'resultater'}`,
    noResultsYet: 'Ingen resultater endnu',
    error: 'Din position er ikke tilgængelig. Søg efter hjemstedet i stedet.',
  },
  material: {
    eyebrow: 'Materialer',
    title: 'Hvilke materialer passer hos jer?',
    intro: 'Uld, fleece og bomuld har forskellige funktioner. Vælg det, I oftest griber efter; Babyora bytter kun inden for samme lag.',
    legend: 'Foretrukket tøjmateriale',
    advantageLabel: 'Fordel',
    tradeoffLabel: 'Værd at vide',
    options: {
      best_for_conditions: {
        label: 'Bedst til forholdene',
        description: 'Babyora vælger ud fra vejret og aktiviteten.',
        advantage: 'Tilpasses dagens forhold',
        tradeoff: 'Materialet kan variere mellem rådene',
      },
      prefer_wool: {
        label: 'Uld først',
        description: 'Uld vises først, når det passer til laget og forholdene.',
        advantage: 'Håndterer temperatur og fugt godt',
        tradeoff: 'Kræver som regel mere skånsom pleje',
      },
      prefer_fleece: {
        label: 'Fleece først',
        description: 'Fleece vises først, når det udfylder samme funktion.',
        advantage: 'Let og hurtigtørrende',
        tradeoff: 'Giver mindre vindbeskyttelse alene',
      },
      prefer_cotton: {
        label: 'Bomuld først',
        description: 'Bomuld vises inderst, når vejret er mildt, tørt og roligt.',
        advantage: 'Blødt, velkendt og let at vaske',
        tradeoff: 'Holder på fugt og erstatter derfor ikke uld eller syntet i kulde og regn',
      },
    },
    reassurance: 'Det er en præference, ikke en regel. Alternativer vises, og vejr og sikkerhed kommer altid først.',
  },
  step5: {
    eyebrow: 'Næsten færdig',
    title: (childName) => ({ before: 'Alt er ', emphasis: 'klar', after: ` til ${childName}` }),
    intro: 'Kontrollér oplysningerne, før Babyora laver det første råd.',
    summaryLabel: 'Oversigt',
    nameLabel: 'Navn',
    birthdayLabel: 'Fødselsdato',
    placeLabel: 'Sted',
    materialLabel: 'Materialevalg',
    editName: 'Rediger navn',
    editBirthday: 'Rediger fødselsdato',
    editPlace: 'Rediger sted',
    editMaterial: 'Rediger materialevalg',
    localStorageHint: 'Oplysningerne gemmes på enheden og kan ændres når som helst.',
    disclaimer: 'Anbefalingerne er vejledende og erstatter ikke din egen vurdering eller råd fra sundhedspersonale. Hold altid øje med barnet – du kender det bedst.',
  },
  step6: {
    eyebrow: 'Babyora er klar',
    title: (childName) => ({ before: 'Dagens råd er klar til ', emphasis: childName, after: '' }),
    intro: 'Baseret på alder, hjemsted og vejret lige nu.',
    featuresLabel: 'Det Babyora gør for dig',
    todayAt: (city) => `I dag · ${city}`,
    localWeather: 'Lokalt vejr fra MET.',
    layersTitle: 'Tøj i den rigtige rækkefølge',
    layersDescription: (age) => `Tilpasset ${age} og dagens forhold.`,
  },
  actions: {
    continue: 'Fortsæt',
    continueWithPlace: (city) => `Fortsæt med ${city}`,
    chooseHome: 'Vælg hjemsted',
    createFirstOutfit: 'Lav det første sæt tøj',
    showTodayOutfit: 'Vis dagens tøj',
  },
  formatLongDate: (day, month, year) => `${day}. ${month} ${year}`,
} satisfies OnboardingCopy;

const NORWEGIAN = {
  months: [
    'januar', 'februar', 'mars', 'april', 'mai', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'desember',
  ],
  childFallback: 'babyen',
  childFallbackCapitalized: 'Babyen',
  age: {
    underOneMonth: 'under 1 mnd',
    months: (count) => `${count} mnd`,
    years: (count) => `${count} år`,
    yearsAndMonths: (years, months) => `${years} år ${months} mnd`,
  },
  navigation: {
    back: 'Tilbake',
    progress: (step, total) => `Steg ${step} av ${total}`,
    completed: 'Onboarding fullført. Velkommen.',
  },
  step1: {
    cardAriaLabel: 'Navn eller kallenavn',
    title: 'Hvem kler vi på?',
    intro: 'Bruk navn eller kallenavn hvis du vil gjøre rådene personlige.',
    fieldLabel: 'Navn eller kallenavn',
    placeholder: 'F.eks. Iver',
    privacyHint: 'Brukes bare i teksten og lagres bare på denne telefonen.',
    previewLabel: 'Navnet brukes i rådene',
    previewBefore: '«Da er vi klare for ',
    previewAfter: '»',
  },
  step2: {
    eyebrow: 'Alder',
    title: (childName) => ({ before: `Når er ${childName} `, emphasis: 'født', after: '?' }),
    intro: 'Alder påvirker hvor varmt barnet bør kles.',
    dateLabel: 'Fødselsdato',
    chooseDate: 'Velg dato',
    selectedAgePrefix: (childName) => `${childName} er `,
    selectedAgeSuffix: ' gammel',
    pickerHint: 'Den vanlige datovelgeren på telefonen åpnes.',
  },
  step3: {
    eyebrow: 'Hjemsted',
    title: { before: 'Hvor er dere ', emphasis: 'hjemme', after: '?' },
    intro: 'Gratisversjonen gir dagens råd for ett fast hjemsted.',
    currentPosition: 'Din posisjon',
    homeWeatherHint: 'Brukes som hjemsted for dagens vær',
    locating: 'Finner stedet…',
    useMyPosition: 'Bruk posisjonen min',
    searchPlace: 'Søk etter sted',
    searchInputLabel: 'Søk etter by eller sted',
    searchPlaceholder: 'Søk, f.eks. Trondheim',
    placesLabel: 'Steder',
    searchMore: 'Søker … skriv gjerne mer',
    resultCount: (count) => `${count} treff`,
    noResultsYet: 'Ingen treff ennå',
    error: 'Posisjon er ikke tilgjengelig. Søk etter hjemstedet i stedet.',
  },
  material: {
    eyebrow: 'Materialer',
    title: 'Hvilke materialer passer hos dere?',
    intro: 'Ull, fleece og bomull gjør ulike jobber. Velg det dere oftest griper etter; Babyora bytter bare innenfor samme lag.',
    legend: 'Foretrukket klesmateriale',
    advantageLabel: 'Fordel',
    tradeoffLabel: 'Verdt å vite',
    options: {
      best_for_conditions: {
        label: 'Best for forholdene',
        description: 'Babyora velger etter vær og aktivitet.',
        advantage: 'Tilpasses forholdene den dagen',
        tradeoff: 'Materialet kan variere mellom rådene',
      },
      prefer_wool: {
        label: 'Ull først',
        description: 'Ull vises først når det passer laget og forholdene.',
        advantage: 'Håndterer temperatur og fukt godt',
        tradeoff: 'Trenger som regel skånsommere stell',
      },
      prefer_fleece: {
        label: 'Fleece først',
        description: 'Fleece vises først når det gjør samme jobb.',
        advantage: 'Lett og hurtigtørkende',
        tradeoff: 'Gir mindre vindbeskyttelse alene',
      },
      prefer_cotton: {
        label: 'Bomull først',
        description: 'Bomull vises innerst når det er mildt, tørt og rolig.',
        advantage: 'Mykt, kjent og enkelt å vaske',
        tradeoff: 'Holder på fukt og erstatter derfor ikke ull eller syntet i kulde og regn',
      },
    },
    reassurance: 'Dette er en preferanse, ikke en regel. Alternativer vises, og vær og sikkerhet kommer alltid først.',
  },
  step5: {
    eyebrow: 'Nesten ferdig',
    title: (childName) => ({ before: 'Alt er ', emphasis: 'klart', after: ` for ${childName}` }),
    intro: 'Kontroller opplysningene før Babyora lager det første rådet.',
    summaryLabel: 'Sammendrag',
    nameLabel: 'Navn',
    birthdayLabel: 'Bursdag',
    placeLabel: 'Sted',
    materialLabel: 'Materialvalg',
    editName: 'Endre navn',
    editBirthday: 'Endre bursdag',
    editPlace: 'Endre sted',
    editMaterial: 'Endre materialvalg',
    localStorageHint: 'Opplysningene lagres på enheten og kan endres når som helst.',
    disclaimer: 'Anbefalingene er veiledende og ikke en erstatning for ditt eget skjønn eller råd fra helsepersonell. Følg alltid med på barnet – det er du som kjenner det best.',
  },
  step6: {
    eyebrow: 'Babyora er klar',
    title: (childName) => ({ before: 'Dagens råd er klart for ', emphasis: childName, after: '' }),
    intro: 'Basert på alder, hjemsted og været akkurat nå.',
    featuresLabel: 'Det vi gjør for deg',
    todayAt: (city) => `I dag · ${city}`,
    localWeather: 'Lokalt vær fra MET.',
    layersTitle: 'Plagg i riktig rekkefølge',
    layersDescription: (age) => `Tilpasset ${age} og dagens forhold.`,
  },
  actions: {
    continue: 'Fortsett',
    continueWithPlace: (city) => `Fortsett med ${city}`,
    chooseHome: 'Velg hjemsted',
    createFirstOutfit: 'Lag første antrekk',
    showTodayOutfit: 'Vis dagens antrekk',
  },
  formatLongDate: (day, month, year) => `${day}. ${month} ${year}`,
} satisfies OnboardingCopy;

/** Feature-local copy; German intentionally uses the safe English fallback. */
export const ONBOARDING_COPY: Readonly<Record<SupportedLanguage, OnboardingCopy>> =
  Object.freeze({
    en: ENGLISH,
    sv: SWEDISH,
    da: DANISH,
    no: NORWEGIAN,
    de: ENGLISH,
  });

export function resolveOnboardingLanguage(language: unknown): SupportedLanguage {
  if (typeof language !== 'string') return 'en';
  const base = language.trim().toLowerCase().split(/[-_]/u)[0];
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'en' || base === 'sv' || base === 'da' || base === 'no' || base === 'de') {
    return base;
  }
  return 'en';
}

export function onboardingCopyFor(language: unknown): OnboardingCopy {
  return ONBOARDING_COPY[resolveOnboardingLanguage(language)];
}

export const SELECTABLE_MATERIAL_PREFERENCES = Object.freeze([
  'best_for_conditions',
  'prefer_wool',
  'prefer_fleece',
  'prefer_cotton',
] as const satisfies readonly SelectableMaterialPreference[]);

export function materialPreferenceLabel(
  preference: MaterialPreference,
  copy: OnboardingMaterialCopy,
): string {
  const selectable = preference === 'avoid_wool' ? 'prefer_fleece' : preference;
  return copy.options[selectable].label;
}
