/**
 * Detailed 16-Bit Pixel Art Scenery Renderer for Màn 1: Cầu Sông Buông
 * Faithfully mirrors the reference pixel artwork:
 * - Bright tropical blue sky with layered pixel clouds & distant blue mountain ranges
 * - Distant riverside village with thatched huts, campfires with animated smoke
 * - Thatched-roof wooden stilt cottages (Nhà sàn mái lá tranh/dừa) with stilts & ladders
 * - Coconut palm trees (Cây dừa) and lush bamboo thickets (Bụi tre)
 * - Elevated wooden watchtower/diving platform with bamboo ladder
 * - Iconic bamboo suspension bridge (Cầu tre Sông Buông) with criss-cross pilings
 * - Sparkling river with animated glittering stars, lotus/lily pads & purple blossoms
 * - Traditional wooden sampans (Thuyền ba lá) with villagers wearing nón lá
 * - Wooden boat docks, fences, and grassy riverbank cliffs
 */

import { Platform, Collectible } from '../types/game';
import { getVerticalGradient } from './renderUtils';

export class Level1Scenery {
  // Sparkle positions for the river
  private static sparkles = [
    { x: 420, y: 535, phase: 0 },
    { x: 640, y: 550, phase: 1.2 },
    { x: 920, y: 528, phase: 2.4 },
    { x: 1050, y: 545, phase: 0.8 },
    { x: 1350, y: 532, phase: 3.1 },
    { x: 1520, y: 560, phase: 1.7 },
    { x: 1780, y: 538, phase: 2.9 },
    { x: 2150, y: 548, phase: 0.4 },
    { x: 2420, y: 532, phase: 2.1 },
    { x: 2680, y: 555, phase: 1.5 },
    { x: 2980, y: 540, phase: 3.4 },
  ];

  // Lotus pads in the river
  private static lotusPads = [
    { x: 380, y: 545, size: 24, hasFlower: true },
    { x: 430, y: 560, size: 18, hasFlower: false },
    { x: 890, y: 540, size: 22, hasFlower: true },
    { x: 940, y: 552, size: 16, hasFlower: false },
    { x: 1380, y: 548, size: 26, hasFlower: true },
    { x: 1440, y: 535, size: 18, hasFlower: true },
    { x: 1950, y: 550, size: 22, hasFlower: false },
    { x: 2010, y: 538, size: 20, hasFlower: true },
    { x: 2520, y: 546, size: 24, hasFlower: true },
    { x: 2580, y: 560, size: 17, hasFlower: false },
  ];

  // Sampan boats with villagers
  private static boats = [
    { x: 500, y: 540, speed: 0.25, dir: 1, villagerType: 'couple' },
    { x: 1250, y: 532, speed: -0.2, dir: -1, villagerType: 'solo' },
    { x: 2100, y: 542, speed: 0.18, dir: 1, villagerType: 'fisher' },
  ];

  /**
   * 1. Draw Parallax Sky, Clouds, Mountains, Distant River and Horizon Village
   */
  public static drawParallax(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    timer: number
  ) {
    // A. Sky Gradient: Bright Tropical Azure Sky matching image
    ctx.fillStyle = getVerticalGradient(ctx, 'l1sky', 0, viewH * 0.7, [
      [0, '#0284C7'], // Deep rich cyan-blue
      [0.35, '#38BDF8'], // Vibrant sky blue
      [0.65, '#7DD3FC'], // Soft light sky
      [1, '#BAE6FD'], // Warm horizon mist
    ]);
    ctx.fillRect(0, 0, viewW, viewH);

    // B. Fluffy Pixel Clouds with 3D cyan underside shading
    this.drawPixelClouds(ctx, viewW, camX, timer);

    // C. Distant Mountain Range (Far Layer - Dark Navy Blue / Indigo)
    this.drawFarMountains(ctx, viewW, viewH, camX);

    // D. Mid Mountain Range (Closer Layer - Medium Azure with Ridge Peaks)
    this.drawMidMountains(ctx, viewW, viewH, camX);

    // E. Distant Winding River & Village on Horizon
    this.drawDistantVillageAndRiver(ctx, viewW, viewH, camX, timer);
  }

