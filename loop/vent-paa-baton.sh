#!/usr/bin/env bash
# vent-paa-baton.sh — blokkerer til det er din tur i Snudly-byggeloopen.
#
#   loop/vent-paa-baton.sh CODEX     # Codex venter
#   loop/vent-paa-baton.sh CLAUDE    # Claude Code venter
#
# Avslutter med 0 og skriver tegnlinjen når turen er din.
# Avslutter med 1 og skriver TIMEOUT etter timeout (standard 3600 s).
# Avslutter med 2 og skriver EIER hvis loopen er eskalert til eier.
# Avslutter med 3 og skriver FERDIG når loopen er avsluttet.

set -euo pipefail

MEG="${1:-}"
TIMEOUT="${2:-3600}"
INTERVALL="${3:-15}"
BATON="$(dirname "$0")/BATON.md"

if [ -z "$MEG" ]; then
  echo "Bruk: vent-paa-baton.sh <CODEX|CLAUDE> [timeout-sekunder] [intervall]" >&2
  exit 64
fi

if [ ! -f "$BATON" ]; then
  echo "Fant ikke $BATON" >&2
  exit 66
fi

ventet=0
while [ "$ventet" -lt "$TIMEOUT" ]; do
  linje="$(head -1 "$BATON")"

  case "$linje" in
    *"BATON: FERDIG"*)
      echo "$linje"; echo "FERDIG"; exit 3 ;;
    *"BATON: EIER"*)
      echo "$linje"; echo "EIER"; exit 2 ;;
    *"BATON: $MEG"*)
      # Kappløpsvakt (lagt inn 2026-08-14 etter to falske BLOKKERT på SN-001):
      # byggeren skriver tegnet inntil halvannet minutt FØR den committer og
      # pusher. En kontrollør som leser HEAD i det vinduet ser forrige forsøk
      # og erklærer «levert uten commit». Vakten holder igjen til committen
      # tegnet peker på faktisk er synlig og pushet.
      #
      # FAIL-OPEN: etter SYNK_TIMEOUT returnerer den uansett, slik at adferden
      # i verste fall er nøyaktig som før vakten fantes. Den kan aldri låse.
      if [ "$MEG" = "CODEX" ]; then
        oppgave="$(printf '%s' "$linje" | sed -n 's/.*BATON: CODEX · \([^ ]*\) · FORSOEK-\([0-9]*\).*/\1/p')"
        forsok="$(printf '%s' "$linje" | sed -n 's/.*BATON: CODEX · \([^ ]*\) · FORSOEK-\([0-9]*\).*/\2/p')"
        if [ -n "$oppgave" ] && [ -n "$forsok" ]; then
          SYNK_TIMEOUT="${SYNK_TIMEOUT:-120}"
          synk=0
          while [ "$synk" -lt "$SYNK_TIMEOUT" ]; do
            melding="$(git log -1 --format=%B 2>/dev/null || true)"
            lokal="$(git rev-parse HEAD 2>/dev/null || true)"
            fjern="$(git rev-parse '@{upstream}' 2>/dev/null || true)"
            case "$melding" in
              *"Review-Request: $oppgave"*)
                case "$melding" in
                  *"Forsoek: $forsok"*)
                    if [ -n "$lokal" ] && [ "$lokal" = "$fjern" ]; then
                      echo "$linje"; exit 0
                    fi ;;
                esac ;;
            esac
            sleep 5
            synk=$(( synk + 5 ))
          done
          echo "SYNK-TIMEOUT: committen for $oppgave forsøk $forsok ble ikke synlig og pushet innen ${SYNK_TIMEOUT}s — kontrollerer likevel" >&2
        fi
      fi
      echo "$linje"; exit 0 ;;
  esac

  sleep "$INTERVALL"
  ventet=$(( ventet + INTERVALL ))
done

echo "TIMEOUT etter ${TIMEOUT}s — siste tegn: $(head -1 "$BATON")"
exit 1
