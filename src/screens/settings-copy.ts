import type { MaterialPreference } from '../lib/clothing-engine-v2/types';

type SelectableMaterialPreference = Exclude<MaterialPreference, 'avoid_wool'>;

export interface MaterialPreferenceSheetCopy {
  readonly title: string;
  readonly intro: string;
  readonly done: string;
  readonly close: string;
  readonly options: Readonly<Record<SelectableMaterialPreference, Readonly<{
    label: string;
    description: string;
  }>>>;
}

export interface SettingsFaqItem {
  readonly q: string;
  readonly a: readonly string[];
}

export interface SettingsLinkItem {
  readonly label: string;
  readonly sub: string;
  readonly href: string;
}

export interface SettingsThirdPartyItem {
  readonly name: string;
  readonly purpose: string;
}

export interface SettingsSecondaryCopy {
  readonly common: {
    readonly close: string;
    readonly cancel: string;
    readonly done: string;
    readonly hourAria: (time: string) => string;
  };
  readonly actions: {
    readonly childAdded: (name: string) => string;
    readonly rateThanks: string;
    readonly rateStoreOpened: string;
    readonly rateWebOpened: string;
    readonly rateUnavailable: string;
    readonly exportSuccess: (filename: string) => string;
    readonly exportFailure: string;
    readonly deleteSuccess: (count: number) => string;
    readonly finishOnboarding: string;
    readonly locationUpdated: (place: string) => string;
    readonly locationFailure: string;
    readonly notificationsBlocked: string;
    readonly morningPermissionRequired: string;
    readonly notificationUnsupported: string;
    readonly weatherChangeEnabled: string;
    readonly weatherPermissionRequired: string;
    readonly notificationRequestFailure: string;
  };
  readonly feedbackMail: {
    readonly subject: (version: string) => string;
    readonly greeting: string;
    readonly diagnostics: string;
    readonly appVersion: (version: string) => string;
    readonly platform: (platform: string) => string;
  };
  readonly materialPreference: {
    readonly rowLabel: string;
    readonly rowDescription: string;
    readonly rowAria: (label: string) => string;
    readonly sheet: MaterialPreferenceSheetCopy;
  };
  readonly morningHour: {
    readonly title: string;
    readonly description: string;
  };
  readonly help: {
    readonly title: string;
    readonly description: string;
    readonly faqAria: string;
    readonly closeAria: string;
    readonly faq: readonly SettingsFaqItem[];
  };
  readonly feedback: {
    readonly title: string;
    readonly description: string;
    readonly details: string;
    readonly diagnosticsAria: string;
    readonly appVersion: string;
    readonly platform: string;
    readonly recipient: string;
    readonly openEmail: string;
    readonly openEmailAria: string;
    readonly cancelAria: string;
  };
  readonly privacy: {
    readonly title: string;
    readonly description: string;
    readonly summaryHeading: string;
    readonly summaryAria: string;
    readonly fullTextHeading: string;
    readonly linksAria: string;
    readonly thirdPartiesHeading: string;
    readonly thirdPartiesAria: string;
    readonly openLinkAria: (label: string) => string;
    readonly closeAria: string;
    readonly summary: readonly SettingsFaqItem[];
    readonly links: readonly SettingsLinkItem[];
    readonly thirdParties: readonly SettingsThirdPartyItem[];
  };
  readonly switchChild: {
    readonly title: string;
    readonly closeAria: string;
    readonly description: string;
    readonly plusNotice: string;
    readonly empty: string;
    readonly unnamed: string;
    readonly plusLabel: string;
    readonly activeStatus: string;
    readonly activeAria: (name: string) => string;
    readonly gatedAria: (name: string) => string;
    readonly switchAria: (name: string) => string;
  };
  readonly referenceHour: {
    readonly title: string;
    readonly description: string;
  };
  readonly addChild: {
    readonly title: string;
    readonly closeAria: string;
    readonly description: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly nameError: string;
    readonly birthDate: string;
    readonly birthDateError: string;
    readonly location: string;
    readonly locationPlaceholder: string;
    readonly locationError: string;
    readonly submit: string;
    readonly submitAria: string;
    readonly cancelAria: string;
  };
  readonly autoLocation: {
    readonly title: string;
    readonly description: string;
    readonly details: string;
    readonly allow: string;
    readonly pending: string;
    readonly allowAria: string;
    readonly cancelAria: string;
  };
  readonly weatherChange: {
    readonly title: string;
    readonly description: string;
    readonly details: string;
    readonly allow: string;
    readonly pending: string;
    readonly allowAria: string;
    readonly cancelAria: string;
  };
  readonly deleteData: {
    readonly title: string;
    readonly irreversible: string;
    readonly description: string;
    readonly deletedItemsAria: string;
    readonly items: readonly string[];
    readonly aftermath: string;
    readonly confirm: string;
    readonly confirmAria: string;
    readonly cancelAria: string;
  };
  readonly weatherSource: {
    readonly title: string;
    readonly closeAria: string;
    readonly description: string;
    readonly details: string;
    readonly readMore: string;
    readonly readMoreAria: string;
  };
  readonly rateApp: {
    readonly title: string;
    readonly closeAria: string;
    readonly description: string;
    readonly details: string;
    readonly confirm: string;
    readonly pending: string;
    readonly confirmAria: string;
    readonly notNow: string;
    readonly notNowAria: string;
  };
}

const DIVIDER = '— — — — — — — — — — — — — — — — — — —';

