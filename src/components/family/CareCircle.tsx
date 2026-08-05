/**
 * CareCircle — R7 Task 7, R9-forhåndsvisning (dev-only).
 *
 * Viser barnet i sentrum med inntil fire omsorgspersoner rundt + «+N»-overflow.
 * Forbindelsen tegnes SOLID for delte (aksepterte) og STIPLET for ventende
 * invitasjoner — aldri farge alene (linjestil bærer skillet), og aldri noe som
 * antyder live tilstedeværelse, posisjon eller sporing. SVG-klyngen er rent
 * dekorativ (aria-hidden); den tilgjengelige informasjonen ligger i rollelisten
 * under, med eksplisitt navn/rolle/status.
 *
 * Familiedeling krever auth/RLS/backend (R9) og er IKKE aktivert. Denne
 * komponenten rendres kun bak import.meta.env.DEV som en designforhåndsvisning.
 */
import type { CSSProperties, ReactElement } from 'react';
import {
  summarizeCareCircle,
  caregiverInitials,
  caregiverStatusLabel,
  type Caregiver,
} from './care-circle-model';

// Fire faste posisjoner (topp/høyre/bunn/venstre) på en radius rundt sentrum.
const SLOTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 100, y: 30 },
  { x: 170, y: 100 },
  { x: 100, y: 170 },
  { x: 30, y: 100 },
];
const CENTER = { x: 100, y: 100 };

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  padding: '4px 0 2px',
};

const svgStyle: CSSProperties = { width: 176, height: 176, flex: 'none' };

/* D2: pillen hadde `background: var(--surface-soft)`. Det tokenet løser opp i
   var(--dw-raised) — NØYAKTIG samme farge som groupCardStyle-kortet den
   rendres inni (InnstillingerScreen l. 266: `background: C.cardBg` =
   var(--dw-raised)). Fyllet malte altså raised på raised og var usynlig; det
   eneste det gjorde var å påstå «hevet materiale» uten lyslogikk. En
   aria-hidden telle-etikett er ingen hevet flate — den er en merkelapp på
   platen den ligger på. Fyllet er derfor FJERNET, ikke pyntet med dybde:
   hårstrek-ringen bærer formen, og pikslene er identiske som før. */
const overflowPillStyle: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid var(--ink-200)',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--ink-700)',
};

const roleListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const roleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

/* D2, samme grunn som pillen over: `var(--surface)` = var(--dw-raised) = fargen
   på kortet skiven ligger oppå. Initial-skiven er en identitets-etikett, ikke
   et materiale, og en 32 px sirkel skal ikke bære var(--dw-depth-raised) (som
   er en 56 px kort-skygge med x-forskyvning). Fyllet er fjernet; ringen bærer
   formen. SVG-noden over beholder sin `fill` — der okkluderer fyllet enden av
   eiker-linjen og gjør faktisk arbeid. */
const roleTokenStyle: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid var(--ink-200)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8125rem',
  fontWeight: 700,
  color: 'var(--ink-700)',
};

const roleBodyStyle: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
const roleNameStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-900)' };
const roleMetaStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--ink-500)' };

function Spoke({ to, pending }: { to: { x: number; y: number }; pending: boolean }): ReactElement {
  return (
    <line
      x1={CENTER.x}
      y1={CENTER.y}
      x2={to.x}
      y2={to.y}
      stroke="var(--ink-300)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray={pending ? '3 5' : undefined}
    />
  );
}

export function CareCircle({
  childName,
  caregivers,
}: {
  childName: string;
  caregivers: readonly Caregiver[];
}): ReactElement {
  const { visible, overflowCount } = summarizeCareCircle(caregivers);
  const childInitial = caregiverInitials(childName);

  return (
    <div style={wrapStyle}>
      {/* Dekorativ klynge — semantikken ligger i rollelisten under. */}
      <svg
        viewBox="0 0 200 200"
        style={svgStyle}
        aria-hidden="true"
        focusable="false"
      >
        {visible.map((c, i) => (
          <Spoke key={`spoke-${c.id}`} to={SLOTS[i]} pending={c.status === 'pending'} />
        ))}
        {visible.map((c, i) => (
          <g key={`node-${c.id}`}>
            <circle
              cx={SLOTS[i].x}
              cy={SLOTS[i].y}
              r={20}
              fill="var(--surface)"
              stroke="var(--ink-200)"
              strokeWidth={1.5}
            />
            <text
              x={SLOTS[i].x}
              y={SLOTS[i].y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="700"
              fill="var(--ink-700)"
            >
              {caregiverInitials(c.name)}
            </text>
          </g>
        ))}
        <circle cx={CENTER.x} cy={CENTER.y} r={26} fill="var(--accent-cta)" />
        <text
          x={CENTER.x}
          y={CENTER.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="18"
          fontWeight="700"
          fill="var(--accent-cta-ink)"
        >
          {childInitial}
        </text>
      </svg>

      {overflowCount > 0 && (
        <span style={overflowPillStyle} aria-hidden="true">
          +{overflowCount} flere
        </span>
      )}

      {/* Tilgjengelig innhold: navn + rolle + status (aldri tilstedeværelse). */}
      <ul style={roleListStyle} aria-label={`De som passer ${childName}`}>
        {caregivers.map((c) => (
          <li key={c.id} style={roleRowStyle}>
            <span style={roleTokenStyle} aria-hidden="true">
              {caregiverInitials(c.name)}
            </span>
            <span style={roleBodyStyle}>
              <span style={roleNameStyle}>
                {c.name} · {c.role}
              </span>
              <span style={roleMetaStyle}>{caregiverStatusLabel(c.status)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
