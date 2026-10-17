import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl, decodeShareData, validateSharePayload, type SharePayload } from './sharePayload.ts';

const v2: SharePayload = {
  v: 2,
  name: 'Barre',
  icons: [
    { color: '#3B82F6', size: 'S', label: 'Ball' },
    { color: '#EF4444', label: 'Band' },
  ],
  sections: [
    {
      name: 'Warmup',
      exercises: [
        {
          name: 'Lunge',
          duration: 30,
          side: 'left',
          is_bilateral: 1,
          variation_sets: [{ instruction: 'pulse', atSeconds: 10 }],
          loads: { base: [0, 1], amplified: [1] },
          tags: [{ c: 'Area', l: 'Legs' }],
        },
        { name: 'Plank', duration: 60 },
      ],
    },
  ],
};

describe('share links', () => {
  test('a version 2 payload survives building and decoding a link', () => {
    assert.deepEqual(decodeShareData(buildShareUrl(v2)), v2);
  });

  test('decodes a link whose data is still percent-encoded', () => {
    assert.deepEqual(decodeShareData(encodeURIComponent(JSON.stringify(v2))), v2);
  });

  test('version 1 links still import, with their loads kept as legacy icon ids', () => {
    const p = validateSharePayload({
      v: 1,
      name: 'Old',
      sections: [
        { name: 'Main', exercises: [{ name: 'Squat', duration: 30, load_base: '["id-1","id-2"]', is_bilateral: 1 }] },
      ],
    });
    assert.deepEqual(p, {
      v: 2,
      name: 'Old',
      sections: [
        {
          name: 'Main',
          exercises: [{ name: 'Squat', duration: 30, is_bilateral: 1, legacy_loads: { base: ['id-1', 'id-2'] } }],
        },
      ],
    });
  });

  test('rejects malformed input without throwing', () => {
    const bad = [
      'cue://import?data=%E0%A4%A',
      'cue://import?data=',
      'not json',
      JSON.stringify(null),
      JSON.stringify({ v: 3, name: 'x', sections: [{ exercises: [] }] }),
      JSON.stringify({ v: 2, name: 'x', sections: [] }),
      JSON.stringify({ v: 2, name: '', sections: [{ exercises: [] }] }),
      JSON.stringify({ v: 2, name: 'x', sections: [{}] }),
      JSON.stringify({ v: 2, name: 'x', sections: [{ exercises: [{}] }] }),
      JSON.stringify({ v: 2, name: 'x', sections: [{ exercises: [{ name: 'a', duration: '30' }] }] }),
      JSON.stringify({ v: 2, name: 'x', sections: Array(51).fill({ exercises: [] }) }),
    ];
    for (const input of bad) assert.equal(decodeShareData(input), null, input.slice(0, 60));
  });
});

describe('validateSharePayload cleanup', () => {
  test('drops invalid icons and renumbers the loads that use the rest', () => {
    const p = validateSharePayload({
      v: 2,
      name: 'x',
      icons: [{ color: 'red', label: 'Bad color' }, { color: '#fff', label: 'Ok' }, { color: '#000' }, 'junk'],
      sections: [{ exercises: [{ name: 'a', duration: 10, loads: { base: [0, 1, 2, 3, 9, -1, 1.5, 'x'] } }] }],
    });
    assert.deepEqual(p?.icons, [{ color: '#fff', label: 'Ok' }]);
    assert.deepEqual(p?.sections[0].exercises[0].loads, { base: [0] });
  });

  test('omits loads and icons entirely when nothing valid is left', () => {
    const p = validateSharePayload({
      v: 2,
      name: 'x',
      icons: [{ color: 'nope', label: 'x' }],
      sections: [{ exercises: [{ name: 'a', duration: 10, loads: { base: [0] } }] }],
    });
    assert.equal(p?.icons, undefined);
    assert.equal(p?.sections[0].exercises[0].loads, undefined);
  });

  test('cleans variation sets: drops bad items and keeps times within the exercise', () => {
    const p = validateSharePayload({
      v: 2,
      name: 'x',
      sections: [
        {
          exercises: [
            {
              name: 'a',
              duration: 30,
              variation_sets: [
                { instruction: 'early', atSeconds: -5 },
                { instruction: 'late', atSeconds: 99 },
                { instruction: 'auto', atSeconds: null },
                { instruction: '', atSeconds: 1 },
                { instruction: 'nan', atSeconds: 'soon' },
              ],
            },
          ],
        },
      ],
    });
    assert.deepEqual(p?.sections[0].exercises[0].variation_sets, [
      { instruction: 'early', atSeconds: 0 },
      { instruction: 'late', atSeconds: 30 },
      { instruction: 'auto', atSeconds: null },
    ]);
  });

  test('cleans optional fields and clamps durations', () => {
    const p = validateSharePayload({
      v: 2,
      name: '  Flow  ',
      sections: [
        {
          exercises: [
            { name: 'A', duration: -5, side: 'up', is_bilateral: 'yes', tags: [{ c: 'Lvl', l: 'Hi' }, { c: 5 }] },
            { name: 'B', duration: 12.6, notes: 7, loads: 'nope' },
          ],
        },
      ],
    });
    assert.equal(p?.name, 'Flow');
    assert.equal(p?.sections[0].name, 'Section');
    assert.deepEqual(p?.sections[0].exercises, [
      { name: 'A', duration: 1, tags: [{ c: 'Lvl', l: 'Hi' }] },
      { name: 'B', duration: 13 },
    ]);
  });
});