const ENGLISH: SettingsSecondaryCopy = {
  common: {
    close: 'Close',
    cancel: 'Cancel',
    done: 'Done',
    hourAria: (time) => `Time ${time}`,
  },
  actions: {
    childAdded: (name) => `${name} was added.`,
    rateThanks: 'Thank you! We appreciate your review.',
    rateStoreOpened: 'Opening the store — feel free to leave us a rating there.',
    rateWebOpened: 'Opening the App Store in your browser.',
    rateUnavailable: 'Could not open ratings right now. Try again later.',
    exportSuccess: (filename) => `Data exported — ${filename}`,
    exportFailure: 'Could not export data. Try again.',
    deleteSuccess: (count) => `All local data was deleted (${count} keys).`,
    finishOnboarding: 'Finish setup first.',
    locationUpdated: (place) => `Location updated — weather will be fetched for ${place}.`,
    locationFailure: 'Could not get your location. Try again.',
    notificationsBlocked: 'Notifications are blocked. Turn them on in system settings.',
    morningPermissionRequired: 'You need to allow notifications to turn on the morning reminder.',
    notificationUnsupported: 'Notifications are not supported on this device — your preference was saved.',
    weatherChangeEnabled: 'Weather-change alerts are on.',
    weatherPermissionRequired: 'You need to allow notifications to turn on weather-change alerts.',
    notificationRequestFailure: 'Could not request notification permission. Try again.',
  },
  feedbackMail: {
    subject: (version) => `Babyora feedback v${version}`,
    greeting: 'Hi Babyora team,',
    diagnostics: 'Diagnostics (please leave in place — this helps us troubleshoot):',
    appVersion: (version) => `App version: ${version}`,
    platform: (platform) => `Platform: ${platform}`,
  },
  materialPreference: {
    rowLabel: 'Material preference',
    rowDescription: 'Choose what you usually have available',
    rowAria: (label) => `Material preference — ${label}. Open dialog`,
    sheet: {
      title: 'Material preference',
      intro: 'Choose which material Babyora should prefer when several options suit the weather. Weather and safety always come first.',
      done: 'Done',
      close: 'Close material preference',
      options: {
        best_for_conditions: {
          label: 'Best for the conditions',
          description: 'Babyora chooses based on weather and activity.',
        },
        prefer_wool: {
          label: 'Wool first',
          description: 'Wool appears first when it is a suitable layer.',
        },
        prefer_fleece: {
          label: 'Fleece first',
          description: 'Fleece appears first when it serves the same purpose.',
        },
        prefer_cotton: {
          label: 'Cotton first',
          description: 'Cotton appears first when conditions are mild, dry and calm.',
        },
      },
    },
  },
  morningHour: {
    title: 'Morning reminder time',
    description: 'Choose when Babyora should send today’s clothing suggestion in the morning.',
  },
  help: {
    title: 'Help and guidance',
    description: 'Common questions about Babyora. If you cannot find an answer here, send us feedback from Settings.',
    faqAria: 'Frequently asked questions',
    closeAria: 'Close help and guidance',
    faq: [
      {
        q: 'What is Babyora?',
        a: [
          'Babyora is a Norwegian clothing app for children aged 0–3. We recommend how many layers of wool and cotton to use based on the weather where you are and your child’s age.',
          'The app was made by Norwegian parents in Trondheim — for Norwegian winters, autumns and cold summer mornings.',
        ],
      },
      {
        q: 'How do I change the location?',
        a: [
          'Go to Settings → Weather & location → Location, and enter a town or municipality.',
          'You can also turn on “Use current location” so Babyora gets weather for where the device is right now. We then need location access, which you will be asked for the first time you turn it on.',
        ],
      },
      {
        q: 'Where does the weather come from?',
        a: [
          'Weather data comes from met.no (the Norwegian Meteorological Institute) — the same source as yr.no.',
          'You can view the source under Settings → Weather & location → Weather source.',
        ],
      },
      {
        q: 'How do I turn on notifications?',
        a: [
          'Go to Settings → Notifications and turn on “Morning reminder”. The first time, you will be asked to allow notifications — choose “Allow”.',
          'If notifications are already blocked, turn them on in your phone’s system settings (Settings → Babyora → Notifications).',
          'You can also adjust the morning reminder time by pressing the row text while the reminder is on.',
        ],
      },
    ],
  },
  feedback: {
    title: 'Send feedback',
    description: 'We read everything and reply as quickly as we can. Tell us what you like, what is not working, or what you miss — we are two parents in Trondheim building Babyora alongside our day jobs.',
    details: 'When you press “Open email”, we open your email app with a prepared message. We include a little diagnostic information to help us troubleshoot; you can edit everything before sending.',
    diagnosticsAria: 'Diagnostics included in the email',
    appVersion: 'App version',
    platform: 'Platform',
    recipient: 'Recipient',
    openEmail: 'Open email',
    openEmailAria: 'Open email with prepared feedback',
    cancelAria: 'Cancel — close dialog',
  },
  privacy: {
    title: 'Privacy and terms',
    description: 'Babyora is made in Norway and follows the GDPR. We collect as little data as possible — your child’s profile stays on your device. Below is a short summary and links to the full text.',
    summaryHeading: 'Summary',
    summaryAria: 'Privacy summary',
    fullTextHeading: 'Full text',
    linksAria: 'External links to the full text',
    thirdPartiesHeading: 'Third-party services',
    thirdPartiesAria: 'Third-party services',
    openLinkAria: (label) => `${label} — open in browser`,
    closeAria: 'Close privacy and terms',
    summary: [
      {
        q: 'What does Babyora store about my child?',
        a: [
          'We store only what you enter: name, date of birth and town. This data stays on your device and is never sent to our servers.',
          'If you sign in with a Plus subscription, we also store purchase status with our payment provider (RevenueCat) — not your child’s name or age.',
        ],
      },
      {
        q: 'What data is shared with third parties?',
        a: [
          'Weather data is fetched anonymously from met.no (the Norwegian Meteorological Institute) based on your location or town. We do not send your child’s name or age.',
          'If you turn on “Use current location”, we send your coordinates to met.no to fetch local weather — we do not store the coordinates.',
        ],
      },
      {
        q: 'How is data deleted?',
        a: [
          'Delete all local data by pressing “Log out” at the bottom of Settings, or by uninstalling the app.',
          'If you have Plus, you can also delete your account by emailing hei@babyora.no.',
        ],
      },
    ],
    links: [
      { label: 'Privacy policy', sub: 'Full text on babyora.no', href: 'https://babyora.no/personvern' },
      { label: 'Terms of use', sub: 'Terms, subscriptions and cancellation rights', href: 'https://babyora.no/vilkar' },
    ],
    thirdParties: [
      { name: 'met.no (Norwegian Meteorological Institute)', purpose: 'Weather data · CC BY 4.0' },
      { name: 'Capacitor', purpose: 'Native app framework' },
      { name: 'RevenueCat', purpose: 'Plus subscriptions and receipts' },
    ],
  },
  switchChild: {
    title: 'Switch child',
    closeAria: 'Close Switch child dialog',
    description: 'Choose which child Babyora should show weather and clothing suggestions for.',
    plusNotice: 'Child no. 1 is included. Switching to additional children requires Babyora Plus.',
    empty: 'No children have been added yet.',
    unnamed: 'Unnamed',
    plusLabel: 'Plus',
    activeStatus: 'Active',
    activeAria: (name) => `${name} — active child`,
    gatedAria: (name) => `Switch to ${name} — requires Babyora Plus`,
    switchAria: (name) => `Switch to ${name}`,
  },
  referenceHour: {
    title: 'Reference time',
    description: 'Choose the time used for the weather forecast on the Home screen.',
  },
  addChild: {
    title: 'Add another child',
    closeAria: 'Close Add another child dialog',
    description: 'Babyora can have several children. Each sibling gets a separate profile with a name, age and location. You can switch children from Settings.',
    name: 'Name',
    namePlaceholder: 'For example, Iver',
    nameError: 'Enter a name.',
    birthDate: 'Date of birth',
    birthDateError: 'Choose a valid date of birth (after 1 January 2018).',
    location: 'Location',
    locationPlaceholder: 'For example, Trondheim',
    locationError: 'Enter a place name.',
    submit: 'Add child',
    submitAria: 'Save new child',
    cancelAria: 'Cancel — close dialog',
  },
  autoLocation: {
    title: 'Use current location',
    description: 'Babyora can fetch local weather based on your phone’s location instead of a fixed place. This is useful when you are travelling or at a cabin.',
    details: 'When you press “Allow location”, your phone asks for access. We send only the coordinates anonymously to met.no and do not store your location. You can turn this off again at any time.',
    allow: 'Allow location',
    pending: 'Getting location …',
    allowAria: 'Allow location — ask the phone for access',
    cancelAria: 'Cancel — close without requesting location',
  },
  weatherChange: {
    title: 'Weather-change alerts',
    description: 'Babyora can notify you when the temperature drops by more than 5° since the last check, so you are not caught off guard on your way out with the pram.',
    details: 'When you press “Allow notifications”, your phone asks for access. We send only short reminders from Babyora — no advertising. You can turn notifications off again at any time in Settings.',
    allow: 'Allow notifications',
    pending: 'Requesting permission …',
    allowAria: 'Allow notifications — ask the phone for access',
    cancelAria: 'Cancel — close without turning on weather-change alerts',
  },
  deleteData: {
    title: 'Delete all my data?',
    irreversible: 'This cannot be undone.',
    description: 'All local Babyora data will be deleted from this device:',
    deletedItemsAria: 'What will be deleted',
    items: [
      'Child profiles (name, date of birth, location)',
      'Settings (notifications, theme, location, reference time)',
      'Feedback history and clothing overrides',
      'Tooltip and onboarding status',
    ],
    aftermath: 'You will return to setup and need to configure Babyora again. We recommend exporting your data first if you want to keep it.',
    confirm: 'Yes, delete all data',
    confirmAria: 'Yes, permanently delete all my data',
    cancelAria: 'Cancel — keep my data',
  },
  weatherSource: {
    title: 'Weather source',
    closeAria: 'Close weather source information',
    description: 'We use met.no for weather data.',
    details: 'All weather information in Babyora comes from the Norwegian Meteorological Institute (met.no), the same source as yr.no. Data is provided under the CC BY 4.0 licence, and we send only a location or town anonymously to fetch local weather.',
    readMore: 'Read more at met.no',
    readMoreAria: 'Read more about met.no — open met.no in your browser',
  },
  rateApp: {
    title: 'Rate Babyora',
    closeAria: 'Close Rate Babyora dialog',
    description: 'Do you like Babyora? A short review helps other parents in Norway find the app.',
    details: 'When you press “Leave a review”, your device opens its own App Store or Google Play review window. You can choose a star rating and write a short review — or skip it entirely. It is up to you.',
    confirm: 'Leave a review',
    pending: 'Opening …',
    confirmAria: 'Leave a review — open the App Store or Google Play review prompt',
    notNow: 'Not now',
    notNowAria: 'Not now — close Rate Babyora dialog',
  },
};

