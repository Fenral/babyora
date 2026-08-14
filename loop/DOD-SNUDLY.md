# Definition of Done · Snudly

Dette er det Codex dømmer etter. Ingen andre kriterier teller, og ingen av disse kan strykes av den som bygger.

Hver oppgave i arbeidslisten har en **type** (A–E). En oppgave er ferdig når **alle globale porter** og **alle porter for sin type** er bestått, med evidens.

**Evidens betyr faktisk kommandoutput limt inn i forespørselen.** «Testene kjører» er ikke evidens. Utklipp av `npm test` med antall beståtte tester er evidens. Codex avviser en forespørsel uten evidens uten å lese koden — det koster ett forsøk.

---

## Globale porter · G

Gjelder hver eneste oppgave, uansett type.

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| G1 | Lint rent | `npm run lint` avslutter med 0. Ingen nye unntak eller `eslint-disable` uten begrunnelse i forespørselen. |
| G2 | Typer rene | `npx tsc --noEmit` avslutter med 0. |
| G3 | Tester grønne | `npm test` — alle passerer. Antall tester skal være likt eller høyere enn før oppgaven. Nye `skip`/`todo` krever skriftlig grunn. |
| G4 | Bygget går | `npm run build` avslutter med 0. |
| G5 | Diffen er avgrenset | `git diff --stat` mot utgangspunktet viser kun filer oppgaven trenger. Ingen opprydding på si, ingen omformatering av urørte linjer. |
| G6 | Commit sporbar | Melding starter med `SN-###:` og har trailer `Review-Request: SN-###` og `Forsoek: <N>`. |
| G7 | Ingen hemmeligheter | Diffen inneholder ingen nøkler, tokens, `.p8`, passord eller private URL-er. Nøkler refereres kun som miljøvariabelnavn. |
| G8 | Ingen rester | Ingen `console.log`, `debugger`, utkommentert kode eller `TODO` uten oppgave-ID. |
| G9 | Avhengigheter begrunnet | Ny pakke i `package.json` krever én setning om hvorfor den er nødvendig og hva som ble vurdert i stedet. Ingen ny pakke er standardsvaret. |
| G10 | Evidens vedlagt | Forespørselen inneholder faktisk output fra G1–G4. |

---

## Type A · Brukergrensesnitt

For alt som endrer noe en bruker ser.

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| A1 | Skjermbilder vedlagt | 393×852 ved 2×, både lys og mørk, av hver berørt skjerm. Lagres i `loop/evidens/SN-###/`. |
| A2 | Mock-troskap | Avvik fra `snudly-mock.html` er enten null eller listet med begrunnelse. Et ubegrunnet avvik er underkjent. |
| A3 | Kontrast målt | Brødtekst ≥ 4,5:1, stor tekst (≥18px eller fet ≥14px) ≥ 3:1. Tallene oppgis per nytt farge-/flatepar, målt mot **alle** flater teksten kan stå på — ikke bare den lyseste. |
| A4 | Trykkflater | Alt trykkbart er minst 44×44 px. |
| A5 | Redusert bevegelse | Hver ny animasjon har et alternativ under `prefers-reduced-motion: reduce`. |
| A6 | Kun tokens | Ingen literal hex, ingen radius eller fontstørrelse utenfor skalaen i `SNUDLY-DESIGNSYSTEM.md`. |
| A7 | Riktig navn | Ingen forekomst av «Babyora» eller «Klemeg» i brukersynlig tekst. Bundle-id og produkt-IDer er unntatt og skal ikke røres. |
| A8 | Systemregler | Ingen nøstede kort. Chevron er eneste «åpne»-affordance i en rad. Rust brukes kun om klesbytte. Situasjonsmerket er status, aldri knapp. |
| A9 | Tilstander | Nye interaktive komponenter har default, hover/trykk, fokus, deaktivert og lastende der det er relevant. |

---

## Type B · Motor og logikk

