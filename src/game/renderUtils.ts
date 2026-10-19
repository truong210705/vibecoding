/**
 * Render helpers shared by the canvas engine and scenery modules.
 * - Gradient cache (gradients were rebuilt every frame before)
 * - Pre-rendered offscreen layers (vignette / light grading)
 * - Soft contact shadows
 * - Viewport culling helper
 */

type Stop = [number, string];

const gradientCache = new Map<string, CanvasGradient>();

/**
 * Returns a cached vertical linear gradient. CanvasGradient objects can be
 * reused across frames, so we only allocate them once per unique key.
 */
export function getVerticalGradient(
  ctx: CanvasRenderingContext2D,
  key: string,
  y0: number,
  y1: number,
  stops: Stop[]
): CanvasGradient {
  const cacheKey = `${key}:${y0}:${y1}`;
  let g = gradientCache.get(cacheKey);
  if (!g) {
    g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    gradientCache.set(cacheKey, g);
  }
  return g;
}

export function clearGradientCache() {
  gradientCache.clear();
}

/** Creates an offscreen canvas (OffscreenCanvas not required, works everywhere). */
export function createLayer(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
}

/**
 * Pre-renders the screen-space post-processing overlay (vignette + level
 * colour grading) ONCE. Per-frame cost is a single drawImage.
 */
export function buildOverlayLayer(
  pxW: number,
  pxH: number,
  levelId: number
): HTMLCanvasElement {
  const layer = createLayer(pxW, pxH);
  const c = layer.getContext('2d')!;

  // Colour grading per level (very subtle, adds mood)
  const grade: Record<number, { top: string; bottom: string }> = {
    1: { top: 'rgba(255, 214, 140, 0.10)', bottom: 'rgba(14, 116, 144, 0.06)' }, // warm sun / cool water
    2: { top: 'rgba(255, 190, 120, 0.08)', bottom: 'rgba(30, 41, 59, 0.08)' },
    3: { top: 'rgba(30, 58, 138, 0.10)', bottom: 'rgba(15, 23, 42, 0.12)' },
    4: { top: 'rgba(88, 28, 135, 0.10)', bottom: 'rgba(15, 23, 42, 0.14)' },
  };
  const gr = grade[levelId] || grade[1];
  const lg = c.createLinearGradient(0, 0, 0, pxH);
  lg.addColorStop(0, gr.top);
  lg.addColorStop(1, gr.bottom);
  c.fillStyle = lg;
  c.fillRect(0, 0, pxW, pxH);

  // Vignette
  const r = Math.hypot(pxW, pxH) * 0.5;
  const vg = c.createRadialGradient(pxW / 2, pxH / 2, r * 0.55, pxW / 2, pxH / 2, r);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  c.fillStyle = vg;
  c.fillRect(0, 0, pxW, pxH);

  return layer;
}

/**
 * Soft elliptical contact shadow. Two stacked ellipses give a cheap soft edge
 * without shadowBlur (which is very slow on Canvas2D).
 */
export function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  width: number,
  alpha = 0.28
) {
  const prev = ctx.globalAlpha;
  ctx.fillStyle = '#000';
  ctx.globalAlpha = prev * alpha * 0.55;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, width * 0.62, width * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev * alpha;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, width * 0.42, width * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev;
}

/** True when the horizontal span [x, x+w] intersects the camera view (+ margin). */
export function inView(
  camX: number,
  viewW: number,
  x: number,
  w: number,
  margin = 80
): boolean {
  return x + w >= camX - margin && x <= camX + viewW + margin;
}
