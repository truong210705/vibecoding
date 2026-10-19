/**
 * Level 3 Scenery: Dinh thự Bá Hộ Long về đêm.
 *
 * Everything static (mansion silhouettes, bamboo groves) is pre-rendered ONCE into
 * small repeating tiles, so each frame only costs a handful of drawImage calls.
 * Only the stars' twinkle and the moon are drawn live.
 */

import { getVerticalGradient } from './renderUtils';

const FAR_W = 480; // mansion silhouette tile period
const FAR_H = 230;
const NEAR_W = 320; // bamboo tile period
const NEAR_H = 210;

// Deterministic pseudo random (stable across frames / reloads)
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Stars in a fixed 960x300 sky region
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: Math.floor(rnd(i + 1) * 960),
  y: Math.floor(rnd(i + 101) * 260) + 6,
  s: rnd(i + 201) > 0.85 ? 2 : 1,
  phase: rnd(i + 301) * Math.PI * 2,
  twinkle: i % 3 === 0,
}));

export class Level3Scenery {
  private static farTile: HTMLCanvasElement | null = null;
  private static nearTile: HTMLCanvasElement | null = null;
  private static tileScale = 0;
  private static moonGlow: CanvasGradient | null = null;

  /** Curved Vietnamese/Chinese style roof silhouette with upswept eaves. */
  private static roof(
    c: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    halfW: number,
    h: number
  ) {
    c.beginPath();
    c.moveTo(cx - halfW - 14, baseY - 8); // upswept left eave tip
    c.quadraticCurveTo(cx - halfW * 0.7, baseY + 2, cx - halfW * 0.45, baseY - h * 0.35);
    c.quadraticCurveTo(cx - halfW * 0.15, baseY - h * 0.9, cx, baseY - h);
    c.quadraticCurveTo(cx + halfW * 0.15, baseY - h * 0.9, cx + halfW * 0.45, baseY - h * 0.35);
    c.quadraticCurveTo(cx + halfW * 0.7, baseY + 2, cx + halfW + 14, baseY - 8);
    c.lineTo(cx + halfW, baseY + 4);
    c.lineTo(cx - halfW, baseY + 4);
    c.closePath();
    c.fill();
  }

  private static buildTiles(scale: number) {
    // ---------- FAR: mansion rooftops & walls ----------
    const far = document.createElement('canvas');
    far.width = Math.round(FAR_W * scale);
    far.height = Math.round(FAR_H * scale);
    const f = far.getContext('2d')!;
    f.scale(scale, scale);

    const ground = FAR_H; // tile bottom == horizon baseline
    f.fillStyle = '#121A33';
    // long compound wall
    f.fillRect(0, ground - 46, FAR_W, 46);
    // wall cap tiles
    f.fillStyle = '#0E1529';
    for (let x = 0; x < FAR_W; x += 12) f.fillRect(x, ground - 50, 10, 5);

    // main hall (big roof)
    f.fillStyle = '#121A33';
    f.fillRect(110, ground - 100, 190, 60);
    this.roof(f, 205, ground - 100, 118, 52);
    // second tier
    f.fillRect(150, ground - 150, 110, 30);
    this.roof(f, 205, ground - 150, 74, 34);
    // finial
    f.fillRect(203, ground - 192, 4, 12);

    // side pavilion
    f.fillRect(372, ground - 84, 70, 40);
    this.roof(f, 407, ground - 84, 52, 30);

    // warm lit windows & doors (glow of oil lamps)
    f.fillStyle = 'rgba(251, 191, 36, 0.85)';
    for (let i = 0; i < 4; i++) f.fillRect(132 + i * 42, ground - 80, 14, 22);
    f.fillStyle = 'rgba(251, 146, 60, 0.8)';
    f.fillRect(385, ground - 66, 10, 18);
    f.fillRect(417, ground - 66, 10, 18);
    // soft window glow
    f.fillStyle = 'rgba(251, 191, 36, 0.10)';
    f.fillRect(124, ground - 88, 170, 38);

    // ---------- NEAR: bamboo grove ----------
    const near = document.createElement('canvas');
    near.width = Math.round(NEAR_W * scale);
    near.height = Math.round(NEAR_H * scale);
    const n = near.getContext('2d')!;
    n.scale(scale, scale);

    n.fillStyle = '#080C18';
    n.strokeStyle = '#080C18';
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 52 + (rnd(i + 7) - 0.5) * 14;
      const top = 20 + rnd(i + 13) * 70;
      const w = 4 + rnd(i + 21) * 3;
      n.fillRect(x, top, w, NEAR_H - top);
      // bamboo nodes
      n.fillStyle = '#10172B';
      for (let y = top + 16; y < NEAR_H; y += 22) n.fillRect(x - 1, y, w + 2, 2);
      n.fillStyle = '#080C18';
      // leaf clusters
      for (let l = 0; l < 3; l++) {
        const ly = top + 6 + l * 22;
        const dir = l % 2 === 0 ? 1 : -1;
        n.beginPath();
        n.moveTo(x + w / 2, ly);
        n.quadraticCurveTo(x + w / 2 + dir * 20, ly - 10, x + w / 2 + dir * 34, ly + 4);
        n.quadraticCurveTo(x + w / 2 + dir * 18, ly + 2, x + w / 2, ly + 5);
        n.fill();
      }
    }
    // ground hedge
    n.fillRect(0, NEAR_H - 14, NEAR_W, 14);

