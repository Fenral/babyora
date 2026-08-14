#!/usr/bin/env bash
# leveranse-fakta.sh — skriver ut de faktiske tallene en forespørsel skal sitere.
#
# Innført 2026-08-14 etter at SN-003 og SN-005 begge brukte opp alle tre forsøk
# UTEN at arbeidet var feil. Begge falt på det samme: requesten ble skrevet som
# et forhåndsdokument med påstander om hva som ville skje etter commit, og ble
# aldri kontrollert mot den faktiske committen. Tallene driftet fra virkeligheten.
#
# Kjør ETTER commit og push, FØR du skriver requesten. Lim output rått inn.
# Skriver du et tall som ikke står her, er det per definisjon udekket.
#
#   loop/leveranse-fakta.sh SN-006
#
set -uo pipefail
OPPG="${1:-}"
if [ -z "$OPPG" ]; then echo "Bruk: loop/leveranse-fakta.sh SN-###" >&2; exit 64; fi

cd "$(dirname "$0")/.." || exit 66

echo "=== LEVERANSEFAKTA $OPPG ==="
echo "generert: $(date -u +%Y-%m-%dT%H:%M:%SZ)  (date -u)"
echo

echo "--- HEAD ---"
git log -1 --format='sha:      %H%nemne:     %s%nforfatter:%ad' --date=iso-strict
echo
echo "--- trailere ---"
git log -1 --format='%b' | grep -E '^(Review-Request|Forsoek):' || echo "MANGLER TRAILERE"
echo

echo "--- G6-format ---"
emne="$(git log -1 --format='%s')"
if printf '%s' "$emne" | grep -qE "^${OPPG}: "; then
  echo "OK: emnet starter med '${OPPG}: '"
else
  echo "BRUDD: emnet starter IKKE med '${OPPG}: ' — dette alene underkjenner (G6)"
fi
echo

echo "--- diff mot forelder ---"
git diff --stat 'HEAD^' HEAD 2>/dev/null | tail -1 || echo "(ingen forelder)"
echo
echo "--- per fil (numstat: eksakt, ikke skalert graf) ---"
git diff --numstat 'HEAD^' HEAD 2>/dev/null || true
echo

echo "--- synk mot origin ---"
lokal="$(git rev-parse HEAD 2>/dev/null)"
fjern="$(git rev-parse '@{upstream}' 2>/dev/null || echo 'INGEN UPSTREAM')"
echo "HEAD:     $lokal"
echo "upstream: $fjern"
if [ "$lokal" = "$fjern" ]; then echo "OK: pushet og synkron"; else echo "BRUDD: ikke pushet — sett aldri BATON før dette er OK"; fi
echo
echo "rev-list --left-right --count HEAD...@{upstream}:"
git rev-list --left-right --count 'HEAD...@{upstream}' 2>/dev/null || echo "  (utilgjengelig)"
echo
echo "=== SLUTT $OPPG ==="
