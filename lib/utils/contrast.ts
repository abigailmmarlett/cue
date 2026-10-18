/*
 * WCAG contrast checks for theme colors. Colors can be "#rgb", "#rrggbb" or "rgba(r,g,b,a)"; a
 * semi-transparent color is blended onto the background it sits on, as it would be on screen.
 */

type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; alpha: number } {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb, alpha: 1 };
  }
  const rgba = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) {
    return { rgb: [+rgba[1], +rgba[2], +rgba[3]], alpha: rgba[4] === undefined ? 1 : +rgba[4] };
  }
  throw new Error(`Unsupported color: ${color}`);
}

/** The opaque color seen when `color` is drawn over `background` (each may be translucent). */
export function blend(color: string, ...backgrounds: string[]): Rgb {
  let base: Rgb = [255, 255, 255];
  for (const layer of [...backgrounds].reverse().concat(color)) {
    const { rgb, alpha } = parse(layer);
    base = rgb.map((c, i) => c * alpha + base[i] * (1 - alpha)) as Rgb;
  }
  return base;
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * Contrast ratio of `foreground` drawn over `backgrounds` (listed from the nearest layer down to the
 * opaque one underneath). WCAG asks for 4.5 for normal text and 3 for large text and icons.
 */
export function contrastRatio(foreground: string, ...backgrounds: string[]): number {
  const bg = blend(backgrounds[0], ...backgrounds.slice(1));
  const fg = blend(foreground, `rgb(${bg.join(',')})`);
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/**
 * `color`, darkened toward black on a light background or lightened toward white on a dark one, just
 * enough to reach `target` contrast over `backgrounds`. The hue stays the same; a color that already
 * passes is returned as is.
 */
export function ensureContrast(color: string, target: number, ...backgrounds: string[]): string {
  if (contrastRatio(color, ...backgrounds) >= target) return color;
  const bg = blend(backgrounds[0], ...backgrounds.slice(1));
  const toward = luminance(bg) > 0.18 ? 0 : 255;
  const start = blend(color, `rgb(${bg.join(',')})`);
  for (let step = 1; step <= 100; step++) {
    const mixed = toHex(start.map((c) => c + (toward - c) * (step / 100)) as Rgb);
    if (contrastRatio(mixed, ...backgrounds) >= target) return mixed;
  }
  return toward === 0 ? '#000000' : '#ffffff';
}

/** Whichever of the two text colors reads better on `background`. */
export function bestTextOn(background: string, light: string, dark: string): string {
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark;
}
