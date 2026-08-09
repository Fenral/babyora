/**
 * launch-handoff — når åpningsflaten skal slippe taket.
 *
 * ═══ HVA ÅPNINGSFLATEN ER ═════════════════════════════════════════════════
 * `#launch` i index.html: temariktig lerret + Babyoras sentrerte signatur
 * (avatar, delvis skyet-vær og ordmerke), malt fra første frame med inline
 * CSS. Den finnes fordi `#root` er tom til React mounter, og et tomt dokument
 * er hvitt. Uten flaten ser en ny bruker et hvitt glimt før appens eget rom.
 *
 * ═══ NÅR DEN SLIPPER ════════════════════════════════════════════════════════
 * Eierkontrakten er en bevisst, avgrenset kaldstart: ved normal bevegelse er
 * den allerede malte signaturen synlig i minst 900 ms regnet fra første
 * inline boot-frame i index.html. Deretter kommer index.html sin 200 ms fade.
 * Blir React klar etter 900 ms, legges ingen ny merkevarevent oppå; vi passerer
 * bare den eksisterende paint-barrieren og starter fade med en gang.
 *
 * Reduce Motion får ingen minimumsvent. Hele signaturen er statisk, og flaten
 * slipper straks appen under er malt. Barn og skilt er alltid statiske; bare
 * været har inngangsbevegelse ved normal motion.
 *
 * Én eksplisitt design-review finnes utenfor appflyten:
 * `?launch-preview=slow` holder barn og skilt statisk, spiller bare værets
 * landing 5× saktere og slipper først når været faktisk har landet. Den er
 * query-gatet, brukes bare til vurdering og endrer aldri ordinær oppstart.
 *
 * ═══ VAKTEN, OG HVORFOR DEN ER DER ════════════════════════════════════════
 * Om noe kaster før `slippLaunch()` blir kalt — en feil i en provider, en
 * modul som ikke laster — ville flaten blitt stående for alltid. Appen ville
 * sett ut som den hang, på merkevaren, uten en eneste feilmelding.
 * Derfor en absolutt frist: etter 4 s fjernes flaten uansett. Da ser
 * brukeren i det minste hva som faktisk er galt.
 */

/** Normal kaldstart, målt fra index.html sin første inline boot-frame. */
const MIN_SIGNATUR_MS = 900;

/** Absolutt frist. Ikke en tidsplan — en nødutgang. */
const FRIST_MS = 4000;

let slippBestilt = false;
let fjerningStartet = false;

function bootStartMs(): number {
  const raw = document.documentElement.getAttribute('data-launch-boot-at');
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : performance.now();
}

function tidSidenBootMs(): number {
  return Math.max(0, performance.now() - bootStartMs());
}

function brukerRedusertBevegelse(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function erSakteDesignPreview(): boolean {
  return document.documentElement.getAttribute('data-launch-preview') === 'slow'
    && !brukerRedusertBevegelse();
}

function fjern(el: HTMLElement): void {
  if (fjerningStartet || !el.isConnected) return;
  fjerningStartet = true;
  /* `data-ferdig` starter opacity-overgangen (200 ms, definert i index.html).
     Elementet tas ut av DOM-en etterpå, ikke før — fjerner man det med én
     gang, hopper appen fram i stedet for å tone. */
  el.setAttribute('data-ferdig', 'true');
  el.setAttribute('aria-hidden', 'true');
  const rydd = (): void => el.remove();
  el.addEventListener('transitionend', rydd, { once: true });
  /* Har brukeren redusert bevegelse, eller blir transitionend aldri fyrt
     (skjult fane), rydder vi likevel. */
  window.setTimeout(rydd, 400);
}

/**
 * Kalles når appen har noe ekte å vise. Idempotent — flere kall er trygt,
 * for kallstedet kan bli montert på nytt under utvikling.
 */
export function slippLaunch(): void {
  if (slippBestilt || fjerningStartet) return;
  const el = document.getElementById('launch');
  if (el === null) return;
  slippBestilt = true;

  /* TO rammer: den første garanterer at React har committet til DOM-en, den
     andre at nettleseren har rukket å male den. Slipper vi etter én, kan
     flaten forsvinne før det ligger noe under — og da ser brukeren et glimt
     av tomhet i stedet for et glimt av hvitt. Ingen forbedring. */
  const slippEtterMaling = (): void => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fjern(el));
    });
  };

  /* Design-reviewen venter på den faktiske væranimasjonen, ikke en parallell
     timer som kan drive ut av takt. `finished` er allerede resolved dersom en
     uvanlig treg app blir klar etter at animasjonen er ferdig. */
  if (erSakteDesignPreview()) {
    const weather = el.querySelector<HTMLElement>('[data-launch-weather]');
    const animation = weather?.getAnimations()[0];
    if (animation !== undefined) {
      void animation.finished.then(slippEtterMaling, slippEtterMaling);
      return;
    }
  }

  /* Appen er allerede senere enn minimumet: ingen ekstra vent. Reduce Motion
     hopper alltid over minimumet. Ved rask normal kaldstart venter vi bare
     resten av 900 ms-vinduet, aldri 900 ms fra React-readiness. */
  const gjenstaar = brukerRedusertBevegelse()
    ? 0
    : Math.max(0, MIN_SIGNATUR_MS - tidSidenBootMs());
  if (gjenstaar === 0) {
    slippEtterMaling();
    return;
  }
  window.setTimeout(slippEtterMaling, gjenstaar);
}

/** Nødutgangen. Kalles én gang fra oppstarten. */
export function armerLaunchFrist(): void {
  const gjenstaar = Math.max(0, FRIST_MS - tidSidenBootMs());
  window.setTimeout(() => {
    const el = document.getElementById('launch');
    if (el !== null && !fjerningStartet) {
      slippBestilt = true;
      fjern(el);
    }
  }, gjenstaar);
}
