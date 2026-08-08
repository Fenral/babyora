/**
 * launch-handoff — når åpningsflaten skal slippe taket.
 *
 * ═══ HVA ÅPNINGSFLATEN ER ═════════════════════════════════════════════════
 * `#launch` i index.html: temariktig lerret + Babyoras sentrerte signatur
 * (avatar, delvis skyet-vær og ordmerke), malt fra første frame med inline
 * CSS. Den finnes fordi `#root` er tom til React mounter, og et tomt dokument
 * er hvitt. Uten flaten ser en ny bruker et hvitt glimt før appens eget rom.
 *
 * ═══ NÅR DEN SLIPPER — OG HVORFOR IKKE PÅ EN TIMER ════════════════════════
 * Kontrakten er utvetydig: «Oppstart forsinkes ALDRI kunstig.» En timer på
 * f.eks. 1200 ms ville gjort det motsatte — den ville lagt til ventetid for
 * alle med rask telefon, for at de med treg skulle rekke å se merkevaren.
 * Det er å ta tid fra brukeren og gi den til seg selv.
 *
 * Derfor: flaten slipper når React har MALT sin første ekte frame. To
 * rammer etter mount, så vi vet at nettleseren faktisk har tegnet noe — én
 * ramme er nok til at DOM-en finnes, men ikke til at den er på skjermen.
 * Er appen rask, ses flaten knapt. Det er riktig.
 *
 * ═══ VAKTEN, OG HVORFOR DEN ER DER ════════════════════════════════════════
 * Om noe kaster før `slippLaunch()` blir kalt — en feil i en provider, en
 * modul som ikke laster — ville flaten blitt stående for alltid. Appen ville
 * sett ut som den hang, på merkevaren, uten en eneste feilmelding.
 * Derfor en absolutt frist: etter 4 s fjernes flaten uansett. Da ser
 * brukeren i det minste hva som faktisk er galt.
 */

/** Absolutt frist. Ikke en tidsplan — en nødutgang. */
const FRIST_MS = 4000;

let alleredeSluppet = false;

function fjern(el: HTMLElement): void {
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
  if (alleredeSluppet) return;
  const el = document.getElementById('launch');
  if (el === null) return;
  alleredeSluppet = true;

  /* TO rammer: den første garanterer at React har committet til DOM-en, den
     andre at nettleseren har rukket å male den. Slipper vi etter én, kan
     flaten forsvinne før det ligger noe under — og da ser brukeren et glimt
     av tomhet i stedet for et glimt av hvitt. Ingen forbedring. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => fjern(el));
  });
}

/** Nødutgangen. Kalles én gang fra oppstarten. */
export function armerLaunchFrist(): void {
  window.setTimeout(() => {
    const el = document.getElementById('launch');
    if (el !== null && !alleredeSluppet) {
      alleredeSluppet = true;
      fjern(el);
    }
  }, FRIST_MS);
}