For klesmotor, beregninger og alt som avgjør hva barnet skal ha på seg.

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| B1 | Test før kode | Forespørselen viser at testen ble skrevet først og feilet, deretter passerte. Rød-grønn-sporet limes inn. |
| B2 | Metamorfisk | Varmere vær gir aldri flere eller varmere lag. Kaldere vær gir aldri færre. Egen test. |
| B3 | Ingen selvmotsigelse | Motoren velger aldri gjensidig utelukkende plagg. Egen test. |
| B4 | Deterministisk | Samme normaliserte input og samme motorversjon gir identisk output. Egen test. |
| B5 | Sikkerhetsgrenser | Grensene i `finalize-safety` er urørt, med mindre oppgaven eksplisitt endrer dem — da med begrunnelse og ny grensetest. |
| B6 | Motor v2 forblir av | Alle visningsflagg i `clothing-engine-v2/feature-flags.ts` er fortsatt `false`. Fagsignaturen foreligger ikke. |
| B7 | Forklarbarhet | Hvert vesentlig plaggvalg kan spores til regelen som utløste det. |

---

## Type C · Betaling og butikk

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| C1 | Bundle-id urørt | `no.klemeg.app` er uendret i alle filer. |
| C2 | Apple-produkt-IDer urørt | `no.klemeg.app.monthly/quarterly/yearly` er uendret. De er uforanderlige hos Apple. |
| C3 | Én sannhet om prøveperiode | Omfanget er identisk i kode, i paywall-tekst og i det som er dokumentert konfigurert i App Store Connect. Avvik er underkjent. |
| C4 | Ingen konsollhandling | Agenten har ikke utført endringer i App Store Connect, Play Console eller RevenueCat. Slikt eskaleres. |
| C5 | Kjøpspåstander krever enhet | Påstand om at kjøp virker godtas kun med bevis fra fysisk enhet. Mock og e2e beviser at koden kaller riktig, ikke at kjøp går gjennom. |

---

## Type D · Tekst og innhold

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| D1 | Språk | Norsk bokmål. «Plagg», ikke «klesplagg» eller «item». Tonen er rolig og konkret. |
| D2 | Ingen løfter uten dekning | Teksten lover ikke funksjonalitet som ikke finnes i bygget. Gjelder særlig varsler, familiedeling og serverlagring. |
| D3 | Forbehold synlig | Der appen gir påkledningsråd, står det veiledende forbeholdet. |
| D4 | met.no-kreditering | Der værdata vises, står krediteringen synlig. Lisenskrav. |
| D5 | Personvernspråk | Tekst om barnedata stemmer med hva appen faktisk lagrer og hvor. |

---

## Type E · Dokument og konfigurasjon

| ID | Krav | Hvordan det måles |
| --- | --- | --- |
| E1 | Sant ved skrivetidspunkt | Hver faktapåstand stemmer med kode eller konsoll. Udokumenterte påstander merkes `ANTAKELSE`. |
| E2 | Datert og kildeført | Dokumentet oppgir dato og hva påstandene bygger på. |
| E3 | Motstrid håndtert | Der dokumentet motsier `DECISION-LOG.md`, står avviket eksplisitt. Stilltiende overstyring er underkjent. |

---

## Sluttporten · SN-FINAL

Loopen er ferdig når alt over er oppfylt for hver oppgave, **og**:

- Hele arbeidslisten står `FERDIG`.
- En fersk klone av byggegrenen består G1–G4 uten lokale tilpasninger.
- Alle fire faner er gjennomgått i lys og mørk med skjermbilder, uten «Babyora» eller «Klemeg» synlig.
- Ingen `ANTAKELSE` gjenstår i dokumenter som brukes som beslutningsgrunnlag.
- Åpne eskaleringer er enten lukket av eier eller flyttet til en navngitt oppgave etter lansering.
- Codex har gjort én bred gjennomgang av hele grenen mot hovedgrenen, ikke bare oppgave for oppgave.

Da settes `BATON: FERDIG`, og loopen avsluttes.
