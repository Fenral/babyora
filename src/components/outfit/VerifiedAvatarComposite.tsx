/**
 * R7 Task 4 — verifisert ytterantrekk-avatar (visual-signature-spec §4).
 *
 * Viser KUN godkjente komposittbilder fra manifestet (avatarAssetFor) —
 * tomt manifest til R8 → alltid den nøytrale silhuetten. Aldri nærmeste-
 * nabo-gjetting; plagglisten er fasit ved manglende asset.
 *
 * A11y (lead-krav 3): silhuetten er aria-hidden når scenens sr-tekst-
 * sammendrag står ved siden av (props.decorative=true — Hjem-scenen), ellers
 * role="img" + nøytral label. Verifiserte kompositter (R8+) får alt fra
 * samme antrekkssammendrag som sr-teksten — aldri filnavn. Crossfade
 * 180–240 ms kun mellom to verifiserte kompositter; redusert bevegelse
 * bytter umiddelbart.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { avatarAssetFor, avatarStateKeyId, type AvatarStateKey } from '../../lib/recommendation/avatar-state.js';

type Props = {
  stateKey: AvatarStateKey;
  /** Antrekkssammendrag for alt-tekst på verifiserte kompositter. */
  outfitSummary: string;
  /** true når et tilstøtende sr-sammendrag bærer teksten (Hjem-scenen). */
  decorative?: boolean;
  reducedMotion?: boolean;
  size?: number;
  /**
   * Pragmatisk legacy-match (R8, eierbeslutning 2026-07-15): asset-sti eller
   * null (→ silhuett). Når satt (≠ undefined) overstyrer den manifest-oppslaget
   * — brukes så lenge dagens motor kjører. undefined = bruk APPROVED_COMPOSITES
   * (Motor V2 / streng full-nøkkel-match).
   */
  assetOverride?: string | null;
};

const FADE_MS = 220; // spec §4: 180–240 ms

export function VerifiedAvatarComposite({
  stateKey, outfitSummary, decorative = false, reducedMotion = false, size = 200,
  assetOverride,
}: Props) {
  const asset = assetOverride !== undefined ? assetOverride : avatarAssetFor(stateKey);
  const keyId = avatarStateKeyId(stateKey);
  const prevAssetRef = useRef<string | null>(asset);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Crossfade kun mellom TO verifiserte kompositter (aldri mot silhuett).
    if (!reducedMotion && asset && prevAssetRef.current && asset !== prevAssetRef.current) {
      setFading(true);
      const t = window.setTimeout(() => setFading(false), FADE_MS);
      return () => window.clearTimeout(t);
    }
    prevAssetRef.current = asset;
    return undefined;
  }, [asset, reducedMotion]);

  const frame: CSSProperties = {
    width: size, height: size * 1.05, position: 'relative',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  };

  if (asset) {
    return (
      <div style={frame} data-avatar-key={keyId}>
        <img
          src={asset}
          alt={decorative ? '' : outfitSummary}
          aria-hidden={decorative || undefined}
          style={{
            maxWidth: '100%', maxHeight: '100%',
            opacity: fading ? 0 : 1,
            transition: reducedMotion ? 'none' : `opacity ${FADE_MS}ms ease`,
          }}
        />
      </div>
    );
  }

  // Nøytral silhuett — myk clay-tone, positurstyrt (sittende/stående).
  const sitting = stateKey.pose === 'sitting';
  const a11yProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': 'Nøytral barnefigur — antrekket står i listen' };
  return (
    <div style={frame} data-avatar-key={keyId} {...a11yProps}>
      <svg width={size * 0.9} height={size} viewBox="0 0 180 200" aria-hidden="true">
        <ellipse cx={90} cy={196} rx={sitting ? 62 : 46} ry={7} fill="color-mix(in oklab, var(--ink-900) 12%, transparent)" />
        <circle cx={90} cy={sitting ? 66 : 48} r={34} fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" />
        {sitting ? (
          <>
            <path d="M40 150 a50 44 0 0 1 100 0 v22 a10 10 0 0 1 -10 10 H50 a10 10 0 0 1 -10 -10 Z" fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" />
            <ellipse cx={52} cy={182} rx={20} ry={12} fill="var(--avatar-glow)" />
            <ellipse cx={128} cy={182} rx={20} ry={12} fill="var(--avatar-glow)" />
          </>
        ) : (
          <>
            <rect x={58} y={84} width={64} height={82} rx={26} fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" />
            <rect x={64} y={158} width={22} height={36} rx={10} fill="var(--avatar-glow)" />
            <rect x={94} y={158} width={22} height={36} rx={10} fill="var(--avatar-glow)" />
          </>
        )}
      </svg>
    </div>
  );
}
