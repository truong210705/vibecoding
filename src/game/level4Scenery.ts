/**
 * Level 4 Scenery: Đại Lộ Sài Gòn & Cầu Đêm Trận Chiến Bá Hộ Long
 * Uses user's high-fidelity pixel art map: level4_saigon_night_map_1792349469369.jpg
 * - Iconic Saigon Night skyline (Landmark 81, Bitexco, Bến Nhà Rồng, glowing moon, river reflections)
 * - Elevated Highway Bridge with red & white hazard barriers, traffic cones, and night street stalls
 * - Crashed luxury motorbike stuck by the bridge guardrail
 * - Sweet Trúc resting safely on the roadside sidewalk
 * - 3D rolling dice & spinning $100 dollar bills / money stack projectiles
 */

import { BossAttack } from '../types/game';
import { getVerticalGradient } from './renderUtils';
import saigonNightMapSrc from '../assets/images/level4_saigon_night_map_1792349469369.jpg';

// Preload the Saigon Night Map Image
const saigonMapImage = new Image();
saigonMapImage.src = saigonNightMapSrc;

export class Level4Scenery {
  /**
   * Draw Level 4 Parallax Background using the user's Saigon Night Map image
   */
  // Background image pre-scaled ONCE to the on-screen resolution
  // (previously a 1376x768 JPG was re-scaled by the GPU/CPU every single frame).
  private static bgLayer: HTMLCanvasElement | null = null;
  private static bgLayerScale = 0;

  // Logical overlap (px) used to cross-fade the tile's right edge into its left edge
  private static readonly BG_BLEND = 140;

