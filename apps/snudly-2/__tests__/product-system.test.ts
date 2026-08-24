import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = resolve(import.meta.dirname, '..');

function source(file: string): string {
  return readFileSync(resolve(APP, file), 'utf8');
}

describe('Snudly 2 product system', () => {
  it('has one explicit design system and no raw colors in screen CSS', () => {
    expect(existsSync(resolve(APP, 'design-system.css'))).toBe(true);
    expect(existsSync(resolve(APP, 'DESIGN-SYSTEM.md'))).toBe(true);
    expect(existsSync(resolve(APP, 'ui.tsx'))).toBe(true);

    const system = source('design-system.css');
    const screens = `${source('snudly.css')}\n${source('reference-parity.css')}`;

    expect(system).toContain('--sn-color-canvas');
    expect(system).toContain('--sn-font-display');
    expect(system).toContain('--sn-target-min: 44px');
    expect(system).toContain('--sn-radius-card');
    expect(system).toContain('--sn-shadow-card');
    expect(system).toContain('@media (forced-colors: active)');
    expect(system).toContain('@media (prefers-reduced-motion: reduce)');
    expect(screens).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/iu);
    expect(source('main.tsx')).toContain("import './design-system.css'");
    expect(source('main.tsx')).toContain("import './reference-parity.css'");
    expect(source('home-review-main.tsx')).toContain("import './design-system.css'");
    expect(source('DESIGN-SYSTEM.md')).toContain('5KN5PHFXBfmTgRTiTlITs0:9:3');
  });

  it('implements all four product roots as real navigable screens', () => {
    for (const file of ['ProductApp.tsx', 'PlanScreen.tsx', 'ToolsScreen.tsx', 'FamilyScreen.tsx']) {
      expect(existsSync(resolve(APP, file)), `missing ${file}`).toBe(true);
    }

    const product = source('ProductApp.tsx');
    expect(product).toContain('<HomeScreen');
    expect(product).toContain('<PlanScreen');
    expect(product).toContain('<ToolsScreen');
    expect(product).toContain('<FamilyScreen');
    expect(product).toContain('onSelectTab={setTab}');
    expect(product).not.toMatch(/disabled=\{.*(?:plan|tools|family)/u);
  });

  it('locks the owner mock gradient and hanging avatar geometry', () => {
    const home = source('HomeScreen.tsx');
    const parity = source('reference-parity.css');
    const surfaces = `${source('snudly.css')}\n${parity}`;

    expect(home).toContain('/snudly-owner/avatar-a-home-gold.webp');
    expect(home).toContain('className="home-avatar"');
    expect(home).toContain('className="garment-list"');
    expect(home).toContain('className="home-reason"');
    expect(parity).toContain('.snudly-app');
    expect(surfaces).toContain('radial-gradient(circle at 12% 14%');
    expect(parity).toContain('.home-avatar { position: absolute; z-index: 8; top: -82px;');
    expect(parity).toContain('.home-reason { white-space: nowrap; }');
    expect(surfaces).toContain('.garment-list');
  });

  it('uses functional weather and sleep calculators rather than tour-only cards', () => {
    expect(existsSync(resolve(APP, 'calculator-model.ts'))).toBe(true);
    const tools = source('ToolsScreen.tsx');
    const model = source('calculator-model.ts');

    expect(tools).toContain('Værkalkulator');
    expect(tools).toContain('Sovekalkulator');
    expect(tools).toContain('type="range"');
    expect(tools).toContain('calculateWeatherOutfit');
    expect(tools).toContain('calculateSleepLayers');
    expect(model).toContain("from '../../packages/snudly-engine'");
    expect(model).toContain("from '../../src/lib/research/tog-table'");
  });

  it('keeps free v1 independent from billing and paywall availability', () => {
    expect(existsSync(resolve(APP, 'billing-adapter.ts'))).toBe(true);
    const app = source('SnudlyApp.tsx');
    const tour = source('ProductTour.tsx');

    expect(app).not.toContain('loadBillingSnapshot');
    expect(app).not.toContain('<PaywallScreen');
    expect(app).not.toContain('entitlementActive');
    expect(tour).toContain("family: 'Start med Snudly'");
    expect(tour).not.toContain('Se abonnementet');
  });

  it('does not render enabled controls without an action', () => {
    const files = [
      'HomeScreen.tsx',
      'OnboardingFlow.tsx',
      'PaywallScreen.tsx',
      'ProductTour.tsx',
      'ProductApp.tsx',
      'PlanScreen.tsx',
      'ToolsScreen.tsx',
      'FamilyScreen.tsx',
      'ui.tsx',
    ];
    const combined = files.filter((file) => existsSync(resolve(APP, file))).map(source).join('\n');
    const enabledButtonTags = combined.match(/<button\b[\s\S]*?>/gu) || [];

    for (const tag of enabledButtonTags) {
      if (/\bdisabled\b/u.test(tag)) continue;
      expect(tag, `enabled button has no action: ${tag}`).toMatch(/\bonClick=/u);
    }
  });

  it('uses the shared SVG icon set in both product and tour navigation', () => {
    const tour = source('ProductTour.tsx');
    const ui = source('ui.tsx');

    expect(tour).toContain("from './ui'");
    expect(tour).not.toMatch(/icon:\s*['"][⌂▦↔♧]/u);
    for (const icon of ['HomeIcon', 'PlanIcon', 'ToolsIcon', 'FamilyIcon']) {
      expect(ui).toContain(`function ${icon}`);
      expect(tour).toContain(`<${icon}`);
    }
  });

  it('keeps deterministic weather inside the separate product-review entry only', () => {
    expect(source('product-review-main.tsx')).toContain('installProductReviewForecast');
    expect(source('product-review-weather.ts')).toContain("url.pathname === '/api/forecast'");
    expect(source('main.tsx')).not.toContain('installProductReviewForecast');
    expect(source('weather-service.ts')).not.toContain('reviewForecast');
  });

  it('publishes the product review at the mobile control root URL', () => {
    const config = source('vite.product-review.config.ts');
    expect(config).toContain("fileName: 'vercel.json'");
    expect(config).toContain("source: '/'");
    expect(config).toContain("destination: '/product-review.html'");
  });
});
