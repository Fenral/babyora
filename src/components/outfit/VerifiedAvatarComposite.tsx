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

function readOwnDataValue(
  value: unknown,
  key: string,
): unknown {
  try {
    if (
      value === null
      || typeof value !== 'object'
      || Array.isArray(value)
    ) {
      return undefined;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor !== undefined
      && Object.hasOwn(descriptor, 'value')
      && descriptor.enumerable === true
    )
      ? descriptor.value
      : undefined;
  } catch {
    return undefined;
  }
}

function neutralPoseFromLegacy(value: unknown): OutfitAvatarPose {
  const pose = readOwnDataValue(value, 'pose');
  return pose === 'sitting' || pose === 'standing'
    ? pose
    : 'standing';
}

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
  const decorative = readOwnDataValue(props, 'decorative') === true;
  const rawSize = readOwnDataValue(props, 'size');
  const size = (
    typeof rawSize === 'number'
    && Number.isFinite(rawSize)
    && rawSize > 0
  )
    ? rawSize
    : 200;
  const legacyStateKey = readOwnDataValue(props, 'stateKey');
  if (legacyStateKey !== undefined) {
    return (
      <NeutralAvatar
        pose={neutralPoseFromLegacy(legacyStateKey)}
        decorative={decorative}
        size={size}
      />
    );
  }

  const snapshot = readOwnDataValue(props, 'snapshot');
  const avatarTruth = readOwnDataValue(props, 'avatarTruth');
  if (!isOutfitTruthSnapshot(snapshot)) {
    return (
      <NeutralAvatar
        pose="standing"
        decorative={decorative}
        size={size}
      />
    );
  }
  if (
    snapshot.avatar !== avatarTruth
    || snapshot.avatar.verifiedAssetPath === null
  ) {
    return (
      <NeutralAvatar
        pose={snapshot.avatar.pose}
        decorative={decorative}
        size={size}
        snapshotId={snapshot.snapshotId}
      />
    );
  }

  const reducedMotion =
    readOwnDataValue(props, 'reducedMotion') === true;
  return (
    <div
      style={{ width: size, height: size * 1.05, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      data-avatar-truth="verified"
      data-avatar-snapshot={snapshot.snapshotId}
    >
      <img
        src={snapshot.avatar.verifiedAssetPath}
        alt={decorative ? '' : 'Verifisert antrekksillustrasjon'}
        aria-hidden={decorative || undefined}
        style={{ maxWidth: '100%', maxHeight: '100%', transition: reducedMotion ? 'none' : 'opacity 220ms ease' }}
      />
    </div>
  );
}