  private static getBackgroundLayer(imgW: number, imgH: number, scale: number) {
    if (this.bgLayer && this.bgLayerScale === scale) return this.bgLayer;

    const fullW = Math.max(2, Math.round(imgW * scale));
    const blendPx = Math.round(this.BG_BLEND * scale);
    const tileW = fullW - blendPx;
    const h = Math.max(1, Math.round(imgH * scale));

    // 1) scaled full image
    const full = document.createElement('canvas');
    full.width = fullW;
    full.height = h;
    const f = full.getContext('2d', { alpha: false })!;
    f.imageSmoothingEnabled = true;
    f.imageSmoothingQuality = 'high';
    f.drawImage(saigonMapImage, 0, 0, fullW, h);

    // 2) cyclic tile: the tail of the image fades out over the head -> wraps seamlessly
    const layer = document.createElement('canvas');
    layer.width = tileW;
    layer.height = h;
    const c = layer.getContext('2d', { alpha: false })!;
    c.drawImage(full, 0, 0, tileW, h, 0, 0, tileW, h);

    const tail = document.createElement('canvas');
    tail.width = blendPx;
    tail.height = h;
    const t = tail.getContext('2d')!;
    t.drawImage(full, tileW, 0, blendPx, h, 0, 0, blendPx, h);
    t.globalCompositeOperation = 'destination-in';
    const g = t.createLinearGradient(0, 0, blendPx, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    t.fillStyle = g;
    t.fillRect(0, 0, blendPx, h);
    c.drawImage(tail, 0, 0);

    this.bgLayer = layer;
    this.bgLayerScale = scale;
    return layer;
  }

  public static drawParallaxBackground(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    timer: number,
    renderScale: number = 1
  ) {
    const canvasW = 960;
    const canvasH = 540;

    if (saigonMapImage.complete && saigonMapImage.naturalWidth > 0) {
      // Scale image to fill viewport height (540)
      const imgAspect = saigonMapImage.naturalWidth / saigonMapImage.naturalHeight;
      const imgW = canvasH * imgAspect;
      const bg = this.getBackgroundLayer(imgW, canvasH, renderScale);

      // Parallax scroll with camera motion (tile is cyclic: no visible seam, no mirrored text)
      const tileLogicalW = imgW - this.BG_BLEND;
      const bgOffset = (cameraX * 0.45) % tileLogicalW;
      for (let x = -bgOffset; x < canvasW; x += tileLogicalW) {
        const dx = Math.round(x * renderScale) / renderScale;
        ctx.drawImage(bg, dx, 0, tileLogicalW + 1, canvasH);
      }

      // Add gentle animated nocturnal atmosphere over the map
      ctx.save();

      // 1. Shimmering neon and moon glow
      const moonGlow = Math.sin(timer * 2) * 0.08 + 0.12;
      ctx.fillStyle = `rgba(254, 240, 138, ${moonGlow})`;
      ctx.beginPath();
      ctx.arc(620 - (cameraX * 0.1) % 960, 65, 36, 0, Math.PI * 2);
      ctx.fill();

      // 2. Blinking red aviation hazard lights atop Landmark 81 & Bitexco
      const blink = Math.sin(timer * 6) > 0 ? 1 : 0.2;
      ctx.fillStyle = `rgba(239, 68, 68, ${blink})`;
      const tower1X = 285 - (cameraX * 0.2) % 960;
      ctx.fillRect(tower1X, 42, 3, 3);
      const tower2X = 422 - (cameraX * 0.2) % 960;
      ctx.fillRect(tower2X, 90, 3, 3);

      // 3. Twinkling night stars
      ctx.fillStyle = '#FFFFFF';
      for (let s = 0; s < 12; s++) {
        const starX = ((s * 79 + timer * 5) % canvasW);
        const starY = (s * 23) % 140 + 10;
        const starAlpha = Math.abs(Math.sin(timer * 3 + s)) * 0.8;
        ctx.globalAlpha = starAlpha;
        ctx.fillRect(starX, starY, 2, 2);
      }

      ctx.restore();
    } else {
      // Fallback elegant Saigon night gradient while image loads
      ctx.fillStyle = getVerticalGradient(ctx, 'l4sky', 0, 540, [
        [0, '#090D16'],
        [0.5, '#0F172A'],
        [1, '#1E293B'],
      ]);
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Moon
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(620, 65, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw the fallen motorbike stuck by the highway guardrail
   */
  public static drawCrashedMotorbike(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number) {
    ctx.save();
    ctx.translate(x, y);

    // Concrete road curb & reflective warning stripes
    ctx.fillStyle = '#334155';
    ctx.fillRect(-20, 20, 100, 16);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-15, 20, 14, 16);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-1, 20, 14, 16);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(13, 20, 14, 16);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(27, 20, 14, 16);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(41, 20, 14, 16);

    // Orange traffic safety cone
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(60, 20);
    ctx.lineTo(68, -4);
    ctx.lineTo(76, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(63, 6, 10, 4);

    // Fallen motorbike tilted on bridge road
    ctx.save();
    ctx.translate(20, 12);
    ctx.rotate(0.55);

    // Wheels
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-22, 10, 13, 0, Math.PI * 2);
    ctx.arc(32, 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chrome Spokes
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(-22, 10, 5, 0, Math.PI * 2);
    ctx.arc(32, 10, 5, 0, Math.PI * 2);
    ctx.fill();

    // Glossy Black & Gold Scooter Chassis
    ctx.fillStyle = '#18181B';
    ctx.fillRect(-18, -10, 46, 16);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-14, -14, 32, 6);

    // Headlight glowing amber
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(30, -12, 8, 8);

    // Handlebars
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, -14);
    ctx.lineTo(28, -25);
    ctx.stroke();

    ctx.restore();

    // Rising Smoke and Sparks from broken engine
    const smokeOffset = (timer * 35) % 40;
    for (let s = 0; s < 3; s++) {
      const sx = 20 + Math.sin(timer * 3 + s) * 12;
      const sy = 0 - (smokeOffset + s * 14);
      const alpha = Math.max(0, 0.7 - (smokeOffset + s * 14) / 45);
      ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 7 + s * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw Trúc lying safely on the highway sidewalk
   */
  public static drawInjuredTruc(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timer: number,
    isReunited = false
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Clean highway pedestrian sidewalk
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(24, 20, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isReunited) {
      // Reunited / Standing up smiling with Phước
      ctx.fillStyle = '#EC4899'; // Sweet pink áo dài
      ctx.fillRect(10, -32, 22, 44);
      // Head
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(21, -40, 11, 0, Math.PI * 2);
      ctx.fill();
      // Silky long black hair
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(19, -42, 12, Math.PI * 0.7, Math.PI * 2.1);
      ctx.fill();
      ctx.fillRect(10, -40, 6, 26);
    } else {
      // Lying resting on side safely
      const breathe = Math.sin(timer * 2.5) * 1.5;

      // Soft pink silk Áo Dài dress
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.ellipse(22, 10 + breathe, 24, 8, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // White silk pants
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(34, 11, 18, 6);

      // Delicate face & long hair
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(6, 6 + breathe, 8, 0, Math.PI * 2);
      ctx.fill();

      // Flowing black hair
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.ellipse(2, 6 + breathe, 9, 8, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Pink hair clip
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(6, 0 + breathe, 4, 4);

      // Gentle speech bubble "Anh Phước ơi... cẩn thận!"
      const bubbleAlpha = 0.85 + Math.sin(timer * 2) * 0.15;
      ctx.save();
      ctx.globalAlpha = bubbleAlpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-20, -32 + breathe, 120, 22, [8]);
      ctx.fill();
      ctx.strokeStyle = '#F472B6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(10, -10 + breathe);
      ctx.lineTo(16, -4 + breathe);
      ctx.lineTo(20, -10 + breathe);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#9D174D';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Anh Phước... cẩn thận!', -12, -18 + breathe);

      // Tiny heart floating up
      const heartY = -40 - ((timer * 20) % 25);
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(84, heartY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw 3D Rolling Dice projectile thrown by Bá Hộ Long
   */
  public static drawDice(ctx: CanvasRenderingContext2D, attack: BossAttack) {
    ctx.save();
    ctx.translate(attack.x + attack.width / 2, attack.y + attack.height / 2);
    ctx.rotate(attack.rotation || 0);

    const size = attack.width || 24;
    const half = size / 2;

    // Glowing Aura around dice
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, half + 6, 0, Math.PI * 2);
    ctx.fill();

    // Outer Border / Shadow
    ctx.fillStyle = '#991B1B'; // Deep ruby outline
    ctx.beginPath();
    ctx.roundRect(-half - 2, -half - 2, size + 4, size + 4, [5]);
    ctx.fill();

    // Dice Main Face (Ivory White)
    ctx.fillStyle = '#FEF2F2';
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, [4]);
    ctx.fill();

    // Top & Left Highlight bevel
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-half + 1, -half + 1, size - 2, 3);
    ctx.fillRect(-half + 1, -half + 1, 3, size - 2);

    // Bottom & Right Shadow bevel
    ctx.fillStyle = '#FCA5A5';
    ctx.fillRect(-half + 1, half - 3, size - 2, 2);
    ctx.fillRect(half - 3, -half + 1, 2, size - 2);

    // Numbered Pips (1 to 6 red/dark pips)
    const pips = attack.pipNumber || 4;
    ctx.fillStyle = pips === 1 ? '#DC2626' : '#991B1B';
    const r = pips === 1 ? 4.5 : 2.5;

    const drawDot = (dx: number, dy: number) => {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (pips === 1) {
      drawDot(0, 0);
    } else if (pips === 2) {
      drawDot(-half + 6, -half + 6);
      drawDot(half - 6, half - 6);
    } else if (pips === 3) {
      drawDot(-half + 6, -half + 6);
      drawDot(0, 0);
      drawDot(half - 6, half - 6);
    } else if (pips === 4) {
      drawDot(-half + 6, -half + 6);
      drawDot(half - 6, -half + 6);
      drawDot(-half + 6, half - 6);
      drawDot(half - 6, half - 6);
    } else if (pips === 5) {
      drawDot(-half + 6, -half + 6);
      drawDot(half - 6, -half + 6);
      drawDot(0, 0);
      drawDot(-half + 6, half - 6);
      drawDot(half - 6, half - 6);
    } else {
      drawDot(-half + 6, -half + 6);
      drawDot(half - 6, -half + 6);
      drawDot(-half + 6, 0);
      drawDot(half - 6, 0);
      drawDot(-half + 6, half - 6);
      drawDot(half - 6, half - 6);
    }

    ctx.restore();
  }

  /**
   * Draw Spinning $100 Dollar Bill projectile thrown by Bá Hộ Long
   */
  public static drawDollarBill(ctx: CanvasRenderingContext2D, attack: BossAttack) {
    ctx.save();
    ctx.translate(attack.x + attack.width / 2, attack.y + attack.height / 2);
    ctx.rotate(attack.rotation || 0);

    const w = attack.width || 28;
    const h = attack.height || 14;

    // Soft green cash aura
    ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, [4]);
    ctx.fill();

    // Dark emerald border
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);

    // Bill body (crisp light US Dollar green)
    ctx.fillStyle = '#DCFCE7';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Inner green frame
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);

    // Center Oval Portrait (Franklin oval)
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 100 number on corners
    ctx.fillStyle = '#14532D';
    ctx.font = '900 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('100', -w / 2 + 6, -h / 2 + 6);
    ctx.fillText('100', w / 2 - 6, h / 2 - 2);

    ctx.restore();
  }

  /**
   * Draw Thick Tied Money Stack projectile thrown by Bá Hộ Long
   */
  public static drawMoneyStack(ctx: CanvasRenderingContext2D, attack: BossAttack) {
    ctx.save();
    ctx.translate(attack.x + attack.width / 2, attack.y + attack.height / 2);
    ctx.rotate(attack.rotation || 0);

    const w = attack.width || 32;
    const h = attack.height || 18;

    // Golden money aura
    ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, [5]);
    ctx.fill();

    // Stack bottom shadow
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w - 2, h);

    // Stack bill layers
    ctx.fillStyle = '#BBF7D0';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Stack stripes (bill edges)
    ctx.fillStyle = '#86EFAC';
    for (let y = -h / 2 + 2; y < h / 2; y += 3) {
      ctx.fillRect(-w / 2, y, w, 1);
    }

    // Golden Paper Currency Band wrapped around middle
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-5, -h / 2, 10, h);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-3, -h / 2 + 2, 6, h - 4);

    // Dollar sign on the band
    ctx.fillStyle = '#78350F';
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 3);

    ctx.restore();
  }
}
