# 10 — Feasibility & Decision Gate (Fase 8)

> Utført 2026-08-05 av Claude (CD/TL). Sols kreative score (runde 7, gjengitt uendret —
> Claude kan ikke omskrive Works verdikt) + Claudes tekniske score holdes ADSKILT per
> masterprompt-DoD. Status: **TIL EIERPORT 2** — valg av retning som skal PROTOTYPES
> (fase 9); endelig godkjenning skjer først ved eierport 3 etter review-loopen, og Sols
> ikke-kompenserbare porter (sikkerhet + forståelse) gjelder hele veien.

## 1. Beslutningsmatrise

| Dimensjon | Protokollen | Spennet | Ambient Briefing | Ambient Protokoll (syntese) |
| --- | --- | --- | --- | --- |
| **Sols kreative sum (uvektet, /50)** | 36 | 37 | 39 | — (ikke scoret; eneste tillatte syntesekandidat) |
| Sols ytterpunkter | Klarhet 5 · Betalingsvilje 2 | Originalitet/Differensiering 5 · Klarhet/Tilgjengelighet 2 | Native UX 5 | Kan slå Protokollen på friksjon/retention og Ambient på sikkerhetsfullstendighet (Sols vurdering) |
| **Claudes tekniske score (/5, høyere = mer gjennomførbar)** | **4** — mest re-representasjon, minst ny logikk; nytt: protokollkompilator + påkledningsrekkefølge i datamodell | **3** — spenn-API + instrumentkomponent; P0: intervallet krever FAGLIG definisjon uavhengig av grafikken (testkorpus finnes ikke) | **2,5** — kort-backend (første backend i produktet), delta-push-server, versjons-/cachekontrakt på tvers av flater, native widget-paritet | **3** — brief-API + snapshot v2 gjenbrukes; slipper router/spenn; arver Ambients versjonskontrakt men i mindre omfang (én brief → én protokoll) |
| P0-modellrisiko (Sols skjulte, akseptert) | Modusklassifiseringen (vanlig/følg med/avvik) er motor-/sikkerhetsbeslutning | Intervallvaliditet — UI-spenn ≠ faglig kalibrert spenn | Distribuert tilstandskonsistens («identisk brief» må bevises teknisk) | Arver Ambients konsistenskrav + Protokollens modusgrenser |
| Betalt jobb under B (presisert likt, Sols P1) | Turrytme/varsling, historikk, koordinering — kjernen (sekvensen) er gratis og LÆRES: svakest betalingsgrunn (Sols 2/5) | Personalisering (kalibrert spenn per barn), historikk, levert planlegging | Komfort-deltaer push, kveldsbrief, stående kort, flere barn — mest presist gate-bare | Som Ambient, med protokollsteget gratis |
| Graduation-eksponering | Høyest (sekvensen læres) | Middels (grensene flytter med barnet/sesongen) | Lavest (levering fornyes ved hvert værskifte) | Lav |
| Helsestasjonskompatibilitet (eiers mål: rekkevidde/tillit) | God (gratis protokoll er anbefalbar) | Best mulig faglig avsender — MEN krever fagvalidert intervall først | God hvis sikkerhetsdelta gratis | God |
| Største fellingsrisiko (fra falsifiseringstestene) | Utførelsespremisset + modus-feilklassifisering | Én «appen har målt barnet»-feillesning; beslutningstid opp | Delta utilstrekkelig uten baseline; stale lest som bug | Brief-handlingen ikke komplett/trygg alene |

## 2. Claudes innstilling til porten (teknisk begrunnelse, adskilt fra Sols)

**Prototypér to i fase 9: PROTOKOLLEN og AMBIENT PROTOKOLL (syntesen), test navnløst mot
delt scenariosett + nullmodell; SPENNET testes rent som konsepttest (papir/klikkbar) uten
full bygging.** Begrunnelse: (1) Protokollen har høyest teknisk gjennomførbarhet og
klarhet 5 — den er den sterkeste bæreren av eiers mål (rekkevidde/tillit via gratis
sikkerhetskjerne) men trenger Ambient-laget for betalingsgrunn; (2) Ambient Protokoll er
Sols eneste tillatte syntese og adresserer nettopp Protokollens svakhet (betalingsvilje 2)
uten router-/spenn-kompleksitet; (3) Spennets P0 (faglig intervallvalidering) KAN ikke
løses av en prototype — den krever fagkorpus som ikke finnes ennå; å bygge den fullt nå
ville teste grafikk, ikke epistemologi. Konsepttesten måler forståelsesrisikoen
(ANSI-testen) billig, og Spennets eide idéer (svakeste premiss synlig, asymmetrisk
beskyttelse) kan senere adopteres som INNHOLDSLAG i vinnerretningen uten instrumentfiguren.

**Minoritetsinnvending (logget):** Spennet har høyest originalitet/differensiering (5/5)
og Sol advarte eksplisitt mot at «tre varianter av Monter»-konservatisme dreper divergens
— å demotere Spennet til konsepttest kan være nettopp den konservatismen. Motargument:
Sols egen P0 sier intervallet uten faglig definisjon er falsk vitenskapelig presisjon;
å prototype den før fagkorpuset finnes er å bygge det hun forbød.

## 3. Bindende rammer for fase 9 (uansett valg)

Sols runde 7-krav: fem risikoklasser per retning i risikoregisteret; identisk gratis
sikkerhetslag; delt scenariosett (normal dag, grensevær, sovende vogn, bilstol, manglende
data, endret vær, utløpt råd, ny omsorgsperson, Dynamic Type, utendørslys); måling på
korrekt første handling, farlig utelatelse, beslutningstid, gjenfortelling av svakeste
premiss, stale-forståelse — preferanse er sekundært; sikkerhet/forståelse er
ikke-kompenserbare porter; degradering må kunne ende i «Babyora kan ikke gi råd nå»;
navnene eksponeres ikke i test. Differensieringsgrensene fra runde 7 håndheves.

## 4. Eierport 2

Eier velger hvilke retninger som prototypes i fase 9. Vedtaket er et valg av
PROTOTYPE-KANDIDATER, ikke endelig retning — endelig godkjenning skjer ved eierport 3
(fase 11) etter review-loopen med brukertest mot nullmodellen.
