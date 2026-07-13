# M365 Copilot — Standpunkt

(Hentet via Playwright fra `m365.cloud.microsoft/chat/conversation/6bb0c611-…`)

## Standpunkt

**Enig i retning C, men IKKE multi-color rings på Hjem.**

Babyora skal ikke se ut som moodboard eller treningsapp — det skal være rolig, presist
verktøy for trøtte foreldre. Retning C er riktig (varm papirflate, mørk ink, én
kontrollert terracotta som primær accent). Men stopp før C glir over i «multi-color
cleverness» — fire ring-farger i aktivitetsvelgeren gir mer støy enn mening, svekker
premiumfølelse og forverrer informasjonsprioriteringen. «Multicolor rings lukter Apple
Fitness cosplay, ikke Babyora.» Aktivitet skal skilles med **ikon og form**, ikke pride-flagg
av statusfarger. Mikro-hints (små dots/chips) kan brukes som støttesignal, ikke som hovedbærer.

Orange: **#D8541F** — mer voksen, mindre plastikk, mer premium, bedre i nattlys,
lettere å bygge robust system rundt. `#FF6B35` er for aggressiv/startup, `#F26A2E`
fortsatt for «glatt og digital juice».

## Foreslått palett

```css
--surface:           #FBFAF8;  /* oklch(0.985 0.003 80) */
--surface-elevated:  #F3EFE9;  /* oklch(0.955 0.010 75) */
--ink:               #14181F;  /* oklch(0.205 0.018 260) */
--ink-muted:         #66707A;  /* oklch(0.560 0.020 250) */
--accent:            #D8541F;  /* oklch(0.660 0.175 42) — primær CTA */
--accent-deep:       #A8441C;  /* oklch(0.560 0.145 38) — pressed */
--hairline:          #DDD5CB;  /* oklch(0.890 0.008 78) */
--focus:             #2F6FED;  /* oklch(0.610 0.160 260) — separat fra accent */

/* Mikro-hints for aktivitet — KUN som små støtte-signal, ikke hovedbærer */
--hint-vogn:         #7A98B8;
--hint-baeresele:    #9A7FB3;
--hint-utelek:       #6C9B83;
--hint-soevn:        #7D86B8;
```

## Score av nåværende design

**Total: 43/100** (lavere enn de andre tre perspektivene — brutalere)

| Dim | Score | Note |
|---|---|---|
| Hierarki | 12/25 | Værkort + illustrasjon + lag-liste konkurrerer; aktivitet undertonet |
| Visuell forklaring | 10/25 | Stor illustrasjon men pedagogisk svak; lite cause→effect |
| Typografi | 8/15 | Serif + sans identitetskonflikt; mye «grei», lite premium |
| Motion | 2/10 | Ingen tydelig motion-idé sees i statisk skjermbilde |
| Farge | 5/10 | Court Clay litt gjørmete, accent overbrukt i for mange roller |
| A11y | 4/10 | Flere marginale kontraster, sårbart utendørs/nattlys |
| AI-slop | 2/5 | Generiske chips, default dividers, «fin prototype» mer enn «egen karakter» |

## Begrunnelse

«Det Babyora trenger er ikke mer personlighet gjennom flere farger. Det trenger mer
autoritet gjennom bedre prioritering.»

## Sentrale anti-mønstre flagget

- Ikke gjør C til multi-color-cleverness
- Ikke bruk #FF6B35 (for startup-aggressiv)
- Ikke serif på UI-elementer utenom evt. wordmark
- Ikke konkurrerende fargekoder i aktivitetsvelger
- Ikke «pride-flagg av statusfarger»
