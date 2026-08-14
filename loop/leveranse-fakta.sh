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

echo "--- HVA REQUESTEN SKAL BESKRIVE ---"
echo "Beskriv MATERIALCOMMITEN over. Ikke kall noe «full pakke»."
echo "Etter at du har lest dette kommer minst to commits til — requesten selv og"
echo "BATON-overleveringen — og de finnes ikke i tallene under. Kaller du dette"
echo "«hele leveransen», blir påstanden usann i det du lagrer requesten."
echo "Formuler i stedet: «Materialcommit <sha>: N filer, +X/-Y. Request-, evidens-"
echo "og BATON-commits kommer etter denne målingen og er bokføring, ikke innhold.»"
echo "Fire oppgaver har brutt tre forsøk hver på nettopp denne selvrefererende feilen."
echo

echo "--- diff mot forelder (MATERIALCOMMITEN) ---"
git diff --stat 'HEAD^' HEAD 2>/dev/null | tail -1 || echo "(ingen forelder)"
echo
echo "--- per fil (numstat: eksakt, ikke skalert graf) ---"
git diff --numstat 'HEAD^' HEAD 2>/dev/null || true
echo

echo "--- dommer og evidens som må være sporet ---"
# Gjentakende underkjennelsesgrunn (SN-001, SN-006): forrige forsøks dom eller
# evidensfil ligger usporet i arbeidstreet. Kontrolløren kan ikke granske det
# som ikke er i historikken.
usporet=0
for f in loop/verdicts/${OPPG}-* loop/evidens/${OPPG}/*; do
  [ -e "$f" ] || continue
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "OK sporet:   $f"
  else
    echo "BRUDD usporet: $f  — commit den, ellers underkjennes leveransen (G5/E1)"
    usporet=1
  fi
done
[ "$usporet" -eq 0 ] && echo "(alt relevant er sporet)"
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