  /**
   * Draw Fluffy 16-Bit Pixel Clouds
   */
  private static drawPixelClouds(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    camX: number,
    timer: number
  ) {
    const cloudBases = [
      { x: 80, y: 40, scale: 1.2, speed: 0.05 },
      { x: 380, y: 70, scale: 0.9, speed: 0.04 },
      { x: 680, y: 30, scale: 1.4, speed: 0.06 },
      { x: 1050, y: 65, scale: 1.1, speed: 0.05 },
      { x: 1400, y: 45, scale: 1.3, speed: 0.045 },
    ];

    const cycleW = 1600;

    for (const c of cloudBases) {
      const scrollX = ((c.x - camX * c.speed + timer * 8) % cycleW + cycleW) % cycleW - 150;
      if (scrollX > viewW + 100 || scrollX < -200) continue;

      ctx.save();
      ctx.translate(scrollX, c.y);
      ctx.scale(c.scale, c.scale);

      // Cloud shadow / bottom (cyan tint)
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(40, 36, 26, 0, Math.PI * 2);
      ctx.arc(75, 40, 22, 0, Math.PI * 2);
      ctx.arc(110, 36, 24, 0, Math.PI * 2);
      ctx.arc(140, 42, 18, 0, Math.PI * 2);
      ctx.rect(30, 32, 120, 16);
      ctx.fill();

      // Cloud main white body
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(40, 30, 24, 0, Math.PI * 2);
      ctx.arc(70, 20, 28, 0, Math.PI * 2);
      ctx.arc(105, 24, 26, 0, Math.PI * 2);
      ctx.arc(135, 34, 18, 0, Math.PI * 2);
      ctx.arc(20, 36, 14, 0, Math.PI * 2);
      ctx.rect(20, 26, 125, 14);
      ctx.fill();

      // Cloud pixel puffs on top for classic retro pixel contour
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(60, 6, 20, 8);
      ctx.fillRect(95, 10, 18, 6);

      ctx.restore();
    }
  }