    this.farTile = far;
    this.nearTile = near;
    this.tileScale = scale;
  }

  private static lanternGlow: CanvasGradient | null = null;

  /** Soft warm glow around a hanging lantern (cheap: one cached radial gradient). */
  public static drawLanternGlow(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number) {
    if (!this.lanternGlow) {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
      g.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
      g.addColorStop(0.5, 'rgba(239, 68, 68, 0.16)');
      g.addColorStop(1, 'rgba(239, 68, 68, 0)');
      this.lanternGlow = g;
    }
    ctx.translate(x, y);
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(timer * 3 + x * 0.05); // gentle flicker
    ctx.fillStyle = this.lanternGlow;
    ctx.fillRect(-38, -38, 76, 76);
    ctx.globalAlpha = 1;
    ctx.translate(-x, -y);
  }

  public static drawParallax(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
    timer: number,
    scale: number = 1
  ) {
    if (!this.farTile || this.tileScale !== scale) this.buildTiles(scale);

    // Night sky: deep indigo -> dusky violet near horizon
    ctx.fillStyle = getVerticalGradient(ctx, 'l3sky', 0, h, [
      [0, '#070B1F'],
      [0.45, '#141C3D'],
      [0.75, '#2A2B55'],
      [1, '#3B3560'],
    ]);
    ctx.fillRect(0, 0, w, h);

    // Stars (slow parallax, a third of them twinkle)
    ctx.fillStyle = '#FFFFFF';
    for (const st of STARS) {
      const sx = (((st.x - camX * 0.02) % w) + w) % w;
      ctx.globalAlpha = st.twinkle ? 0.35 + 0.65 * Math.abs(Math.sin(timer * 1.6 + st.phase)) : 0.7;
      ctx.fillRect(sx, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // Moon with halo
    const mx = w - 120;
    const my = 62;
    if (!this.moonGlow) {
      const g = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
      g.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      g.addColorStop(0.4, 'rgba(254, 240, 138, 0.10)');
      g.addColorStop(1, 'rgba(254, 240, 138, 0)');
      this.moonGlow = g;
    }
    ctx.fillStyle = this.moonGlow;
    ctx.fillRect(mx - 120, my - 120, 240, 240);
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(202, 138, 4, 0.18)'; // craters
    const craters: [number, number, number][] = [
      [mx - 8, my - 6, 6],
      [mx + 9, my + 8, 4.5],
      [mx + 6, my - 12, 3],
    ];
    for (const [cx, cy, r] of craters) {
      ctx.beginPath();
      ctx.moveTo(cx + r, cy); // avoids stray connecting lines between arcs
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const snap = (v: number) => Math.round(v * scale) / scale;
    const baseY = h - 40; // horizon line behind the courtyard floor

    // Far layer: mansion silhouettes (slow)
    const farOff = -((camX * 0.1) % FAR_W) - FAR_W;
    for (let x = farOff; x <= w; x += FAR_W) {
      ctx.drawImage(this.farTile!, snap(x), baseY - FAR_H, FAR_W, FAR_H);
    }

    // Low mist band between layers
    ctx.fillStyle = getVerticalGradient(ctx, 'l3mist', baseY - 70, baseY + 10, [
      [0, 'rgba(148, 163, 184, 0)'],
      [1, 'rgba(148, 163, 184, 0.16)'],
    ]);
    ctx.fillRect(0, baseY - 70, w, 80);

    // Near layer: bamboo grove (faster)
    const nearOff = -((camX * 0.22) % NEAR_W) - NEAR_W;
    for (let x = nearOff; x <= w; x += NEAR_W) {
      ctx.drawImage(this.nearTile!, snap(x), baseY - NEAR_H + 30, NEAR_W, NEAR_H);
    }
  }
}
