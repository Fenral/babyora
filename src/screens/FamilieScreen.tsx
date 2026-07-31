/**
 * R7 Task 3 — Familie-roten.
 * Hoster innstillingsinnholdet til R7 Task 7 restrukturerer roten i
 * seksjonene Barn / De som passer / Steder / Babyora Plus (+ juridisk
 * nederst). Tynn wrapper — ingen duplisering av skjermlogikk.
 */

import { InnstillingerScreen } from './InnstillingerScreen';
import type { FamilieToolTarget, TabKey } from '../types/nav';

type Props = {
  onNavigate: (tab: TabKey) => void;
  /** P1: åpner en av de tidligere Guide-"kunnskap"-skjermene (uendret) via
   *  Familie sin nye "Verktøy"-seksjon — se ToolsSection.tsx. */
  onOpenTool: (target: FamilieToolTarget) => void;
};

export function FamilieScreen({ onNavigate, onOpenTool }: Props) {
  return <InnstillingerScreen onNavigate={onNavigate} onOpenTool={onOpenTool} />;
}