const NORWEGIAN: SettingsSecondaryCopy = {
  common: {
    close: 'Lukk',
    cancel: 'Avbryt',
    done: 'Ferdig',
    hourAria: (time) => `Kl. ${time}`,
  },
  actions: {
    childAdded: (name) => `${name} er lagt til.`,
    rateThanks: 'Takk! Vi setter pris på vurderingen din.',
    rateStoreOpened: 'Åpner butikken — gi oss gjerne en stjerne der.',
    rateWebOpened: 'Åpner App Store i nettleseren.',
    rateUnavailable: 'Kunne ikke åpne vurdering akkurat nå. Prøv igjen senere.',
    exportSuccess: (filename) => `Data eksportert — ${filename}`,
    exportFailure: 'Kunne ikke eksportere data. Prøv igjen.',
    deleteSuccess: (count) => `Alle lokale data er slettet (${count} nøkler).`,
    finishOnboarding: 'Fullfør onboarding først.',
    locationUpdated: (place) => `Posisjon oppdatert — vær hentes for ${place}.`,
    locationFailure: 'Kunne ikke hente posisjon. Prøv igjen.',
    notificationsBlocked: 'Varsler er blokkert. Skru på i systeminnstillinger.',
    morningPermissionRequired: 'Du må godta varsler for å skru på morgenvarsel.',
    notificationUnsupported: 'Varsler støttes ikke på denne enheten — preferansen er lagret.',
    weatherChangeEnabled: 'Værendring-varsel er på.',
    weatherPermissionRequired: 'Du må godta varsler for å skru på værendring.',
    notificationRequestFailure: 'Kunne ikke spørre om varsel-tillatelse. Prøv igjen.',
  },
  feedbackMail: {
    subject: (version) => `Tilbakemelding Babyora v${version}`,
    greeting: 'Hei Babyora-teamet,',
    diagnostics: 'Diagnostikk (la stå — hjelper oss å feilsøke):',
    appVersion: (version) => `App-versjon: ${version}`,
    platform: (platform) => `Plattform: ${platform}`,
  },
  materialPreference: {
    rowLabel: 'Materialvalg',
    rowDescription: 'Velg det dere vanligvis har tilgjengelig',
    rowAria: (label) => `Materialvalg — ${label}. Åpne dialog`,
    sheet: {
      title: 'Materialvalg',
      intro: 'Velg hvilket materiale Babyora skal foretrekke når flere alternativer passer til været. Vær og sikkerhet kommer alltid først.',
      done: 'Ferdig',
      close: 'Lukk materialvalg',
      options: {
        best_for_conditions: {
          label: 'Best for forholdene',
          description: 'Babyora velger etter vær og aktivitet.',
        },
        prefer_wool: {
          label: 'Ull først',
          description: 'Ull vises først når det passer som lag.',
        },
        prefer_fleece: {
          label: 'Fleece først',
          description: 'Fleece vises først når det gjør samme jobb.',
        },
        prefer_cotton: {
          label: 'Bomull først',
          description: 'Bomull vises først når forholdene er milde, tørre og rolige.',
        },
      },
    },
  },
  morningHour: {
    title: 'Tidspunkt for morgenvarsel',
    description: 'Velg når på morgenen Babyora skal sende dagens påkledningsforslag.',
  },
  help: {
    title: 'Hjelp og veiledning',
    description: 'Vanlige spørsmål om Babyora. Finner du ikke svar her, send oss en tilbakemelding fra Innstillinger.',
    faqAria: 'Vanlige spørsmål',
    closeAria: 'Lukk hjelp og veiledning',
    faq: [
      {
        q: 'Hva er Babyora?',
        a: [
          'Babyora er en norsk påkledningsapp for barn 0–3 år. Vi anbefaler antall lag ull og bomull basert på været akkurat der du er, og barnets alder.',
          'Appen er laget av norske foreldre i Trondheim — for norske vintre, høster og kalde sommermorgener.',
        ],
      },
      {
        q: 'Hvordan endrer jeg sted?',
        a: [
          'Gå til Innstillinger → Vær & sted → Sted, og skriv inn poststed eller kommune.',
          'Du kan også slå på «Bruk posisjon automatisk» for at Babyora skal hente vær der enheten er akkurat nå. Da trenger vi tilgang til posisjon — du blir spurt første gang du slår det på.',
        ],
      },
      {
        q: 'Hvor henter dere vær fra?',
        a: [
          'Værdata kommer fra met.no (Meteorologisk institutt) — samme kilde som yr.no.',
          'Du kan se kilden under Innstillinger → Vær & sted → Værkilde.',
        ],
      },
      {
        q: 'Hvordan slår jeg på varsler?',
        a: [
          'Gå til Innstillinger → Varsler og slå på «Morgenvarsel». Første gang blir du spurt om å tillate varsler — velg «Tillat».',
          'Hvis varsler er blokkert fra før, må du skru dem på i systeminnstillingene til telefonen (Innstillinger → Babyora → Varsler).',
          'Du kan også justere klokkeslett for morgenvarselet ved å trykke på rad-teksten når varselet er på.',
        ],
      },
    ],
  },
  feedback: {
    title: 'Send tilbakemelding',
    description: 'Vi leser alt og svarer så fort vi kan. Fortell hva du liker, hva som ikke funker, eller hva du savner — vi er to foreldre i Trondheim som bygger Babyora ved siden av jobb.',
    details: 'Når du trykker «Åpne e-post», åpner vi e-postappen din med en ferdig melding. Vi legger ved litt diagnostikk så vi kan feilsøke — du kan redigere alt før du sender.',
    diagnosticsAria: 'Diagnostikk som sendes',
    appVersion: 'App-versjon',
    platform: 'Plattform',
    recipient: 'Mottaker',
    openEmail: 'Åpne e-post',
    openEmailAria: 'Åpne e-post med ferdig tilbakemelding',
    cancelAria: 'Avbryt — lukk dialog',
  },
  privacy: {
    title: 'Personvern og vilkår',
    description: 'Babyora er laget i Norge og følger GDPR. Vi samler så lite data som mulig — barnets profil ligger kun på enheten din. Under finner du et kort sammendrag og lenker til den fulle teksten.',
    summaryHeading: 'Sammendrag',
    summaryAria: 'Sammendrag av personvern',
    fullTextHeading: 'Full tekst',
    linksAria: 'Eksterne lenker til full tekst',
    thirdPartiesHeading: 'Tredjepartsbiblioteker',
    thirdPartiesAria: 'Tredjepartstjenester',
    openLinkAria: (label) => `${label} — åpne i nettleser`,
    closeAria: 'Lukk personvern og vilkår',
    summary: [
      {
        q: 'Hva lagrer Babyora om barnet?',
        a: [
          'Vi lagrer kun det du selv skriver inn: navn, fødselsdato og poststed. Disse dataene blir værende på enheten din og blir aldri sendt til våre servere.',
          'Hvis du logger inn med Plus-abonnement, lagrer vi i tillegg kjøpsstatus hos betalingsleverandøren vår (RevenueCat) — ikke barnets navn eller alder.',
        ],
      },
      {
        q: 'Hvilke data deles med tredjeparter?',
        a: [
          'Værdata hentes anonymt fra met.no (Meteorologisk institutt) basert på posisjon eller poststed. Vi sender ikke barnets navn eller alder dit.',
          'Hvis du har slått på «Bruk posisjon automatisk», sender vi koordinatene dine til met.no for å hente lokalt vær — koordinatene lagres ikke hos oss.',
        ],
      },
      {
        q: 'Hvordan slettes data?',
        a: [
          'Du sletter alle lokale data ved å trykke «Logg ut» nederst i Innstillinger, eller ved å avinstallere appen.',
          'Hvis du har Plus, kan du i tillegg slette kontoen din ved å sende en e-post til hei@babyora.no.',
        ],
      },
    ],
    links: [
      { label: 'Personvernerklæring', sub: 'Full tekst på babyora.no', href: 'https://babyora.no/personvern' },
      { label: 'Vilkår for bruk', sub: 'Vilkår, abonnement og angrerett', href: 'https://babyora.no/vilkar' },
    ],
    thirdParties: [
      { name: 'met.no (Meteorologisk institutt)', purpose: 'Værdata · CC BY 4.0' },
      { name: 'Capacitor', purpose: 'Native app-rammeverk' },
      { name: 'RevenueCat', purpose: 'Plus-abonnement og kvitteringer' },
    ],
  },
  switchChild: {
    title: 'Bytt barn',
    closeAria: 'Lukk Bytt barn-dialog',
    description: 'Velg hvilket barn Babyora skal vise vær- og påkledningsforslag for.',
    plusNotice: 'Barn nr. 1 er inkludert. Å bytte til flere barn krever Babyora Plus.',
    empty: 'Ingen barn lagt til ennå.',
    unnamed: 'Uten navn',
    plusLabel: 'Pluss',
    activeStatus: 'Aktiv',
    activeAria: (name) => `${name} — aktivt barn`,
    gatedAria: (name) => `Bytt til ${name} — krever Babyora Plus`,
    switchAria: (name) => `Bytt til ${name}`,
  },
  referenceHour: {
    title: 'Referansetime',
    description: 'Velg hvilket klokkeslett værvarselet på hjem-skjermen skal hentes fra.',
  },
  addChild: {
    title: 'Legg til nytt barn',
    closeAria: 'Lukk Legg-til-nytt-barn-dialog',
    description: 'Babyora kan ha flere barn — søsken får hver sin profil med navn, alder og sted. Du kan bytte mellom barna fra Innstillinger.',
    name: 'Navn',
    namePlaceholder: 'F.eks. Iver',
    nameError: 'Skriv inn et navn.',
    birthDate: 'Fødselsdato',
    birthDateError: 'Velg en gyldig fødselsdato (etter 1. januar 2018).',
    location: 'Sted',
    locationPlaceholder: 'F.eks. Trondheim',
    locationError: 'Skriv inn et stedsnavn.',
    submit: 'Legg til barn',
    submitAria: 'Lagre nytt barn',
    cancelAria: 'Avbryt — lukk dialog',
  },
  autoLocation: {
    title: 'Bruk posisjon automatisk',
    description: 'Babyora kan hente lokalt vær basert på telefonens posisjon i stedet for et fast sted. Det er praktisk når dere er på reise eller på hytta.',
    details: 'Når du trykker «Tillat posisjon», spør telefonen om tilgang. Vi sender kun koordinatene anonymt til met.no — vi lagrer ikke posisjonen din hos oss. Du kan skru det av igjen når som helst.',
    allow: 'Tillat posisjon',
    pending: 'Henter posisjon …',
    allowAria: 'Tillat posisjon — be telefonen om tilgang',
    cancelAria: 'Avbryt — lukk dialog uten å spørre om posisjon',
  },
  weatherChange: {
    title: 'Værendring-varsel',
    description: 'Babyora kan varsle deg når temperaturen faller mer enn 5° fra siste sjekk — så slipper du å bli overrasket på vei ut med barnevogn.',
    details: 'Når du trykker «Tillat varsler», spør telefonen om tilgang. Vi sender kun korte påminnelser fra Babyora — ingen reklame. Du kan skru varsler av igjen når som helst her i Innstillinger.',
    allow: 'Tillat varsler',
    pending: 'Spør om tillatelse …',
    allowAria: 'Tillat varsler — be telefonen om tilgang',
    cancelAria: 'Avbryt — lukk dialog uten å skru på værendring-varsel',
  },
  deleteData: {
    title: 'Slett alle mine data?',
    irreversible: 'Dette kan ikke angres.',
    description: 'Alle lokale data i Babyora blir slettet fra denne enheten:',
    deletedItemsAria: 'Hva blir slettet',
    items: [
      'Barn-profiler (navn, fødselsdato, sted)',
      'Innstillinger (varsler, tema, posisjon, referansetime)',
      'Tilbakemelding-historikk og plagg-overstyringer',
      'Tooltip- og onboarding-status',
    ],
    aftermath: 'Du blir sendt tilbake til oppstarten og må sette opp Babyora på nytt. Vi anbefaler å eksportere dataene først hvis du vil ta vare på dem.',
    confirm: 'Ja, slett alle data',
    confirmAria: 'Ja, slett alle mine data permanent',
    cancelAria: 'Avbryt — behold dataene mine',
  },
  weatherSource: {
    title: 'Værkilde',
    closeAria: 'Lukk værkilde-info',
    description: 'Vi bruker met.no for værdata.',
    details: 'All værinformasjon i Babyora kommer fra Meteorologisk institutt (met.no) — samme kilde som yr.no. Data leveres under lisensen CC BY 4.0, og vi sender kun posisjon eller poststed anonymt for å hente lokalt vær.',
    readMore: 'Les mer på met.no',
    readMoreAria: 'Les mer om met.no — åpne met.no i nettleseren',
  },
  rateApp: {
    title: 'Vurder Babyora',
    closeAria: 'Lukk vurder-appen-dialog',
    description: 'Liker du Babyora? En kort vurdering hjelper andre norske foreldre å finne appen.',
    details: 'Når du trykker «Gi en vurdering», åpner enheten din sitt eget vurderingsvindu fra App Store eller Google Play. Du kan velge antall stjerner og skrive en kort tekst — eller la være, helt opp til deg.',
    confirm: 'Gi en vurdering',
    pending: 'Åpner …',
    confirmAria: 'Gi en vurdering — åpne App Store eller Google Play sin vurderingsdialog',
    notNow: 'Ikke nå',
    notNowAria: 'Ikke nå — lukk vurder-appen-dialog',
  },
};

