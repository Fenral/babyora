# Prompt-mal til Microsoft Copilot (per iter)

Send vedlagt skjermbilde + følgende prompt (på norsk; tilpass `{{ITER_N}}` og `{{CLAUDE_SYNTHESE}}`):

---

Du er senior produktdesigner på Apple-nivå. Jeg sender deg et skjermbilde av Hjem-skjermen i en norsk PWA for baby-dressing (Babyora). Dette er **iter {{ITER_N}}** i en design-loop hvor målet er score ≥ 95/100.

**Min (Claude) egen syntese av nåværende iter:**
{{CLAUDE_SYNTHESE}}

**Din oppgave:**

1. Vurder skjermbildet mot denne rubrikken:
   - Hierarki & klarhet (25p): én primær beslutning, hero dominerer
   - Visuell forklaring (25p): lag-stabling synes uten å lese tekst
   - Typografi & tekst-økonomi (15p): ingen redundant tekst
   - Motion & feedback (10p): animasjon med formål (anta jeg har CSS-animasjon, du ser kun statisk skjermbilde)
   - Farge & depth (10p): kun hero har sterk skygge, Court Clay-palett
   - Touch-target & a11y (10p): tappebare ≥44px
   - AI-slop-test (5p): ikke generisk SaaS

2. Gi en konkret total-score (0–100).

3. Skriv en **ny prompt** jeg kan gi til min implementerings-AI (også Claude) som vil gjøre dette designet bedre. Vær spesifikk: gi piksel-verdier, OKLCH-tokens, anti-mønstre å unngå. Maks 300 ord.

4. Marker tydelig: er du **enig eller uenig** med Claude's syntese over? Hvis uenig, hvorfor?

**Svarformat:**
```
SCORE: <tall>/100

DIMENSJONER:
- Hierarki: <tall>/25 — <begrunnelse>
- Visuell: <tall>/25 — <begrunnelse>
- Typografi: <tall>/15 — <begrunnelse>
- Motion: <tall>/10 — <begrunnelse>
- Farge/depth: <tall>/10 — <begrunnelse>
- A11y: <tall>/10 — <begrunnelse>
- AI-slop: <tall>/5 — <begrunnelse>

ENIG MED CLAUDE: <ja/nei> — <kort hvorfor>

NY PROMPT TIL CLAUDE:
<prompt-tekst, maks 300 ord>
```

Ikke pynt på tallene. Vær brutal hvis nødvendig. Hvis under 95: vær konkret om hva som mangler.
