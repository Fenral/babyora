# Babyora Widget Snapshot — kontrakt v1

> Eneste delte sannhet mellom hovedappen og widgetene (iOS WidgetKit,
> Android Glance). Versjonert (`v`). Brytende endringer = ny `v`.

## Skjema

```json
{
  "v": 1,
  "childName": "Lillian",
  "updatedAtISO": "2026-06-13T07:30:00.000Z",
  "tempC": 4,
  "feelsLikeC": 1,
  "conditionKey": "partly-cloudy",
  "layerCount": 3,
  "layerBadgeBand": "medium",
  "topGarments": ["Ullbody", "Fleecejakke", "Kjøredress"],
  "toppTilTaa": ["Lue", "Votter"],
  "activity": "vogn",
  "deepLink": "babyora://hjem"
}
```

## Felt-spec

| Felt | Type | Beskrivelse |
|---|---|---|
| `v` | `1` | Skjema-versjon. Widgetene SKAL avvise andre verdier. |
| `childName` | string | Barnets fornavn. **Eneste persondata.** Aldri etternavn, fødselsdato, lokasjon. |
| `updatedAtISO` | ISO-8601 | Når snapshot ble skrevet. Brukes til "Oppdatert HH:mm" + utdatert-fallback. |
| `tempC` | number | Lufttemperatur i Celsius. |
| `feelsLikeC` | number | Føles-som i Celsius (fra met.no). |
| `conditionKey` | `clearsky` \| `partly-cloudy` \| `cloudy` \| `rain` \| `snow` \| `sleet` \| `fog` \| `thunder` | Normalisert nøkkel for ikon-mapping. |
| `layerCount` | 0-5 | Antall lag motoren anbefaler. |
| `layerBadgeBand` | `lett` \| `medium` \| `mye` | Bånd-farge for badge. lett = grønn, medium = rust, mye = mørk rust. |
| `topGarments` | string[] (maks 3) | Hovedplagg-strenger i visning-rekkefølge. |
| `toppTilTaa` | string[] (0-2) | Tilbehør (lue, votter, hals). Tomt = skjul rad. |
| `activity` | `vogn` \| `baeresele` \| `utelek` \| `soevn` | Aktivitet-nøkkel (for ikon). |
| `deepLink` | URI | Åpner appen på riktig fane. |

## Personvern

- ALDRI mer enn `childName`. Ingen lokasjon, ingen fødselsdato, ingen child-id, ingen e-post.
- Snapshot lagres lokalt (App Group / DataStore), aldri opplastet eksternt.

## Trigger-events (P9.1 bro)

Snapshot SKAL skrives når:

1. **Vellykket rec på Hjem** — etter `recommend()` med ferdig vær-data.
2. **Aktivitetsbytte** — bruker bytter activity (vogn/bæresele/utelek/søvn).
3. **Morgenvarsel-generering** — push-trigger (P9.5).
4. **App-resume** hvis snapshot er > 60 min gammel.

## Fallback-tilstander

| Tilstand | Innhold |
|---|---|
| Aldri åpnet | `null` — widget viser "Åpne Babyora for dagens antrekk". |
| Utdatert (> 12 t) | Vis siste snapshot dempet + "Sjekk Babyora" overlay. |
| Ukjent `v` | Vis "Åpne Babyora" fallback. |

## iOS (App Group)

- Group: `group.no.klemeg.app`
- Filnavn: `widget-snapshot.json`
- Skriving via plugin → `WidgetCenter.reloadAllTimelines()`

## Android (DataStore)

- Datastore-fil: `widget_snapshot_preferences`
- Nøkkel: `snapshot_json` (string)
- Skriving via plugin → `AppWidgetManager.notifyAppWidgetViewDataChanged()` broadcast