const SWEDISH: SettingsSecondaryCopy = {
  common: {
    close: 'Stäng',
    cancel: 'Avbryt',
    done: 'Klar',
    hourAria: (time) => `Kl. ${time}`,
  },
  actions: {
    childAdded: (name) => `${name} har lagts till.`,
    rateThanks: 'Tack! Vi uppskattar ditt omdöme.',
    rateStoreOpened: 'Öppnar butiken — ge oss gärna ett betyg där.',
    rateWebOpened: 'Öppnar App Store i webbläsaren.',
    rateUnavailable: 'Det gick inte att öppna betygsfunktionen just nu. Försök igen senare.',
    exportSuccess: (filename) => `Data exporterades — ${filename}`,
    exportFailure: 'Det gick inte att exportera data. Försök igen.',
    deleteSuccess: (count) => `Alla lokala data har raderats (${count} nycklar).`,
    finishOnboarding: 'Slutför introduktionen först.',
    locationUpdated: (place) => `Platsen uppdaterades — väder hämtas för ${place}.`,
    locationFailure: 'Det gick inte att hämta din plats. Försök igen.',
    notificationsBlocked: 'Notiser är blockerade. Slå på dem i systeminställningarna.',
    morningPermissionRequired: 'Du måste tillåta notiser för att aktivera morgonpåminnelsen.',
    notificationUnsupported: 'Notiser stöds inte på den här enheten — ditt val har sparats.',
    weatherChangeEnabled: 'Notiser om väderförändringar är på.',
    weatherPermissionRequired: 'Du måste tillåta notiser för att aktivera väderförändringar.',
    notificationRequestFailure: 'Det gick inte att be om tillåtelse för notiser. Försök igen.',
  },
  feedbackMail: {
    subject: (version) => `Feedback om Babyora v${version}`,
    greeting: 'Hej Babyora-teamet,',
    diagnostics: 'Diagnostik (låt stå — hjälper oss att felsöka):',
    appVersion: (version) => `Appversion: ${version}`,
    platform: (platform) => `Plattform: ${platform}`,
  },
  materialPreference: {
    rowLabel: 'Materialval',
    rowDescription: 'Välj det ni vanligtvis har till hands',
    rowAria: (label) => `Materialval — ${label}. Öppna dialogrutan`,
    sheet: {
      title: 'Materialval',
      intro: 'Välj vilket material Babyora ska föredra när flera alternativ passar vädret. Väder och säkerhet kommer alltid först.',
      done: 'Klar',
      close: 'Stäng materialval',
      options: {
        best_for_conditions: {
          label: 'Bäst för förhållandena',
          description: 'Babyora väljer utifrån väder och aktivitet.',
        },
        prefer_wool: {
          label: 'Ull först',
          description: 'Ull visas först när det passar som lager.',
        },
        prefer_fleece: {
          label: 'Fleece först',
          description: 'Fleece visas först när det fyller samma funktion.',
        },
        prefer_cotton: {
          label: 'Bomull först',
          description: 'Bomull visas först när förhållandena är milda, torra och lugna.',
        },
      },
    },
  },
  morningHour: {
    title: 'Tid för morgonpåminnelse',
    description: 'Välj när Babyora ska skicka dagens klädförslag på morgonen.',
  },
  help: {
    title: 'Hjälp och vägledning',
    description: 'Vanliga frågor om Babyora. Om du inte hittar svaret här kan du skicka feedback från Inställningar.',
    faqAria: 'Vanliga frågor',
    closeAria: 'Stäng hjälp och vägledning',
    faq: [
      {
        q: 'Vad är Babyora?',
        a: [
          'Babyora är en norsk klädapp för barn 0–3 år. Vi rekommenderar antal lager ull och bomull utifrån vädret där du är och barnets ålder.',
          'Appen är skapad av norska föräldrar i Trondheim — för norska vintrar, höstar och kalla sommarmorgnar.',
        ],
      },
      {
        q: 'Hur ändrar jag plats?',
        a: [
          'Gå till Inställningar → Väder och plats → Plats och skriv in en ort eller kommun.',
          'Du kan också aktivera ”Använd aktuell plats” så att Babyora hämtar väder där enheten befinner sig. Vi behöver då platsåtkomst, som du blir tillfrågad om första gången.',
        ],
      },
      {
        q: 'Varifrån kommer vädret?',
        a: [
          'Väderdata kommer från met.no (Meteorologisk institutt) — samma källa som yr.no.',
          'Du kan se källan under Inställningar → Väder och plats → Väderkälla.',
        ],
      },
      {
        q: 'Hur slår jag på notiser?',
        a: [
          'Gå till Inställningar → Notiser och slå på ”Morgonpåminnelse”. Första gången ombeds du tillåta notiser — välj ”Tillåt”.',
          'Om notiser redan är blockerade måste du slå på dem i telefonens systeminställningar (Inställningar → Babyora → Notiser).',
          'Du kan också ändra tiden genom att trycka på radtexten när morgonpåminnelsen är på.',
        ],
      },
    ],
  },
  feedback: {
    title: 'Skicka feedback',
    description: 'Vi läser allt och svarar så snart vi kan. Berätta vad du gillar, vad som inte fungerar eller vad du saknar — vi är två föräldrar i Trondheim som bygger Babyora vid sidan av jobbet.',
    details: 'När du trycker på ”Öppna e-post” öppnar vi din e-postapp med ett färdigt meddelande. Vi bifogar lite diagnostik för felsökning; du kan redigera allt innan du skickar.',
    diagnosticsAria: 'Diagnostik som skickas',
    appVersion: 'Appversion',
    platform: 'Plattform',
    recipient: 'Mottagare',
    openEmail: 'Öppna e-post',
    openEmailAria: 'Öppna e-post med färdig feedback',
    cancelAria: 'Avbryt — stäng dialogrutan',
  },
  privacy: {
    title: 'Integritet och villkor',
    description: 'Babyora är skapat i Norge och följer GDPR. Vi samlar in så lite data som möjligt — barnets profil finns bara på din enhet. Nedan finns en kort sammanfattning och länkar till hela texten.',
    summaryHeading: 'Sammanfattning',
    summaryAria: 'Sammanfattning av integritet',
    fullTextHeading: 'Fullständig text',
    linksAria: 'Externa länkar till den fullständiga texten',
    thirdPartiesHeading: 'Tredjepartstjänster',
    thirdPartiesAria: 'Tredjepartstjänster',
    openLinkAria: (label) => `${label} — öppna i webbläsaren`,
    closeAria: 'Stäng integritet och villkor',
    summary: [
      {
        q: 'Vad lagrar Babyora om barnet?',
        a: [
          'Vi lagrar bara det du själv anger: namn, födelsedatum och ort. Dessa data stannar på din enhet och skickas aldrig till våra servrar.',
          'Om du loggar in med en Plus-prenumeration lagrar vi även köpstatus hos vår betalningsleverantör (RevenueCat) — inte barnets namn eller ålder.',
        ],
      },
      {
        q: 'Vilka data delas med tredje part?',
        a: [
          'Väderdata hämtas anonymt från met.no (Meteorologisk institutt) baserat på plats eller ort. Vi skickar inte barnets namn eller ålder.',
          'Om du har slagit på ”Använd aktuell plats” skickar vi koordinaterna till met.no för lokalt väder — vi lagrar inte koordinaterna.',
        ],
      },
      {
        q: 'Hur raderas data?',
        a: [
          'Radera alla lokala data genom att trycka på ”Logga ut” längst ned i Inställningar eller genom att avinstallera appen.',
          'Om du har Plus kan du också radera ditt konto genom att mejla hei@babyora.no.',
        ],
      },
    ],
    links: [
      { label: 'Integritetspolicy', sub: 'Fullständig text på babyora.no', href: 'https://babyora.no/personvern' },
      { label: 'Användarvillkor', sub: 'Villkor, prenumerationer och ångerrätt', href: 'https://babyora.no/vilkar' },
    ],
    thirdParties: [
      { name: 'met.no (Norska meteorologiska institutet)', purpose: 'Väderdata · CC BY 4.0' },
      { name: 'Capacitor', purpose: 'Ramverk för native-appar' },
      { name: 'RevenueCat', purpose: 'Plus-prenumerationer och kvitton' },
    ],
  },
  switchChild: {
    title: 'Byt barn',
    closeAria: 'Stäng dialogrutan Byt barn',
    description: 'Välj vilket barn Babyora ska visa väder- och klädförslag för.',
    plusNotice: 'Barn nr 1 ingår. Att byta till fler barn kräver Babyora Plus.',
    empty: 'Inga barn har lagts till än.',
    unnamed: 'Utan namn',
    plusLabel: 'Plus',
    activeStatus: 'Aktiv',
    activeAria: (name) => `${name} — aktivt barn`,
    gatedAria: (name) => `Byt till ${name} — kräver Babyora Plus`,
    switchAria: (name) => `Byt till ${name}`,
  },
  referenceHour: {
    title: 'Referenstid',
    description: 'Välj vilken tid som ska användas för väderprognosen på startskärmen.',
  },
  addChild: {
    title: 'Lägg till ett barn',
    closeAria: 'Stäng dialogrutan Lägg till ett barn',
    description: 'Babyora kan ha flera barn. Varje syskon får en egen profil med namn, ålder och plats. Du kan byta mellan barnen från Inställningar.',
    name: 'Namn',
    namePlaceholder: 'Till exempel Iver',
    nameError: 'Ange ett namn.',
    birthDate: 'Födelsedatum',
    birthDateError: 'Välj ett giltigt födelsedatum (efter 1 januari 2018).',
    location: 'Plats',
    locationPlaceholder: 'Till exempel Trondheim',
    locationError: 'Ange ett ortsnamn.',
    submit: 'Lägg till barn',
    submitAria: 'Spara nytt barn',
    cancelAria: 'Avbryt — stäng dialogrutan',
  },
  autoLocation: {
    title: 'Använd aktuell plats',
    description: 'Babyora kan hämta lokalt väder utifrån telefonens plats i stället för en fast ort. Det är praktiskt när ni reser eller är i stugan.',
    details: 'När du trycker på ”Tillåt plats” frågar telefonen om åtkomst. Vi skickar endast koordinaterna anonymt till met.no och lagrar inte din plats. Du kan stänga av detta när som helst.',
    allow: 'Tillåt plats',
    pending: 'Hämtar plats …',
    allowAria: 'Tillåt plats — be telefonen om åtkomst',
    cancelAria: 'Avbryt — stäng utan att begära plats',
  },
  weatherChange: {
    title: 'Notiser om väderförändringar',
    description: 'Babyora kan meddela dig när temperaturen har sjunkit mer än 5° sedan senaste kontrollen, så att du inte blir överraskad på väg ut med barnvagnen.',
    details: 'När du trycker på ”Tillåt notiser” frågar telefonen om åtkomst. Vi skickar bara korta påminnelser från Babyora — ingen reklam. Du kan stänga av notiser när som helst i Inställningar.',
    allow: 'Tillåt notiser',
    pending: 'Begär tillåtelse …',
    allowAria: 'Tillåt notiser — be telefonen om åtkomst',
    cancelAria: 'Avbryt — stäng utan att aktivera vädernotiser',
  },
  deleteData: {
    title: 'Radera alla mina data?',
    irreversible: 'Detta går inte att ångra.',
    description: 'Alla lokala Babyora-data raderas från den här enheten:',
    deletedItemsAria: 'Detta raderas',
    items: [
      'Barnprofiler (namn, födelsedatum, plats)',
      'Inställningar (notiser, tema, plats, referenstid)',
      'Feedbackhistorik och klädåsidosättningar',
      'Status för verktygstips och introduktion',
    ],
    aftermath: 'Du skickas tillbaka till introduktionen och behöver konfigurera Babyora igen. Vi rekommenderar att du exporterar dina data först om du vill spara dem.',
    confirm: 'Ja, radera alla data',
    confirmAria: 'Ja, radera alla mina data permanent',
    cancelAria: 'Avbryt — behåll mina data',
  },
  weatherSource: {
    title: 'Väderkälla',
    closeAria: 'Stäng information om väderkällan',
    description: 'Vi använder met.no för väderdata.',
    details: 'All väderinformation i Babyora kommer från Meteorologisk institutt (met.no), samma källa som yr.no. Data tillhandahålls under licensen CC BY 4.0, och vi skickar endast plats eller ort anonymt för att hämta lokalt väder.',
    readMore: 'Läs mer på met.no',
    readMoreAria: 'Läs mer om met.no — öppna met.no i webbläsaren',
  },
  rateApp: {
    title: 'Betygsätt Babyora',
    closeAria: 'Stäng dialogrutan Betygsätt Babyora',
    description: 'Gillar du Babyora? Ett kort omdöme hjälper andra norska föräldrar att hitta appen.',
    details: 'När du trycker på ”Ge ett omdöme” öppnar enheten sitt eget omdömesfönster från App Store eller Google Play. Du kan välja antal stjärnor och skriva en kort text — eller låta bli. Det är helt upp till dig.',
    confirm: 'Ge ett omdöme',
    pending: 'Öppnar …',
    confirmAria: 'Ge ett omdöme — öppna App Store eller Google Plays omdömesdialog',
    notNow: 'Inte nu',
    notNowAria: 'Inte nu — stäng dialogrutan Betygsätt Babyora',
  },
};

