import { RUBRIC } from './config';
import type { AuditIssue, ScoredAudit, ScoredPage } from './types';

const severityRank = { critical: 4, high: 3, medium: 2, low: 1 } as const;

function scoreLabel(score: number): string {
  if (score >= 90) return 'Ledende';
  if (score >= 80) return 'Sterk';
  if (score >= 70) return 'Tydelig forbedringsrom';
  if (score >= 60) return 'Blandet';
  if (score >= 40) return 'Svak';
  return 'Kritisk';
}

function renderFindingList(items: ScoredPage['strengths']): string {
  return items.map((item) => `- **${item.title}:** ${item.detail} _(${item.evidenceType}: ${item.evidence})_`).join('\n');
}

function renderIssueList(items: AuditIssue[]): string {
  if (!items.length) return '- Ingen prioriterte problemer i denne analysen.';
  return items.map((item) => `- **${item.severity.toUpperCase()} — ${item.title}:** ${item.detail}\n  - Evidens: ${item.evidenceType} — ${item.evidence}\n  - Effekt: ${item.impact}\n  - Retning: ${item.recommendation}`).join('\n');
}

export function renderReport(audit: ScoredAudit): string {
  const total = audit.totalScore === null ? `Ufullstendig (foreløpig ${audit.provisionalScore}/100)` : `${audit.totalScore}/100`;
  const scoreRows = audit.pages
    .slice()
    .sort((a, b) => b.appWeight - a.appWeight)
    .map((page) => `| ${page.label} | ${page.score} | ${page.appWeight}% | ${page.delta === null ? '—' : page.delta > 0 ? `+${page.delta}` : page.delta} |`)
    .join('\n');
  const pageSections = audit.pages.map((page) => {
    const dimensions = RUBRIC.map((dimension) => `| ${dimension.label} | ${page.dimensionScores[dimension.id]} | ${dimension.weight}% |`).join('\n');
    return `## ${page.label}\n\n**Score: ${page.score}/100 — ${scoreLabel(page.score)}**  \nKommersiell rolle: ${page.commercialDiagnosis}  \nVurderingssikkerhet: ${page.confidence} — ${page.confidenceReason}\n\n### Delkarakterer\n\n| Område | Score | Vekt |\n|---|---:|---:|\n${dimensions}\n\n### Det som fungerer\n\n${renderFindingList(page.strengths)}\n\n### Det som bør forbedres\n\n${renderIssueList(page.issues)}`;
  }).join('\n\n');

  return `# Babyora — produktreise-audit\n\n- **Vektet totalscore:** ${total}\n- **Uvektet gjennomsnitt:** ${audit.unweightedMean}/100\n- **Sterkeste side:** ${audit.highestPage.label} (${audit.highestPage.score})\n- **Svakeste side:** ${audit.lowestPage.label} (${audit.lowestPage.score})\n- **Problemer:** ${audit.issueCounts.critical} kritiske · ${audit.issueCounts.high} høye · ${audit.issueCounts.medium} middels · ${audit.issueCounts.low} lave\n\n${audit.productDiagnosis}\n\n**Viktigste barriere for kjøpsvilje:** ${audit.primaryPurchaseBlocker}\n\n## Scoreoversikt\n\n| Side | Score | Totalvekt | Endring |\n|---|---:|---:|---:|\n${scoreRows}\n\n## Funn på tvers av sider\n\n${renderIssueList(audit.crossScreenFindings)}\n\n${pageSections}\n`;
}

interface RankedIssue { issue: AuditIssue; page: ScoredPage | null; rank: number }

function prioritizedIssues(audit: ScoredAudit): RankedIssue[] {
  const ranked: RankedIssue[] = [
    ...audit.crossScreenFindings.map((issue) => ({ issue, page: null, rank: severityRank[issue.severity] * 100 + 50 })),
    ...audit.pages.flatMap((page) => page.issues.map((issue) => ({ issue, page, rank: severityRank[issue.severity] * 100 + page.appWeight - page.score / 100 }))),
  ];
  return ranked.sort((a, b) => b.rank - a.rank).slice(0, 5);
}

export function renderNextPrompt(audit: ScoredAudit): string {
  const initiatives = prioritizedIssues(audit);
  const preserved = audit.pages
    .slice()
    .sort((a, b) => b.score - a.score)
    .flatMap((page) => page.strengths.map((strength) => `${page.label}: ${strength.title} — ${strength.detail}`))
    .slice(0, 5);
  const blocks = initiatives.map(({ issue, page }, index) => `### Tiltak ${index + 1}: ${issue.title}\n\n- **Berørte sider:** ${page?.label ?? 'Flere sider'}\n- **Hvorfor:** ${issue.impact}\n- **Evidens:** ${issue.evidenceType} — ${issue.evidence}\n- **Endring:** ${issue.recommendation}\n- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.`).join('\n\n');

  return `# Forbedringsprompt — Babyora\n\n**Mål:** Løft Babyora fra ${audit.totalScore ?? audit.provisionalScore}/100 ved å gjøre dagens gratisverdi raskere og mer troverdig, og Plus-verdien fremover, overalt og sammen mer konkret.\n\n## Dette skal bevares\n\n${preserved.map((item) => `- ${item}`).join('\n')}\n\n## Prioriterte tiltak\n\n${blocks || 'Ingen validerte tiltak tilgjengelig.'}\n\n## Ikke gjør\n\n- Ikke gjennomfør et generelt redesign eller endre Babyoras visuelle identitet uten evidens.\n- Ikke gjør gratisanbefalingen mindre korrekt eller mindre komplett.\n- Ikke bruk fake urgency, frykt, skam eller manipulerende opt-out-copy.\n- Ikke påstå at en funksjon finnes før den er verifisert i kode og runtime.\n- Ikke legg til nye funksjoner utenfor tiltakene.\n\n## Verifisering\n\nKjør relevante tester, ta de samme skjermbildene på 390×844, og rapporter scoreendring med samme rubrikkversjon.\n`;
}

