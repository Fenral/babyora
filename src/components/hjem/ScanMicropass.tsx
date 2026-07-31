/**
 * ScanMicropass — P9 (docs/design-notes/sol-duel-2026-07-31.md §2) 400ms
 * mikropass, spilt ved ETHVERT trykk på «Finn dagens antrekk» ETTER at
 * `hasPlayedFullScanEver` er sann (se scan-orchestration.ts). Erstatter
 * ask-blokken (ikke hele panelet — WeatherScene over står uendret) mens
 * mikropasset spiller:
 *
 *  - 0–70ms: CTA-en får en presset tilstand (skala 0.985, redusert skygge).
 *  - 70–270ms: tillitslinjens tre ledd går sekundær→primær ved 110/175/240ms
 *    (en tilnærming av duellens "ett varmt lys passerer venstre→høyre" —
 *    selve sveipe-gradienten er IKKE implementert, se P9-rapporten; den
 *    sekvensielle sekundær→primær-aktiveringen formidler samme retning og
 *    fremdrift uten en egen pseudo-element-gradient-animasjon å QA-e piksel
 *    for piksel).
 *  - 270–400ms: tillitslinjen krysstones til værsammendraget
 *    («4° · Trondheim · Utenfor vogn»). Selve panel-GEOMETRI-morphingen mot
 *    resultat-headerens layout er heller IKKE implementert (se rapporten) —
 *    HjemMonter gjør et hardt fasebytte til result-current når mikropasset
 *    fullfører, samme mønster som resten av skjermen allerede bruker.
 *
 * Berøring når som helst hopper rett til resultatet (kalleren, HjemMonter,
 * kobler dette til samme `handleSkip` som den eksisterende
 * "Vis svaret med en gang"-snarveien bruker). Dette er en TRANSIENT,
 * selv-fullførende overflate (timeren lander uansett etter 400ms) — tap er
 * en snarvei for sTouch/mus, ikke en nødvendig handling, så elementet er
 * bevisst IKKE gitt en `role="button"`/tabIndex-semantikk som ville lovet
 * en vedvarende, tastatur-nåbar kontroll det ikke er. Skjermleser-brukere
 * får korrekt utfall automatisk via aria-live-statusen under.
 */
import './hjem-monter.css';
import {
  MICROPASS_SEGMENT_DELAYS_MS,
} from './scan-orchestration.js';

const TRUST_SEGMENTS = ['Vær,', 'sted og', 'aktivitet vurderes sammen'] as const;

export type ScanMicropassProps = Readonly<{
  /** null → data ikke klare 400ms etter trykk (duel §2: ærlig lastetilstand, ALDRI avhuk vær før vær finnes). */
  summaryText: string | null;
  reducedMotion: boolean;
  onTapAnywhere: () => void;
}>;

export function ScanMicropass({ summaryText, reducedMotion, onTapAnywhere }: ScanMicropassProps) {
  const animate = !reducedMotion;
  const awaiting = summaryText === null;

  return (
    <div
      className="hjm-ask-block hjm-micropass"
      data-animate={animate ? 'true' : 'false'}
      data-awaiting={awaiting ? 'true' : 'false'}
      onClick={onTapAnywhere}
    >
      <span className="hjm-sr-only" role="status" aria-live="polite">
        {awaiting ? 'Oppdaterer værdata' : 'Beregner antrekk'}
      </span>
      <button
        type="button"
        className="hjm-cta hjm-micropass-cta"
        aria-hidden="true"
        tabIndex={-1}
      >
        Finn dagens antrekk
      </button>
      {awaiting ? (
        <p className="hjm-trust hjm-micropass-waiting" aria-hidden="true">Oppdaterer værdata</p>
      ) : (
        <div className="hjm-micropass-trust-wrap" aria-hidden="true">
          <p className="hjm-trust hjm-micropass-trust">
            {TRUST_SEGMENTS.map((segment, index) => (
              <span
                key={segment}
                className="hjm-micropass-segment"
                style={animate ? { animationDelay: `${MICROPASS_SEGMENT_DELAYS_MS[index]}ms` } : undefined}
              >
                {segment}
                {index < TRUST_SEGMENTS.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
          <p className="hjm-trust hjm-micropass-summary">{summaryText}</p>
        </div>
      )}
    </div>
  );
}
