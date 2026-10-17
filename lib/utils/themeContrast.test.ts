import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_PRESETS, buildColors } from '../../constants/themes.ts';
import { contrastRatio } from './contrast.ts';

// WCAG AA for normal-size text.
const AA = 4.5;

for (const preset of THEME_PRESETS) {
  for (const isDark of [false, true]) {
    test(`${preset.name} (${isDark ? 'dark' : 'light'}): text passes ${AA}:1 wherever it's drawn`, () => {
      const c = buildColors(preset, isDark);
      const pages = {
        background: [c.background],
        bgAlt: [c.bgAlt],
        card: [c.surface, c.background],
        header: [c.headerBg],
      };
      const checks: [string, string, string[]][] = [
        ['button label', c.text.onFill, [c.fill.primary]],
        ['selected chip', c.pill.activeText, [c.pill.activeBg]],
        ['tag chip', c.pill.text, [c.pill.bg, c.background]],
        ['tag chip on card', c.pill.text, [c.pill.bg, c.surface, c.background]],
        ['filter pill in header', c.pill.text, [c.pill.bg, c.headerBg]],
        ['filter pill at header top', c.pill.text, [c.pill.bg, c.headerBgDark]],
        ['timer time badge', c.accentText, [c.accentDim, c.background]],
        ['danger text', c.danger, [c.background]],
      ];
      for (const [where, bg] of Object.entries(pages)) {
        checks.push([`primary text on ${where}`, c.text.primary, bg]);
        checks.push([`secondary text on ${where}`, c.text.secondary, bg]);
        checks.push([`tertiary text on ${where}`, c.text.tertiary, bg]);
        checks.push([`accent text on ${where}`, c.accentText, bg]);
      }
      // The list headers are a gradient from headerBgDark down to headerBg. Tertiary gray isn't used
      // on the gradient itself.
      checks.push(['primary text at header top', c.text.primary, [c.headerBgDark]]);
      checks.push(['secondary text at header top', c.text.secondary, [c.headerBgDark]]);
      checks.push(['accent text at header top', c.accentText, [c.headerBgDark]]);
      const failures = checks
        .map(([what, fg, bg]) => [what, contrastRatio(fg, ...bg)] as const)
        .filter(([, ratio]) => ratio < AA)
        .map(([what, ratio]) => `${what}: ${ratio.toFixed(2)}`);
      assert.deepEqual(failures, []);
    });
  }
}