const DANISH: SettingsSecondaryCopy = {
  common: {
    close: 'Luk',
    cancel: 'Annuller',
    done: 'Færdig',
    hourAria: (time) => `Kl. ${time}`,
  },
  actions: {
    childAdded: (name) => `${name} er tilføjet.`,
    rateThanks: 'Tak! Vi sætter pris på din anmeldelse.',
    rateStoreOpened: 'Åbner butikken — giv os gerne en bedømmelse der.',
    rateWebOpened: 'Åbner App Store i browseren.',
    rateUnavailable: 'Bedømmelser kunne ikke åbnes lige nu. Prøv igen senere.',
    exportSuccess: (filename) => `Data blev eksporteret — ${filename}`,
    exportFailure: 'Data kunne ikke eksporteres. Prøv igen.',
    deleteSuccess: (count) => `Alle lokale data er slettet (${count} nøgler).`,
    finishOnboarding: 'Gør opsætningen færdig først.',
    locationUpdated: (place) => `Placeringen blev opdateret — vejret hentes for ${place}.`,
    locationFailure: 'Din placering kunne ikke hentes. Prøv igen.',
    notificationsBlocked: 'Notifikationer er blokeret. Slå dem til i systemindstillingerne.',
    morningPermissionRequired: 'Du skal tillade notifikationer for at slå morgenpåmindelsen til.',
    notificationUnsupported: 'Notifikationer understøttes ikke på denne enhed — dit valg er gemt.',
    weatherChangeEnabled: 'Notifikationer om vejrændringer er slået til.',
    weatherPermissionRequired: 'Du skal tillade notifikationer for at slå vejrændringer til.',
    notificationRequestFailure: 'Der kunne ikke anmodes om tilladelse til notifikationer. Prøv igen.',
  },
  feedbackMail: {
    subject: (version) => `Feedback om Babyora v${version}`,
    greeting: 'Hej Babyora-team,',
    diagnostics: 'Diagnostik (lad det stå — det hjælper os med fejlfinding):',
    appVersion: (version) => `Appversion: ${version}`,
    platform: (platform) => `Platform: ${platform}`,
  },
  materialPreference: {
    rowLabel: 'Materialevalg',
    rowDescription: 'Vælg det, I normalt har ved hånden',
    rowAria: (label) => `Materialevalg — ${label}. Åbn dialogboksen`,
    sheet: {
      title: 'Materialevalg',
      intro: 'Vælg, hvilket materiale Babyora skal foretrække, når flere muligheder passer til vejret. Vejr og sikkerhed kommer altid først.',
      done: 'Færdig',
      close: 'Luk materialevalg',
      options: {
        best_for_conditions: {
          label: 'Bedst til forholdene',
          description: 'Babyora vælger ud fra vejret og aktiviteten.',
        },
        prefer_wool: {
          label: 'Uld først',
          description: 'Uld vises først, når det passer som lag.',
        },
        prefer_fleece: {
          label: 'Fleece først',
          description: 'Fleece vises først, når det udfylder samme funktion.',
        },
        prefer_cotton: {
          label: 'Bomuld først',
          description: 'Bomuld vises først, når forholdene er milde, tørre og rolige.',
        },
      },
    },
  },
  morningHour: {
    title: 'Tidspunkt for morgenpåmindelse',
    description: 'Vælg, hvornår Babyora skal sende dagens tøjforslag om morgenen.',
  },
  help: {
    title: 'Hjælp og vejledning',
    description: 'Ofte stillede spørgsmål om Babyora. Hvis du ikke finder svaret her, kan du sende feedback fra Indstillinger.',
    faqAria: 'Ofte stillede spørgsmål',
    closeAria: 'Luk hjælp og vejledning',
    faq: [
      {
        q: 'Hvad er Babyora?',
        a: [
          'Babyora er en norsk tøjapp til børn fra 0–3 år. Vi anbefaler antal lag uld og bomuld ud fra vejret, hvor du er, og barnets alder.',
          'Appen er skabt af norske forældre i Trondheim — til norske vintre, efterår og kolde sommermorgener.',
        ],
      },
      {
        q: 'Hvordan ændrer jeg sted?',
        a: [
          'Gå til Indstillinger → Vejr og sted → Sted, og indtast en by eller kommune.',
          'Du kan også slå “Brug aktuel placering” til, så Babyora henter vejret, hvor enheden er. Vi skal da bruge adgang til placering, som du bliver spurgt om første gang.',
        ],
      },
      {
        q: 'Hvor kommer vejret fra?',
        a: [
          'Vejrdata kommer fra met.no (Meteorologisk institutt) — samme kilde som yr.no.',
          'Du kan se kilden under Indstillinger → Vejr og sted → Vejrkilde.',
        ],
      },
      {
        q: 'Hvordan slår jeg notifikationer til?',
        a: [
          'Gå til Indstillinger → Notifikationer og slå “Morgenpåmindelse” til. Første gang bliver du bedt om at tillade notifikationer — vælg “Tillad”.',
          'Hvis notifikationer allerede er blokeret, skal du slå dem til i telefonens systemindstillinger (Indstillinger → Babyora → Notifikationer).',
          'Du kan også ændre tidspunktet ved at trykke på rækketeksten, mens morgenpåmindelsen er slået til.',
        ],
      },
    ],
  },
  feedback: {
    title: 'Send feedback',
    description: 'Vi læser alt og svarer så hurtigt som muligt. Fortæl, hvad du kan lide, hvad der ikke virker, eller hvad du savner — vi er to forældre i Trondheim, som bygger Babyora ved siden af vores arbejde.',
    details: 'Når du trykker på “Åbn e-mail”, åbner vi din e-mailapp med en klargjort besked. Vi vedlægger lidt diagnostik til fejlfinding; du kan redigere alt, før du sender.',
    diagnosticsAria: 'Diagnostik, der sendes',
    appVersion: 'Appversion',
    platform: 'Platform',
    recipient: 'Modtager',
    openEmail: 'Åbn e-mail',
    openEmailAria: 'Åbn e-mail med klargjort feedback',
    cancelAria: 'Annuller — luk dialogboksen',
  },
  privacy: {
    title: 'Privatliv og vilkår',
    description: 'Babyora er udviklet i Norge og følger GDPR. Vi indsamler så få data som muligt — barnets profil bliver kun på din enhed. Nedenfor finder du et kort resümé og links til den fulde tekst.',
    summaryHeading: 'Resumé',
    summaryAria: 'Resumé af privatliv',
    fullTextHeading: 'Fuld tekst',
    linksAria: 'Eksterne links til den fulde tekst',
    thirdPartiesHeading: 'Tredjepartstjenester',
    thirdPartiesAria: 'Tredjepartstjenester',
    openLinkAria: (label) => `${label} — åbn i browser`,
    closeAria: 'Luk privatliv og vilkår',
    summary: [
      {
        q: 'Hvad gemmer Babyora om barnet?',
        a: [
          'Vi gemmer kun det, du selv indtaster: navn, fødselsdato og by. Disse data bliver på din enhed og sendes aldrig til vores servere.',
          'Hvis du logger ind med et Plus-abonnement, gemmer vi også købsstatus hos vores betalingsudbyder (RevenueCat) — ikke barnets navn eller alder.',
        ],
      },
      {
        q: 'Hvilke data deles med tredjeparter?',
        a: [
          'Vejrdata hentes anonymt fra met.no (Meteorologisk institutt) ud fra placering eller by. Vi sender ikke barnets navn eller alder.',
          'Hvis du har slået “Brug aktuel placering” til, sender vi koordinaterne til met.no for at hente lokalt vejr — vi gemmer ikke koordinaterne.',
        ],
      },
      {
        q: 'Hvordan slettes data?',
        a: [
          'Slet alle lokale data ved at trykke på “Log ud” nederst i Indstillinger eller ved at afinstallere appen.',
          'Hvis du har Plus, kan du også slette din konto ved at sende en e-mail til hei@babyora.no.',
        ],
      },
    ],
    links: [
      { label: 'Privatlivspolitik', sub: 'Fuld tekst på babyora.no', href: 'https://babyora.no/personvern' },
      { label: 'Brugsvilkår', sub: 'Vilkår, abonnementer og fortrydelsesret', href: 'https://babyora.no/vilkar' },
    ],
    thirdParties: [
      { name: 'met.no (Norsk Meteorologisk Institut)', purpose: 'Vejrdata · CC BY 4.0' },
      { name: 'Capacitor', purpose: 'Framework til native apps' },
      { name: 'RevenueCat', purpose: 'Plus-abonnementer og kvitteringer' },
    ],
  },
  switchChild: {
    title: 'Skift barn',
    closeAria: 'Luk dialogboksen Skift barn',
    description: 'Vælg, hvilket barn Babyora skal vise vejr- og tøjforslag for.',
    plusNotice: 'Barn nr. 1 er inkluderet. Det kræver Babyora Plus at skifte til flere børn.',
    empty: 'Der er endnu ikke tilføjet nogen børn.',
    unnamed: 'Uden navn',
    plusLabel: 'Plus',
    activeStatus: 'Aktiv',
    activeAria: (name) => `${name} — aktivt barn`,
    gatedAria: (name) => `Skift til ${name} — kræver Babyora Plus`,
    switchAria: (name) => `Skift til ${name}`,
  },
  referenceHour: {
    title: 'Referencetid',
    description: 'Vælg det tidspunkt, der skal bruges til vejrudsigten på startskærmen.',
  },
  addChild: {
    title: 'Tilføj et barn',
    closeAria: 'Luk dialogboksen Tilføj et barn',
    description: 'Babyora kan have flere børn. Hver søskende får sin egen profil med navn, alder og sted. Du kan skifte mellem børnene fra Indstillinger.',
    name: 'Navn',
    namePlaceholder: 'For eksempel Iver',
    nameError: 'Indtast et navn.',
    birthDate: 'Fødselsdato',
    birthDateError: 'Vælg en gyldig fødselsdato (efter 1. januar 2018).',
    location: 'Sted',
    locationPlaceholder: 'For eksempel Trondheim',
    locationError: 'Indtast et stednavn.',
    submit: 'Tilføj barn',
    submitAria: 'Gem nyt barn',
    cancelAria: 'Annuller — luk dialogboksen',
  },
  autoLocation: {
    title: 'Brug aktuel placering',
    description: 'Babyora kan hente lokalt vejr ud fra telefonens placering i stedet for et fast sted. Det er praktisk, når I er på rejse eller i sommerhus.',
    details: 'Når du trykker på “Tillad placering”, beder telefonen om adgang. Vi sender kun koordinaterne anonymt til met.no og gemmer ikke din placering. Du kan slå det fra igen når som helst.',
    allow: 'Tillad placering',
    pending: 'Henter placering …',
    allowAria: 'Tillad placering — bed telefonen om adgang',
    cancelAria: 'Annuller — luk uden at anmode om placering',
  },
  weatherChange: {
    title: 'Notifikationer om vejrændringer',
    description: 'Babyora kan give dig besked, når temperaturen er faldet mere end 5° siden sidste kontrol, så du ikke bliver overrasket på vej ud med barnevognen.',
    details: 'Når du trykker på “Tillad notifikationer”, beder telefonen om adgang. Vi sender kun korte påmindelser fra Babyora — ingen reklamer. Du kan slå notifikationer fra igen når som helst i Indstillinger.',
    allow: 'Tillad notifikationer',
    pending: 'Anmoder om tilladelse …',
    allowAria: 'Tillad notifikationer — bed telefonen om adgang',
    cancelAria: 'Annuller — luk uden at slå vejrnotifikationer til',
  },
  deleteData: {
    title: 'Slet alle mine data?',
    irreversible: 'Dette kan ikke fortrydes.',
    description: 'Alle lokale Babyora-data slettes fra denne enhed:',
    deletedItemsAria: 'Dette bliver slettet',
    items: [
      'Børneprofiler (navn, fødselsdato, sted)',
      'Indstillinger (notifikationer, tema, placering, referencetid)',
      'Feedbackhistorik og tilsidesættelser af tøj',
      'Status for værktøjstip og introduktion',
    ],
    aftermath: 'Du sendes tilbage til introduktionen og skal konfigurere Babyora igen. Vi anbefaler at eksportere dine data først, hvis du vil gemme dem.',
    confirm: 'Ja, slet alle data',
    confirmAria: 'Ja, slet alle mine data permanent',
    cancelAria: 'Annuller — behold mine data',
  },
  weatherSource: {
    title: 'Vejrkilde',
    closeAria: 'Luk information om vejrkilden',
    description: 'Vi bruger met.no til vejrdata.',
    details: 'Alle vejroplysninger i Babyora kommer fra Meteorologisk institutt (met.no), samme kilde som yr.no. Data leveres under licensen CC BY 4.0, og vi sender kun placering eller by anonymt for at hente lokalt vejr.',
    readMore: 'Læs mere på met.no',
    readMoreAria: 'Læs mere om met.no — åbn met.no i browseren',
  },
  rateApp: {
    title: 'Bedøm Babyora',
    closeAria: 'Luk dialogboksen Bedøm Babyora',
    description: 'Kan du lide Babyora? En kort anmeldelse hjælper andre norske forældre med at finde appen.',
    details: 'Når du trykker på “Giv en anmeldelse”, åbner enheden sit eget anmeldelsesvindue fra App Store eller Google Play. Du kan vælge antal stjerner og skrive en kort tekst — eller lade være. Det er helt op til dig.',
    confirm: 'Giv en anmeldelse',
    pending: 'Åbner …',
    confirmAria: 'Giv en anmeldelse — åbn App Store eller Google Plays anmeldelsesdialog',
    notNow: 'Ikke nu',
    notNowAria: 'Ikke nu — luk dialogboksen Bedøm Babyora',
  },
};

