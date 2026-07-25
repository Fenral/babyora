import type { SnartPlan as SnartPlanResult } from '../../lib/planning/snart';
import './SnartPlan.css';

type Props = Readonly<{
  result: SnartPlanResult;
  onMarkAlreadyHave: (conceptId: string) => void;
}>;

const GROUP_ORDER = [
  'check_first',
  'available_if_needed',
  'not_highlighted',
] as const;

type ReadyResult = Extract<SnartPlanResult, { status: 'ready' }>;
type ReadyItem = ReadyResult['items'][number];

function groupEverySuppliedItem(items: ReadyResult['items']) {
  const groups: Record<(typeof GROUP_ORDER)[number], ReadyItem[]> = {
    check_first: [],
    available_if_needed: [],
    not_highlighted: [],
  };
  for (const item of items) groups[item.group].push(item);
  return groups;
}

export function SnartPlan({ result, onMarkAlreadyHave }: Props) {
  switch (result.status) {
    case 'unavailable':
      return (
        <section className="snart-plan" aria-live="polite">
          <p>{result.copy}</p>
        </section>
      );
    case 'empty':
      return (
        <section className="snart-plan" aria-live="polite">
          <h2>{result.copy.title}</h2>
          <p>{result.copy.empty}</p>
          <p>{result.copy.source}</p>
        </section>
      );
    case 'ready': {
      const groups = groupEverySuppliedItem(result.items);
      return (
        <section className="snart-plan" aria-labelledby="snart-plan-title">
          <h2 id="snart-plan-title">{result.copy.title}</h2>
          <p>{result.copy.subtitle}</p>
          {GROUP_ORDER.map((group) => {
            const items = groups[group];
            if (items.length === 0) return null;
            return (
              <section
                key={group}
                className="snart-plan__group"
                aria-labelledby={`snart-group-${group}`}
              >
                <h3 id={`snart-group-${group}`}>
                  {result.copy.groups[group]}
                </h3>
                <ul>
                  {items.map((item) => (
                    <li key={item.conceptId} data-snart-item={item.conceptId}>
                      <p>{item.copy}</p>
                      {item.canMarkAlreadyHave && (
                        <button
                          type="button"
                          data-concept-id={item.conceptId}
                          onClick={() => onMarkAlreadyHave(item.conceptId)}
                        >
                          Har allerede
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <p>{result.copy.note}</p>
          <p>{result.copy.source}</p>
        </section>
      );
    }
  }
}
