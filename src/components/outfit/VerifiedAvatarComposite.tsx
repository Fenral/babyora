import type { CSSProperties } from 'react';
import {
  isOutfitTruthSnapshot,
  type OutfitAvatarTruth,
  type OutfitAvatarPose,
  type OutfitTruthSnapshotV1,
} from '../../lib/outfit/outfit-truth.js';

type SharedProps = Readonly<{
  decorative?: boolean;
  reducedMotion?: boolean;
  size?: number;
}>;

type CanonicalProps = SharedProps & Readonly<{
  snapshot: OutfitTruthSnapshotV1;
  avatarTruth: OutfitAvatarTruth;
  stateKey?: never;
  outfitSummary?: never;
  assetOverride?: never;
}>;

type LegacyProps = SharedProps & Readonly<{
  /** Temporary protected-Hjem compatibility seam; it always stays neutral. */
  stateKey: Readonly<{ pose: OutfitAvatarPose }>;
  outfitSummary: string;
  assetOverride?: string | null;
  snapshot?: never;
  avatarTruth?: never;
}>;

export type VerifiedAvatarCompositeProps = CanonicalProps | LegacyProps;

function NeutralAvatar({
  pose,
  decorative,
  size,
  snapshotId,
}: Readonly<{
  pose: OutfitAvatarPose;
  decorative: boolean;
  size: number;
  snapshotId?: string;
}>) {
  const sitting = pose === 'sitting';
  const frame: CSSProperties = {
    width: size,
    height: size * 1.05,
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };
  const a11yProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': 'Nøytral barnefigur — antrekket står i listen' };
  return (
    <div style={frame} data-avatar-truth="neutral" data-avatar-snapshot={snapshotId} {...a11yProps}>
      <svg width={size * 0.9} height={size} viewBox="0 0 180 200" aria-hidden="true">
        <ellipse cx={90} cy={196} rx={sitting ? 62 : 46} ry={7} fill="color-mix(in oklab, var(--ink-900) 12%, transparent)" />
        <circle cx={90} cy={sitting ? 66 : 48} r={34} fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" />
        {sitting ? <><path d="M40 150 a50 44 0 0 1 100 0 v22 a10 10 0 0 1 -10 10 H50 a10 10 0 0 1 -10 -10 Z" fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" /><ellipse cx={52} cy={182} rx={20} ry={12} fill="var(--avatar-glow)" /><ellipse cx={128} cy={182} rx={20} ry={12} fill="var(--avatar-glow)" /></> : <><rect x={58} y={84} width={64} height={82} rx={26} fill="var(--avatar-glow)" stroke="color-mix(in oklab, var(--ink-900) 14%, transparent)" /><rect x={64} y={158} width={22} height={36} rx={10} fill="var(--avatar-glow)" /><rect x={94} y={158} width={22} height={36} rx={10} fill="var(--avatar-glow)" /></>}
      </svg>
    </div>
  );
}

export function VerifiedAvatarComposite(props: VerifiedAvatarCompositeProps) {
  const decorative = props.decorative ?? false;
  const size = props.size ?? 200;
  if ('stateKey' in props && props.stateKey !== undefined) {
    return <NeutralAvatar pose={props.stateKey.pose} decorative={decorative} size={size} />;
  }

  const snapshot = props.snapshot;
  const avatarTruth = props.avatarTruth;
  const neutralPose = snapshot?.avatar.pose ?? 'standing';
  if (
    snapshot === undefined
    || avatarTruth === undefined
    || !isOutfitTruthSnapshot(snapshot)
    || snapshot.avatar !== avatarTruth
    || avatarTruth.verifiedAssetPath === null
  ) {
    return <NeutralAvatar pose={neutralPose} decorative={decorative} size={size} snapshotId={snapshot?.snapshotId} />;
  }

  return (
    <div
      style={{ width: size, height: size * 1.05, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      data-avatar-truth="verified"
      data-avatar-snapshot={snapshot.snapshotId}
    >
      <img
        src={avatarTruth.verifiedAssetPath}
        alt={decorative ? '' : 'Verifisert antrekksillustrasjon'}
        aria-hidden={decorative || undefined}
        style={{ maxWidth: '100%', maxHeight: '100%', transition: props.reducedMotion ? 'none' : 'opacity 220ms ease' }}
      />
    </div>
  );
}
