import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { bestTextOn, contrastRatio, ensureContrast } from './contrast.ts';

describe('contrastRatio', () => {
  test('matches WCAG reference values', () => {
    assert.equal(contrastRatio('#000000', '#ffffff').toFixed(1), '21.0');
    assert.equal(contrastRatio('#fff', '#fff').toFixed(1), '1.0');
    assert.equal(contrastRatio('#767676', '#ffffff').toFixed(2), '4.54');
  });

  test('blends translucent text and backgrounds before comparing', () => {
    // 50% black over white is gray 127.5 of 255: between #7f7f7f and #808080.
    const halfBlack = contrastRatio('rgba(0,0,0,0.5)', '#ffffff');
    assert.ok(halfBlack > contrastRatio('#808080', '#ffffff') && halfBlack < contrastRatio('#7f7f7f', '#ffffff'));
    assert.ok(contrastRatio('#000', 'rgba(0,0,0,0.5)', '#ffffff') < contrastRatio('#000', '#ffffff'));
  });
});

describe('ensureContrast', () => {
  test('leaves a color that already passes alone', () => {
    assert.equal(ensureContrast('#475569', 4.5, '#ffffff'), '#475569');
  });

  test('darkens on light backgrounds and lightens on dark ones, just enough', () => {
    const onLight = ensureContrast('#0EB1D2', 4.5, '#ffffff');
    assert.ok(contrastRatio(onLight, '#ffffff') >= 4.5);
    assert.ok(contrastRatio(onLight, '#ffffff') < 4.7);
    const onDark = ensureContrast('#475569', 4.5, '#111214');
    assert.ok(contrastRatio(onDark, '#111214') >= 4.5);
  });
});

test('bestTextOn picks whichever text color reads better', () => {
  assert.equal(bestTextOn('#7c3aed', '#ffffff', '#111214'), '#ffffff');
  assert.equal(bestTextOn('#0EB1D2', '#ffffff', '#111214'), '#111214');
});
