# Snudly 2 designsystem

Dette er den bindende UI-kontrakten for launch, onboarding, produktvisning, betalingsvegg og de fire produktsidene. Visuell referanse for Hjem er fortsatt Figma-node `5KN5PHFXBfmTgRTiTlITs0:9:3`; øvrige sider bygger på de samme rollene og komponentene.

## Grunnregler

- Alle sider laster `design-system.css` før `snudly.css`.
- Farger, avstand, typografi, radius, skygge, bevegelse og målflate hentes fra `--sn-*`-variabler.
- Interaktive mål er minst `--sn-target-min` (44 px), og produktrader minst `--sn-row-min` (67 px).
- Ikoner er SVG med `currentColor`; Unicode-tegn brukes ikke som grensesnittikoner.
- Råd om klær eller søvn skal ha synlig veiledende forbehold.

## Semantiske farger

| Rolle | Variabel | Bruk |
|---|---|---|
| Bakgrunn | `--sn-color-canvas` | Appens ytterflate |
| Kort | `--sn-color-plate` | Kort, dialoger og rader |
| Primær tekst | `--sn-color-ink` | Overskrifter og viktig innhold |
| Sekundær tekst | `--sn-color-ink-muted` | Metadata og forklaringer |
| Handling | `--sn-color-accent` | Primærknapp, fokus og valgt tilstand |
| Myk handling | `--sn-color-accent-soft` | Valgt segment og svak markering |
| Vær | `--sn-color-weather` | Værkort og graf før skifte |
| Varm sone | `--sn-color-warm` | Graf etter klesskifte |
| Feil | `--sn-color-danger` | Feiltekst og feilramme |

## Felles komponenter

- `ProductScreen`: lik topp, rulleflate og bunnnavigasjon for Planlegg, Verktøy og Familie.
- `BottomTabBar`: fire ekte produktruter med valgt og deaktivert tilstand.
- `SegmentedControl`: valgt tilstand uttrykkes med både `aria-pressed` og visuell kontrast.
- `sn-card`: én kortgeometri og én kortskygge på tvers av produktet.
- `sn-button`: samme høyde, fokus, deaktivert tilstand og trykkrespons.
- `sn-slider`: nettlesernativ kontroll med synlig fokus og 44 px betjeningsområde.

## Tilstander som alltid skal finnes

1. Normal og trykket/valgt.
2. Tastaturfokus med synlig fokusindikator.
3. Deaktivert uten å skjule teksten.
4. Lasting, feil og prøv-igjen når siden bruker nettdata.
5. Redusert bevegelse og tvungne systemfarger.

## Endringsregel

Ny UI legges først til som en semantisk token eller felles komponent her. En side skal ikke introdusere rå hex/RGB-farger eller en ny variant av kort, knapp, radius eller skygge direkte i `snudly.css`.