  /**
   * Distant Mountain Layer (Far Indigo)
   */
  private static drawFarMountains(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number
  ) {
    const horizonY = viewH * 0.54;
    const scrollFactor = 0.08;
    const startX = -(camX * scrollFactor) % 400 - 400;

    ctx.fillStyle = '#1E3A8A'; // Deep mountain navy
    ctx.beginPath();
    ctx.moveTo(startX, horizonY);

    for (let x = startX; x <= viewW + 400; x += 180) {
      // Big mountain peaks matching the majestic mountains in the picture
      ctx.lineTo(x + 70, horizonY - 140);
      ctx.lineTo(x + 130, horizonY - 110);
      ctx.lineTo(x + 180, horizonY);
    }
    ctx.lineTo(viewW + 400, viewH);
    ctx.lineTo(startX, viewH);
    ctx.fill();

    // Mountain highlight facets (sunlight hitting the right slope)
    ctx.fillStyle = '#2563EB';
    for (let x = startX; x <= viewW + 400; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x + 70, horizonY - 140);
      ctx.lineTo(x + 130, horizonY - 110);
      ctx.lineTo(x + 180, horizonY);
      ctx.lineTo(x + 95, horizonY);
      ctx.fill();
    }
  }

  /**
   * Mid Mountain Layer (Closer Blue & Greenish Ridge)
   */
  private static drawMidMountains(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number
  ) {
    const horizonY = viewH * 0.58;
    const scrollFactor = 0.15;
    const startX = -(camX * scrollFactor) % 320 - 320;

    ctx.fillStyle = '#3B82F6'; // Mid-blue mountain
    ctx.beginPath();
    ctx.moveTo(startX, horizonY);

    for (let x = startX; x <= viewW + 320; x += 140) {
      ctx.lineTo(x + 50, horizonY - 80);
      ctx.lineTo(x + 100, horizonY - 60);
      ctx.lineTo(x + 140, horizonY);
    }
    ctx.lineTo(viewW + 320, viewH);
    ctx.lineTo(startX, viewH);
    ctx.fill();

    // Atmospheric haze at the foot of the mountains (depth)
    ctx.fillStyle = getVerticalGradient(ctx, 'l1haze', horizonY - 100, horizonY + 4, [
      [0, 'rgba(186, 230, 253, 0)'],
      [1, 'rgba(186, 230, 253, 0.5)'],
    ]);
    ctx.fillRect(0, horizonY - 100, viewW, 104);

    // Soft green misty foothills: vertical gradient instead of a flat slab,
    // fading into river-teal so the bank blends into the water.
    ctx.fillStyle = getVerticalGradient(ctx, 'l1hills', horizonY - 22, viewH, [
      [0, '#34D399'],
      [0.3, '#10B981'],
      [0.75, '#0D9488'],
      [1, '#0E7490'],
    ]);
    ctx.beginPath();
    ctx.moveTo(startX, horizonY);
    for (let x = startX; x <= viewW + 320; x += 80) {
      ctx.lineTo(x + 40, horizonY - 22);
      ctx.lineTo(x + 80, horizonY);
    }
    ctx.lineTo(viewW + 320, viewH);
    ctx.lineTo(startX, viewH);
    ctx.fill();
  }

  /**
   * Distant Village & River on Horizon
   */
  private static drawDistantVillageAndRiver(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    timer: number
  ) {
    const horizonY = viewH * 0.58;
    const scrollFactor = 0.22;
    const startX = -(camX * scrollFactor) % 600 - 600;

    // Distant river ribbon winding through the valley
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(startX, horizonY);
    for (let x = startX; x <= viewW + 600; x += 200) {
      ctx.quadraticCurveTo(x + 60, horizonY + 20, x + 120, horizonY + 8);
      ctx.quadraticCurveTo(x + 160, horizonY - 5, x + 200, horizonY);
    }
    ctx.lineTo(viewW + 600, horizonY + 30);
    ctx.lineTo(startX, horizonY + 30);
    ctx.fill();

    // Distant Thatched Huts & Campfire Smoke on the opposite riverbank
    for (let x = startX + 120; x <= viewW + 600; x += 360) {
      const hutX = x;
      const hutY = horizonY - 4;

      // Small thatched roof
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(hutX, hutY);
      ctx.lineTo(hutX + 16, hutY - 14);
      ctx.lineTo(hutX + 32, hutY);
      ctx.fill();

      // Wooden hut body
      ctx.fillStyle = '#78350F';
      ctx.fillRect(hutX + 4, hutY, 24, 14);
      // Hut door
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(hutX + 13, hutY + 4, 6, 10);

      // Campfire beside the hut
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(hutX + 42, hutY + 8, 4, 4);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(hutX + 43, hutY + 6, 2, 3);

      // Animated rising smoke particles curling up to sky
      for (let s = 0; s < 4; s++) {
        const smokeOffset = ((timer * 2 + s * 0.7) % 3);
        const smokeY = hutY + 4 - smokeOffset * 16;
        const smokeX = hutX + 44 + Math.sin(smokeOffset * 2) * 5;
        const smokeAlpha = Math.max(0, 0.6 - smokeOffset * 0.2);
        ctx.fillStyle = `rgba(226, 232, 240, ${smokeAlpha})`;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, 3 + smokeOffset * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant coconut palm beside the hut
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hutX - 10, hutY + 14);
      ctx.quadraticCurveTo(hutX - 14, hutY - 6, hutX - 8, hutY - 26);
      ctx.stroke();

      // Distant palm fronds
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(hutX - 8, hutY - 26, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 2. Draw Sông Buông River Water, Animated Wavelets, Sparkles, Lotus Pads & Sampan Boats
   */
  public static drawRiver(
    ctx: CanvasRenderingContext2D,
    levelW: number,
    levelH: number,
    timer: number,
    camX: number = 0,
    viewW: number = 960
  ) {
    const waterY = 495;
    const waterHeight = levelH - waterY;

    // Base River Water: Vibrant Turquoise Gradient (cached, built once)
    ctx.fillStyle = getVerticalGradient(ctx, 'l1water', waterY, levelH, [
      [0, '#0284C7'], // Deep azure cyan
      [0.35, '#0EA5E9'], // Brilliant turquoise
      [0.75, '#38BDF8'], // Shimmering light water
      [1, '#0284C7'],
    ]);
    ctx.fillRect(camX - 4, waterY, viewW + 8, waterHeight);

    // River Water Highlight Flow Waves (Horizontal flowing stripes)
    for (let y = waterY + 6; y < levelH; y += 14) {
      const rowOffset = (y * 11) % 100;
      const speed = 25 + (y - waterY) * 0.4;
      ctx.fillStyle = y % 28 === 0 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(125, 211, 252, 0.22)';

      // Only generate wavelets inside the visible window (grid stays aligned)
      const xFrom = -100 + Math.max(0, Math.floor((camX - 260 + 100) / 110)) * 110;
      const xTo = Math.min(levelW + 100, camX + viewW + 40);
      for (let x = xFrom; x < xTo; x += 110) {
        const waveX = x + ((timer * speed + rowOffset) % 110);
        const waveW = 45 + Math.sin(x * 0.02 + timer) * 15;
        const waveH = 2.5;
        ctx.fillRect(waveX, y, waveW, waveH);
      }
    }

    // River Star Sparkles (Twinkling glints `✦` on water surface like the photo!)
    for (const sp of this.sparkles) {
      if (sp.x < camX - 20 || sp.x > camX + viewW + 20) continue;
      const sparkleVal = Math.sin(timer * 4 + sp.phase);
      if (sparkleVal > 0.2) {
        const size = 3 + sparkleVal * 3;
        const alpha = Math.min(1, (sparkleVal - 0.2) * 1.3);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        // Center cross
        ctx.fillRect(sp.x - 1, sp.y - size, 2, size * 2);
        ctx.fillRect(sp.x - size, sp.y - 1, size * 2, 2);
        // Center glow
        ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
      }
    }

    // Floating Lotus / Water Lily Pads (Lá sen & Hoa súng)
    this.drawLotusPads(ctx, timer, camX, viewW);

    // Sampan Boats (Thuyền ba lá) drifting down Sông Buông
    this.drawSampanBoats(ctx, timer, camX, viewW);
  }

  /**
   * Floating Lotus Pads with Purple/Pink Blossoms
   */
  private static drawLotusPads(
    ctx: CanvasRenderingContext2D,
    timer: number,
    camX: number,
    viewW: number
  ) {
    for (const pad of this.lotusPads) {
      if (pad.x + pad.size < camX - 40 || pad.x - pad.size > camX + viewW + 40) continue;
      const bobY = pad.y + Math.sin(timer * 2.5 + pad.x * 0.05) * 2;

      // Dark shadow under pad
      ctx.fillStyle = 'rgba(2, 44, 34, 0.4)';
      ctx.beginPath();
      ctx.ellipse(pad.x, bobY + 3, pad.size, pad.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep green lily pad
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(pad.x, bobY, pad.size, pad.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner pad highlight & slit notch
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(pad.x - 1, bobY - 1, pad.size * 0.75, pad.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pad radial vein lines
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.x, bobY);
      ctx.lineTo(pad.x + pad.size * 0.7, bobY);
      ctx.moveTo(pad.x, bobY);
      ctx.lineTo(pad.x - pad.size * 0.6, bobY - 2);
      ctx.stroke();

      // Lotus / Water Lily Blossom on top (Hoa súng tím / sen hồng)
      if (pad.hasFlower) {
        const flowerX = pad.x + pad.size * 0.3;
        const flowerY = bobY - 4;

        // Outer petals (Purple/Pink)
        ctx.fillStyle = '#C084FC';
        ctx.beginPath();
        ctx.ellipse(flowerX - 4, flowerY, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(flowerX + 4, flowerY, 4, 6, 0.3, 0, Math.PI * 2);
        ctx.ellipse(flowerX, flowerY - 3, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner petal highlight (Bright pink)
        ctx.fillStyle = '#F472B6';
        ctx.beginPath();
        ctx.ellipse(flowerX, flowerY - 1, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden center stamen
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(flowerX - 1, flowerY - 2, 2, 2);
      }
    }
  }

  /**
   * Sampan Boats with Villagers in Conical Hats (Nón Lá)
   */
  private static drawSampanBoats(
    ctx: CanvasRenderingContext2D,
    timer: number,
    camX: number,
    viewW: number
  ) {
    for (const boat of this.boats) {
      const boatX = boat.x + Math.sin(timer * boat.speed) * 40;
      if (boatX + 140 < camX || boatX - 140 > camX + viewW) continue;
      const boatY = boat.y + Math.sin(timer * 2 + boat.x) * 2.5;

      ctx.save();
      ctx.translate(boatX, boatY);
      if (boat.dir === -1) {
        ctx.scale(-1, 1);
      }

      // Boat water shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(25, 14, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Boat Hull (Curved prow & stern)
      ctx.fillStyle = '#78350F'; // Dark rustic wood
      ctx.beginPath();
      ctx.moveTo(-10, 2);
      ctx.quadraticCurveTo(25, 16, 60, 2);
      ctx.lineTo(55, 6);
      ctx.quadraticCurveTo(25, 18, -5, 6);
      ctx.closePath();
      ctx.fill();

      // Boat inner hull plank
      ctx.fillStyle = '#B45309';
      ctx.fillRect(5, 4, 40, 4);

      // Wooden rowing oar (Mái chèo gỗ)
      const oarAngle = Math.sin(timer * 3) * 0.25;
      ctx.save();
      ctx.translate(35, 2);
      ctx.rotate(0.35 + oarAngle);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(-2, -15, 3, 26);
      ctx.fillRect(-4, 9, 7, 7); // Oar blade
      ctx.restore();

      // Villager / Boatman
      if (boat.villagerType === 'couple') {
        // Person 1 (Man rowing in rear)
        ctx.fillStyle = '#1D4ED8'; // Blue shirt
        ctx.fillRect(30, -8, 8, 12);
        // Head
        ctx.fillStyle = '#FED7AA';
        ctx.fillRect(32, -13, 5, 5);
        // Conical Hat (Nón Lá)
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(27, -12);
        ctx.lineTo(35, -20);
        ctx.lineTo(43, -12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Person 2 (Woman passenger in front)
        ctx.fillStyle = '#9333EA'; // Purple bà ba shirt
        ctx.fillRect(10, -6, 7, 10);
        // Head
        ctx.fillStyle = '#FED7AA';
        ctx.fillRect(11, -11, 5, 5);
        // Conical hat
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(6, -10);
        ctx.lineTo(14, -18);
        ctx.lineTo(22, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Solo fisherman with fishing rod or paddle
        ctx.fillStyle = '#065F46'; // Green shirt
        ctx.fillRect(22, -8, 8, 12);
        // Head
        ctx.fillStyle = '#FED7AA';
        ctx.fillRect(24, -13, 5, 5);
        // Nón lá
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(18, -12);
        ctx.lineTo(27, -21);
        ctx.lineTo(36, -12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * 3. Draw All Riverside Scenery:
   * - Thatched Stilt Houses (Nhà sàn)
   * - Coconut Palms (Cây dừa)
   * - Bamboo Thickets (Bụi tre)
   * - Elevated Watchtower Platform with Bamboo Ladder
   * - Iconic Bamboo Bridge (Cầu tre Sông Buông)
   * - Riverbank cliffs, grass tufts, wooden fences, and docks
   */
  public static drawEnvironment(
    ctx: CanvasRenderingContext2D,
    camX: number,
    timer: number
  ) {
    // Viewport culling: skip every prop that is entirely off-screen
    const vis = (x: number, w: number) => x + w + 140 >= camX && x - 140 <= camX + 960;

    // 1. Thatched Stilt Houses
    if (vis(80, 150)) this.drawThatchedStiltHouse(ctx, 80, 360, 150, 140, false);
    if (vis(250, 160)) this.drawThatchedStiltHouse(ctx, 250, 320, 160, 180, true);
    if (vis(1750, 150)) this.drawThatchedStiltHouse(ctx, 1750, 360, 150, 140, false);
    if (vis(3100, 160)) this.drawThatchedStiltHouse(ctx, 3100, 340, 160, 160, true);

    // 2. Coconut Palms (Cây Dừa Miền Tây)
    if (vis(30, 120)) this.drawCoconutPalm(ctx, 30, 240, 1.1, timer);
    if (vis(420, 120)) this.drawCoconutPalm(ctx, 420, 260, 0.95, timer + 1);
    if (vis(1060, 120)) this.drawCoconutPalm(ctx, 1060, 270, 1.0, timer + 2);
    if (vis(1920, 120)) this.drawCoconutPalm(ctx, 1920, 250, 1.05, timer + 0.5);
    if (vis(2700, 120)) this.drawCoconutPalm(ctx, 2700, 260, 0.9, timer + 1.8);
    if (vis(3320, 120)) this.drawCoconutPalm(ctx, 3320, 240, 1.15, timer + 2.5);

    // 3. Bamboo Thickets (Bụi Tre Xanh)
    if (vis(-20, 70)) this.drawBambooGrove(ctx, -20, 380, 70, 120);
    if (vis(470, 60)) this.drawBambooGrove(ctx, 470, 390, 60, 110);
    if (vis(1400, 50)) this.drawBambooGrove(ctx, 1400, 380, 50, 120);
    if (vis(2620, 60)) this.drawBambooGrove(ctx, 2620, 390, 60, 110);

    // 4. Wooden Fences
    if (vis(400, 140)) this.drawWoodenFence(ctx, 400, 470, 140);
    if (vis(1080, 110)) this.drawWoodenFence(ctx, 1080, 460, 110);
    if (vis(2040, 120)) this.drawWoodenFence(ctx, 2040, 460, 120);

    // 5. Wooden Boat Docks
    if (vis(520, 70)) this.drawBoatDock(ctx, 520, 485, 70);
    if (vis(2180, 75)) this.drawBoatDock(ctx, 2180, 485, 75);

    // 6. Center Watchtower / Diving Board Platform
    if (vis(680, 130)) this.drawWatchtowerPlatform(ctx, 680, 400, 130, 100);

    // 7. Iconic Bamboo Suspension Bridge (Cầu tre Sông Buông)
    if (vis(1460, 660)) this.drawBambooSuspensionBridge(ctx, 1460, 420, 660, timer);
  }

  /**
   * Vietnamese Thatched Stilt House (Nhà sàn mái lá tranh / lá dừa)
   */
  private static drawThatchedStiltHouse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isElevated: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    const roofH = h * 0.48;
    const bodyW = w * 0.82;
    const bodyH = h * 0.44;
    const bodyX = (w - bodyW) / 2;
    const bodyY = roofH - 8;
    const stiltH = h - bodyY - bodyH;

    // A. Sturdy Wooden Stilts / Pilings
    ctx.fillStyle = '#451A03';
    ctx.fillRect(bodyX + 8, bodyY + bodyH, 8, stiltH);
    ctx.fillRect(bodyX + bodyW - 16, bodyY + bodyH, 8, stiltH);
    ctx.fillRect(bodyX + bodyW / 2 - 4, bodyY + bodyH, 8, stiltH);

    // Stilt cross-beams
    ctx.fillStyle = '#78350F';
    ctx.fillRect(bodyX + 4, bodyY + bodyH + stiltH * 0.4, bodyW - 8, 5);

    // Wooden stairs / ladder
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW + 4, bodyY + bodyH);
    ctx.lineTo(bodyX + bodyW + 24, bodyY + h);
    ctx.moveTo(bodyX + bodyW + 16, bodyY + bodyH);
    ctx.lineTo(bodyX + bodyW + 36, bodyY + h);
    ctx.stroke();

    for (let s = 0; s < 5; s++) {
      const stepY = bodyY + bodyH + s * (stiltH / 4.5);
      const stepX = bodyX + bodyW + 10 + s * 4.5;
      ctx.fillStyle = '#B45309';
      ctx.fillRect(stepX, stepY, 14, 3);
    }

    // B. Wooden Plank / Bamboo Weave House Walls
    ctx.fillStyle = '#78350F';
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    // Horizontal wooden timber planks
    ctx.fillStyle = '#92400E';
    for (let py = bodyY + 6; py < bodyY + bodyH; py += 10) {
      ctx.fillRect(bodyX, py, bodyW, 2);
    }

    // Timber frame corner pillars
    ctx.fillStyle = '#5A2E0E';
    ctx.fillRect(bodyX, bodyY, 6, bodyH);
    ctx.fillRect(bodyX + bodyW - 6, bodyY, 6, bodyH);

    // Open Doorway
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(bodyX + bodyW * 0.55, bodyY + 10, bodyW * 0.32, bodyH - 10);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2;
    ctx.strokeRect(bodyX + bodyW * 0.55, bodyY + 10, bodyW * 0.32, bodyH - 10);

    // Window with propped open wooden shutter
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(bodyX + 12, bodyY + 10, 24, 20);
    // Window shutter propped up
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(bodyX + 10, bodyY + 10);
    ctx.lineTo(bodyX + 38, bodyY + 6);
    ctx.lineTo(bodyX + 38, bodyY + 10);
    ctx.lineTo(bodyX + 10, bodyY + 14);
    ctx.fill();

    // C. Traditional Layered Thatched Straw Roof (Mái lá dừa / tranh dầy)
    // Darker under-roof shadow
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(-6, roofH);
    ctx.lineTo(w / 2, 2);
    ctx.lineTo(w + 6, roofH);
    ctx.closePath();
    ctx.fill();

    // Main golden thatch
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(-4, roofH - 4);
    ctx.lineTo(w / 2, 6);
    ctx.lineTo(w + 4, roofH - 4);
    ctx.closePath();
    ctx.fill();

    // Thatch ridges & straw fringe overhang
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(2, roofH - 12);
    ctx.lineTo(w / 2, 12);
    ctx.lineTo(w - 2, roofH - 12);
    ctx.closePath();
    ctx.fill();

    // Ragged thatched straw fringes at eaves
    ctx.fillStyle = '#FEF08A';
    for (let fx = -6; fx < w + 6; fx += 6) {
      const fringeLen = 4 + (Math.abs(fx * 7) % 6);
      ctx.fillRect(fx, roofH - 4, 4, fringeLen);
    }

    ctx.restore();
  }

  /**
   * Coconut Palm Tree (Cây dừa miền Tây)
   */
  private static drawCoconutPalm(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    timer: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const trunkH = 140;
    const sway = Math.sin(timer * 1.5) * 6;

    // Curved palm trunk
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, trunkH);
    ctx.quadraticCurveTo(-15, trunkH * 0.5, sway, 0);
    ctx.stroke();

    // Trunk ring texture
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    for (let i = 20; i < trunkH; i += 16) {
      const t = i / trunkH;
      const px = -15 * Math.sin(t * Math.PI) + sway * (1 - t);
      ctx.beginPath();
      ctx.moveTo(px - 6, i);
      ctx.lineTo(px + 6, i - 2);
      ctx.stroke();
    }

    // Coconut bunch under fronds
    ctx.fillStyle = '#854D0E';
    ctx.beginPath();
    ctx.arc(sway - 4, 4, 7, 0, Math.PI * 2);
    ctx.arc(sway + 5, 5, 8, 0, Math.PI * 2);
    ctx.arc(sway, 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A16207';
    ctx.fillRect(sway - 5, 3, 3, 3);
    ctx.fillRect(sway + 4, 4, 3, 3);

    // Cascading Palm Fronds (Cánh lá dừa xanh biếc)
    const fronds = [
      { angle: -2.3, len: 75 },
      { angle: -1.7, len: 85 },
      { angle: -1.0, len: 90 },
      { angle: -0.4, len: 80 },
      { angle: 0.3, len: 85 },
      { angle: 0.9, len: 90 },
      { angle: 1.6, len: 85 },
      { angle: 2.2, len: 75 },
    ];

    for (const f of fronds) {
      const frondSway = Math.sin(timer * 2 + f.angle) * 0.08;
      ctx.save();
      ctx.translate(sway, 0);
      ctx.rotate(f.angle + frondSway);

      // Deep green frond backbone
      ctx.strokeStyle = '#14532D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(f.len * 0.5, -12, f.len, 10);
      ctx.stroke();

      // Lush green leaflets fanning out
      ctx.fillStyle = '#15803D';
      for (let d = 10; d < f.len; d += 8) {
        const leafletLen = Math.sin((d / f.len) * Math.PI) * 16;
        ctx.fillRect(d, -leafletLen * 0.5, 4, leafletLen);
      }
      ctx.fillStyle = '#22C55E';
      for (let d = 14; d < f.len - 10; d += 12) {
        const leafletLen = Math.sin((d / f.len) * Math.PI) * 12;
        ctx.fillRect(d, -leafletLen * 0.4, 2, leafletLen * 0.8);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Bamboo Grove (Bụi tre xanh ngà)
   */
  private static drawBambooGrove(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    const stalks = [
      { x: 5, slant: -0.05, h: h },
      { x: 18, slant: 0.02, h: h * 1.1 },
      { x: 30, slant: -0.02, h: h * 0.95 },
      { x: 44, slant: 0.04, h: h * 1.05 },
      { x: 56, slant: -0.03, h: h * 0.9 },
    ];

    for (const stk of stalks) {
      // Bamboo stalk
      ctx.fillStyle = '#65A30D';
      ctx.fillRect(stk.x, 0, 7, stk.h);

      // Segmented nodes
      ctx.fillStyle = '#CA8A04';
      for (let ny = 15; ny < stk.h; ny += 22) {
        ctx.fillRect(stk.x - 1, ny, 9, 3);
      }

      // Bamboo leaves
      ctx.fillStyle = '#15803D';
      for (let ly = 10; ly < stk.h * 0.7; ly += 28) {
        ctx.beginPath();
        ctx.ellipse(stk.x - 8, ly, 10, 3, -0.4, 0, Math.PI * 2);
        ctx.ellipse(stk.x + 14, ly + 6, 10, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Wooden Fence (Hàng rào tre/gỗ)
   */
  private static drawWoodenFence(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Horizontal rails
    ctx.fillStyle = '#B45309';
    ctx.fillRect(0, 10, len, 4);
    ctx.fillRect(0, 22, len, 4);

    // Vertical pointed posts
    ctx.fillStyle = '#78350F';
    for (let px = 0; px <= len; px += 22) {
      ctx.beginPath();
      ctx.moveTo(px, 32);
      ctx.lineTo(px, 4);
      ctx.lineTo(px + 3, 0);
      ctx.lineTo(px + 6, 4);
      ctx.lineTo(px + 6, 32);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Wooden Boat Dock (Bến đò gỗ vươn ra sông)
   */
  private static drawBoatDock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Pilings in water
    ctx.fillStyle = '#451A03';
    ctx.fillRect(10, 8, 8, 45);
    ctx.fillRect(w - 18, 8, 8, 45);

    // Dock walkway planks
    ctx.fillStyle = '#92400E';
    ctx.fillRect(0, 0, w, 8);
    ctx.fillStyle = '#B45309';
    for (let px = 4; px < w; px += 8) {
      ctx.fillRect(px, 0, 6, 8);
    }

    // Mooring bollard with rope
    ctx.fillStyle = '#5A2E0E';
    ctx.fillRect(w - 12, -8, 6, 12);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(w - 14, -4, 10, 2);

    ctx.restore();
  }

  /**
   * Elevated Watchtower / Diving Board Platform with Bamboo Ladder
   * (Matches the central platform in the reference image!)
   */
  private static drawWatchtowerPlatform(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Sturdy diagonal wooden bracing struts
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, h);
    ctx.lineTo(w - 10, 8);
    ctx.stroke();

    // Main support pillars
    ctx.fillStyle = '#451A03';
    ctx.fillRect(10, 8, 10, h - 8);
    ctx.fillRect(40, 8, 10, h - 8);

    // 2. Vertical Bamboo Ladder (Thang tre leo lên)
    ctx.fillStyle = '#CA8A04';
    ctx.fillRect(20, 8, 4, h - 8);
    ctx.fillRect(34, 8, 4, h - 8);

    // Bamboo ladder rungs
    ctx.fillStyle = '#EAB308';
    for (let ly = 18; ly < h; ly += 14) {
      ctx.fillRect(18, ly, 20, 3);
    }

    // 3. Green-painted wooden deck platform (Matching the picture!)
    ctx.fillStyle = '#15803D'; // Rich green deck top
    ctx.fillRect(0, 0, w, 10);
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(0, 0, w, 3);

    // Wooden deck rim
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, 10, w, 4);

    ctx.restore();
  }

  /**
   * Iconic Bamboo Suspension Bridge (Cầu tre Sông Buông)
   * Spanning across the river with crossed V-pilings, bamboo logs & rope handrails
   */
  private static drawBambooSuspensionBridge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    timer: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // A. Crossed V-shaped bamboo piling supports standing in the river
    for (let px = 60; px < w - 40; px += 140) {
      // Left leg
      ctx.strokeStyle = '#A16207';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(px, 16);
      ctx.lineTo(px - 22, 110);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(px, 16);
      ctx.lineTo(px + 22, 110);
      ctx.stroke();

      // Bamboo node rings
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(px - 14, 55, 8, 2);
      ctx.fillRect(px + 8, 55, 8, 2);

      // Vertical handrail support post
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(px, 16);
      ctx.lineTo(px, -30);
      ctx.stroke();
    }

    // B. Bamboo Rope Handrails (Guide rails on both sides)
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    for (let px = 0; px <= w; px += 40) {
      const sag = Math.sin((px / w) * Math.PI) * 12;
      ctx.lineTo(px, -20 + sag);
    }
    ctx.stroke();

    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    for (let px = 0; px <= w; px += 40) {
      const sag = Math.sin((px / w) * Math.PI) * 10;
      ctx.lineTo(px, -10 + sag);
    }
    ctx.stroke();

    // C. Bamboo Log Footway (Từng thân tre ghép lại thành mặt cầu)
    ctx.fillStyle = '#CA8A04';
    ctx.fillRect(0, 0, w, 14);

    // Individual bamboo log slats
    ctx.fillStyle = '#EAB308';
    for (let bx = 0; bx < w; bx += 8) {
      ctx.fillRect(bx, 0, 6, 14);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bx + 6, 0, 2, 14);
      ctx.fillStyle = '#EAB308';
    }

    ctx.restore();
  }

  /**
   * 4. Draw Mario-Style Gold Coin Matching Reference Photo
   */
  public static drawGoldCoin(
    ctx: CanvasRenderingContext2D,
    c: Collectible,
    timer: number
  ) {
    const bobY = c.y + Math.sin(c.bobOffset + timer * 4) * 4;
    const cx = c.x + c.width / 2;
    const cy = bobY + c.height / 2;

    // Coin spin width oscillation
    const spin = Math.cos(timer * 5 + c.bobOffset);
    const coinW = Math.max(3, Math.abs(spin) * 12);

    ctx.save();
    ctx.translate(cx, cy);

    // Golden drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 16, coinW, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer Dark Gold Rim
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, coinW, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant Yellow Gold Face
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, coinW - 2), 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Embossed Slot / Symbol (Classic Mario Coin look!)
    if (coinW > 6) {
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(-coinW * 0.3, -5, coinW * 0.6, 10);
      ctx.fillStyle = '#CA8A04';
      ctx.fillRect(-coinW * 0.15, -4, coinW * 0.3, 8);
    }

    // Shinning Sparkle Pixel
    if (spin > 0.4) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-coinW * 0.4, -6, 2.5, 2.5);
      ctx.fillRect(coinW * 0.2, 3, 1.5, 1.5);
    }

    ctx.restore();
  }

  /**
   * 5. Draw Tân Triều Pomelo Healing Fruit (Bưởi Tân Triều)
   */
  public static drawPomelo(
    ctx: CanvasRenderingContext2D,
    c: Collectible,
    timer: number
  ) {
    const bobY = c.y + Math.sin(c.bobOffset + timer * 3) * 3;
    const cx = c.x + c.width / 2;
    const cy = bobY + c.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Pomelo shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plump green pomelo body
    ctx.fillStyle = '#65A30D';
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, Math.PI * 2);
    ctx.fill();

    // Light green highlight
    ctx.fillStyle = '#84CC16';
    ctx.beginPath();
    ctx.arc(-3, -1, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wooden stem
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-1.5, -14, 3, 6);

    // Glossy green pomelo leaf
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(5, -12, 7, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
