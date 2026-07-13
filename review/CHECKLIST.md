# Fable 5 review-sjekkliste

Per skjermbilde, svar JA/NEI. Eventuelle NEI logges i `review/REVIEW-{n}.md`
med kort beskrivelse av hva som må fikses.

## Onboarding (steg 1-3)

- [ ] Lillian vises ved siden av navnefeltet (steg 1)?
- [ ] Lillian har snakkeboble med navnet (steg 2)?
- [ ] Lillian er kledd for dagens vær på «Sett i gang» (steg 3)?
- [ ] Bakgrunn er rolig vær-gradient (bg → surface-2), ikke naken hvit?
- [ ] Datovelger viser lys tema (ikke dark-mode crash)?
- [ ] Steg 3: bare én bekreftet sted-pille (ingen duplikat søkefelt)?
- [ ] Progresjonsprikker har token-farger, tydelig aktiv/ferdig?

## Hjem

### Generelt
- [ ] Header har KUN navn + «I DAG» — ingen mini-Lillian?
- [ ] Oppsummeringslinje matcher antrekk-siden (ingen lyver-tekst)?
- [ ] Værikon matcher tilstand (ingen regnsky ved 0 mm/t)?
- [ ] Stedet er konsistent med Innstillinger (én kilde)?
- [ ] Aktivitetsvelgeren står OVER «Vis lag»?
- [ ] Ferskenbeige kortborderne er borte (alt kjølig blue-grey)?

### Orbit
- [ ] Ingen duplikat plagg-tags?
- [ ] Ingen label-kollisjoner (Py/Body/jamas-grøt)?
- [ ] Diskret ellipse-glow bak tags binder dem til Lillian?
- [ ] Med 3 plagg: stramme posisjoner, ikke flytende i tomrom?
- [ ] Med 7+ plagg: +N-tag som åpner antrekk-siden?
- [ ] Klikk på tag åpner LayerDetailSheet?
- [ ] Bytte-chips i sheeten er skjult (alt: virker)?

### Vogn-våken / vogn-sover / utelek / bilstol
- [ ] Bilstol-toggle: tykk dress fjernet, HB-9-notis vist?
- [ ] Vogn-sover med sovepose: sumarry sier «X med sovepose over»?

## Antrekk-siden
- [ ] Kategorimarkører bruker `--garment-*`-farger (innerst/mellomlag/yttertøy/ekstra)?
- [ ] Lagstruktur leses på farge alene?
- [ ] Ingen rå hex i komponentkode?

## Plagg-side
- [ ] «Hvorfor i dette antrekket?» interpolerer faktiske verdier (temp, navn, aktivitet)?
- [ ] Teksten endres når været endres?
- [ ] «innerlag» (ikke «inner lag»)?

## Guide-kalkulator
- [ ] 5° + frisk vind + yr → IKKE «4 lag vinterkjøredress» (jf. ANOMALIES A-1)?
- [ ] −10° + tørt → fornuftig vinter-anbefaling?

## Uke

### I dag (time for time)
- [ ] Hver rad er klikkbar?
- [ ] Klikk åpner tidsforskjøvet anbefaling-sheet?
- [ ] Aldri tom uten forklarende empty-state + «Prøv igjen»?
- [ ] Tidspunkt-headline reflekterer ord-form («kl 09:00»)?

### 10 dager
- [ ] Datoer er relative til Date.now() (aldri «12. mai» i juni)?
- [ ] Hver dag er klikkbar?
- [ ] Klikk åpner tidsforskjøvet anbefaling med ordkalender («onsdag 14. juni»)?

## Innstillinger
- [ ] Stedet matcher Hjem og Uke?
- [ ] Tokens-farger overalt (ingen beige)?

## A11y (alle skjermbilder)
- [ ] `prefers-reduced-motion: reduce` slår av ny animasjon (orbit-drift, partikler)?
- [ ] Focus-ring synlig på orbit-tags og knapper?
- [ ] LayerDetailSheet + TimeShiftSheet har focus-trap + Esc?

---

## Hvordan kjøre

```bash
# Forutsetning: dev-server på localhost:5173
npm run dev

# I annet terminal:
npx playwright test scripts/review-shots.ts
```

Output havner i `review/shots/{ISO timestamp}/`. Per arbeidsordren:
maks 4 review-runder; logg hver i `review/REVIEW-{n}.md` med funn +
hva som ble endret.
