/**
 * Mapper feels-like-temperatur til en kort norsk tilstand-etikett.
 * Brukes på HomeScreen som visuell anchor under hero-tallet.
 *
 * Iter 23.5: introdusert for å gi hero "mer fortelling" enn bare et tall.
 * Speiler band-grensene i wool-layers/tables.ts (`bandForTemp`) for å gi
 * sammenheng mellom anbefalingen og tilstanden brukeren leser.
 */
export function feelsToMood(feelsLikeC: number): string {
  if (feelsLikeC <= -10) return 'Streng kuldegrad';
  if (feelsLikeC <= -5) return 'Frost — pakk inn';
  if (feelsLikeC <= 0) return 'Kald vinterdag';
  if (feelsLikeC <= 7) return 'Kjølig høstdag';
  if (feelsLikeC <= 14) return 'Mild vårdag';
  if (feelsLikeC <= 20) return 'Behagelig dag';
  return 'Varm sommerdag';
}
