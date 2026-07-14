/**
 * R7 Task 3 — Familie-roten.
 * Hoster innstillingsinnholdet til R7 Task 7 restrukturerer roten i
 * seksjonene Barn / De som passer / Steder / Babyora Plus (+ juridisk
 * nederst). Tynn wrapper — ingen duplisering av skjermlogikk.
 */

import { InnstillingerScreen } from './InnstillingerScreen';
import type { TabKey } from '../types/nav';

type Props = {
  onNavigate: (tab: TabKey) => void;
};

export function FamilieScreen({ onNavigate }: Props) {
  return <InnstillingerScreen onNavigate={onNavigate} />;
}
