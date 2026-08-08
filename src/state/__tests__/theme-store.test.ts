import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from '../theme-store';

describe('Mineral Garden theme contract', () => {
  beforeEach(() => {
    useTheme.setState({ mode: 'light' });
  });

  it('starts new installs in light mode', () => {
    expect(useTheme.getState().mode).toBe('light');
  });

  it('retains explicit auto and dark choices', () => {
    useTheme.getState().setMode('auto');
    expect(useTheme.getState().mode).toBe('auto');
    useTheme.getState().setMode('dark');
    expect(useTheme.getState().mode).toBe('dark');
  });

  it('stamps the light launch surface before React and still reads persisted modes', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toMatch(/<html[^>]+data-theme="light"/u);
    expect(html).toContain("var themeMode = 'light';");
    expect(html).toContain("storedMode === 'auto'");
    expect(html).toContain("root.removeAttribute('data-theme')");
    expect(html).toContain("content=\"#F2F5F1\"");
  });
});
