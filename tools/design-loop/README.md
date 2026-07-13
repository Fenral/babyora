# Babyora — Design-loop (3-perspektiver, mål 95+)

## Hva er dette

En autonom design-iter-loop for Babyora-UI. Hver runde henter
tre uavhengige perspektiver på det nåværende designet:

1. **Microsoft Copilot** (ekstern vision-AI) via Edge + Playwright MCP
2. **/impeccable critique** (Claude design-skill, register-aware)
3. **/emil-design-eng** (Claude design-skill, motion + craft)

Pluss min (Claude orkestrator) egen syntese — alltid eksplisitt
inkludert i prompt for å unngå confirmation bias (memory-regel).

## Stopp-betingelser

- Maks-score blant challengers ≥ 95
- 2 runder på rad uten ≥ 5p økning OG ingen ny strukturell anbefaling
- Samme problem identifisert 2 runder på rad uten løsning (survivor-design-regel)

## Per-iter-flyt

1. Sjekk Vercel-deploy er klar (poll preview-URL)
2. Playwright MCP åpner Edge mot preview-URL, screenshot Hjem (390×844)
3. Send screenshot + RUBRIC + min syntese til:
   - Copilot (paste på copilot.microsoft.com)
   - /impeccable critique
   - /emil-design-eng
4. Samle tre svar → lagre i `iters/iter-NNN/`
5. Min syntese skriver `iters/iter-NNN/synthesis.md`
6. Hvis stopp-betingelse: append `iters/iter-NNN/STOP.md` + avslutt
7. Ellers: implementer top-prioriterte endringer →
   accessibility-lead-pass (hook-regel) → commit → push → vent på deploy → neste runde

## Filer

| Fil | Formål |
|---|---|
| `RUBRIC.md` | Score-rubrikk delt mellom alle 3 challengers |
| `PROMPT_COPILOT.md` | Prompt-mal til Microsoft Copilot |
| `iters/iter-NNN/screenshot-hjem.png` | Skjermbilde brukt i runden |
| `iters/iter-NNN/copilot.md` | Copilot-respons |
| `iters/iter-NNN/impeccable.md` | /impeccable critique-respons |
| `iters/iter-NNN/emil.md` | /emil-design-eng-respons |
| `iters/iter-NNN/synthesis.md` | Min syntese + score + neste-prompt |
| `log.jsonl` | Append-only sammendrag per runde (timestamp, score, commit-sha) |

## Trigger

```
/loop dynamic design-loop
```

eller manuelt per runde i samtalen. Claude orkestrerer kjeden:
screenshot → challengers → syntese → implementasjon → commit → deploy → repeat.
