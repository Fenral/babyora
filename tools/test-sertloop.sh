#!/usr/bin/env bash
# Simulerer sert-opprydningen fra codemagic.yaml uten å røre Apple.
# FEIL_ANTALL = hvor mange ganger fetch feiler før den lykkes.
# POOL        = hvor mange certs som "finnes".

kjor() {
  FEIL_IGJEN=$1
  POOL=$2
  slettet=0
  MAKS_SLETT=2

  fetch() {
    if [ "$FEIL_IGJEN" -gt 0 ]; then
      FEIL_IGJEN=$((FEIL_IGJEN - 1))
      echo "    fetch: 409 (tak nådd)"
      return 1
    fi
    echo "    fetch: OK"
    return 0
  }

  until fetch; do
    if [ "$slettet" -ge "$MAKS_SLETT" ]; then
      echo "    GA OPP etter $slettet sletting(er)"
      return 1
    fi
    if [ "$POOL" -le 0 ]; then
      echo "    Ingen certs å slette — 409 kommer fra noe annet"
      return 1
    fi
    echo "    sletter eldste (poolen har $POOL)"
    POOL=$((POOL - 1))
    slettet=$((slettet + 1))
  done
  echo "    FERDIG etter $slettet sletting(er)"
  return 0
}

feil=0
sjekk() {
  navn=$1; feilantall=$2; pool=$3; forventet=$4
  echo "  $navn"
  if kjor "$feilantall" "$pool"; then faktisk=0; else faktisk=1; fi
  if [ "$faktisk" = "$forventet" ]; then
    echo "  => OK (exit $faktisk, forventet $forventet)"
  else
    echo "  => FEIL (exit $faktisk, forventet $forventet)"
    feil=$((feil + 1))
  fi
  echo
}

echo "Simulering av sertifikat-opprydningen"
echo
sjekk "A: fetch går rett gjennom (ingenting slettes)"        0 3 0
sjekk "B: bygg 84-situasjonen — feiler 2 ganger, pool 3"     2 3 0
sjekk "C: feiler 3 ganger — skal gi opp, ikke tømme kontoen" 3 3 1
sjekk "D: feiler, men ingen certs finnes (409 av annen grunn)" 2 0 1

if [ "$feil" -gt 0 ]; then echo "$feil case(r) feilet."; exit 1; fi
echo "Alle case oppførte seg som forventet."
