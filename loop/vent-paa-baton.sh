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
      echo "$linje"; exit 0 ;;
  esac

  sleep "$INTERVALL"
  ventet=$(( ventet + INTERVALL ))
done

echo "TIMEOUT etter ${TIMEOUT}s — siste tegn: $(head -1 "$BATON")"
exit 1
