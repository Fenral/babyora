import { describe, expect, it } from 'vitest';

const appSource = (await import('../../App.tsx?raw') as { default: string }).default;

describe('App — horisontal, retningsstyrt navigasjon', () => {
  it('moves both root surfaces together with a restrained shared axis', () => {
    expect(appSource).toContain('custom={routeDirection} mode="sync"');
    expect(appSource).toContain('retning * 16');
    expect(appSource).toContain('retning * -12');
    expect(appSource).toContain('TAB_REKKEFOLGE[next] > TAB_REKKEFOLGE[tab] ? 1 : -1');
  });

  it('uses full-width horizontal push/back for hierarchical drills', () => {
    expect(appSource).toContain("'translate3d(100%, 0, 0)'");
    expect(appSource).toContain("'translate3d(-18%, 0, 0)'");
    expect(appSource).not.toMatch(/y:\s*sceneHeight|useSceneHeight/u);
  });

  it('uses the unified OS/app reduced-motion preference and tokenized edge reset', () => {
    expect(appSource).toContain("import { useNativeSettings } from './hooks/useNativeSettings';");
    expect(appSource).toContain('const { reducedMotion } = useNativeSettings();');
    expect(appSource).toContain("el.style.transition = 'transform var(--dw-m-state) var(--dw-ease)';");
    expect(appSource).not.toMatch(/function prefersReducedMotion/u);
  });
});