const COPY_BY_LANGUAGE = {
  en: ENGLISH,
  no: NORWEGIAN,
  sv: SWEDISH,
  da: DANISH,
} as const satisfies Readonly<Record<'en' | 'no' | 'sv' | 'da', SettingsSecondaryCopy>>;

/**
 * Resolve screen-local secondary copy. German deliberately uses English until a
 * German entry is added here; the global i18next resource still owns existing
 * first-level German Settings labels.
 */
export function getSettingsCopy(language: unknown): SettingsSecondaryCopy {
  if (typeof language !== 'string') return COPY_BY_LANGUAGE.en;
  const base = language.trim().toLowerCase().split(/[-_]/u)[0];
  if (base === 'nb' || base === 'nn' || base === 'no') return COPY_BY_LANGUAGE.no;
  if (base === 'sv') return COPY_BY_LANGUAGE.sv;
  if (base === 'da') return COPY_BY_LANGUAGE.da;
  return COPY_BY_LANGUAGE.en;
}

export function feedbackDivider(): string {
  return DIVIDER;
}

export function materialPreferenceLabel(
  value: MaterialPreference,
  copy: MaterialPreferenceSheetCopy,
): string {
  const selectable = value === 'avoid_wool' ? 'prefer_fleece' : value;
  return copy.options[selectable].label;
}
