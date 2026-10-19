/**
 * Detailed 16-Bit Pixel Art Scenery Renderer for Màn 2: Phố Huyện & Trạm CSGT
 * Faithfully mirrors the reference pixel artwork:
 * - Bright blue sky with fluffy cumulus clouds & flying swallows
 * - Multi-story Vietnamese townhouses with lush bougainvillea & balcony Vietnamese flag
 * - Tangled telephone poles with black power lines, transformer & perched birds
 * - Red street banner "VIỆT NAM VÔ ĐỊCH" and street sign "ĐƯỜNG LÊ LỢI"
 * - Quán "PHỞ BÒ" with blue striped awning, wooden sign, plastic red stools & cat
 * - Cửa hàng "TẠP HÓA" with signs "NƯỚC GIẢI KHÁT", "BÁNH MÌ", parked blue scooter & puppy on tin roof
 * - Concrete highway overpass with passing classic blue bus
 * - Police station "CSGT" with traffic light, red/white barriers, traffic cones & STOP sign
 * - Scaffolding pipe platforms with vines, wooden crates & red oil drums
 * - Asphalt roadway with concrete curb & lane markings
 */

import { Collectible } from '../types/game';
import { getVerticalGradient } from './renderUtils';

export class Level2Scenery {
  /**
   * 1. Draw Parallax Background for Map 2:
   * Sky, clouds, distant town buildings, overpass highway with blue bus, power lines
   */
  public static drawParallax(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    timer: number,
    renderScale: number = 1
  ) {
    // A. Sky Gradient: Bright Urban Blue Sky matching image
    ctx.fillStyle = getVerticalGradient(ctx, 'l2sky', 0, viewH * 0.7, [
      [0, '#3B82F6'], // Vibrant bright blue
      [0.4, '#60A5FA'], // Sky blue
      [0.75, '#93C5FD'], // Soft light blue
      [1, '#BAE6FD'], // Warm horizon
    ]);
    ctx.fillRect(0, 0, viewW, viewH);

    // B. Fluffy Pixel Clouds
    this.drawTownClouds(ctx, viewW, camX, timer);

    // C. Distant City Skyline & Radio/Telecom Towers
    this.drawDistantTownSkyline(ctx, viewW, viewH, camX, renderScale);

    // D. Concrete Highway Overpass & Passing Blue Bus
    this.drawOverpassAndBus(ctx, viewW, viewH, camX, timer);

    // E. Distant Swallows / Birds in the Sky
    this.drawFlyingBirds(ctx, viewW, camX, timer);
  }

  /**
   * Fluffy Town Cumulus Clouds
   */
  private static drawTownClouds(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    camX: number,
    timer: number
  ) {
    const clouds = [
      { x: 100, y: 35, s: 1.3, speed: 0.04 },
      { x: 480, y: 55, s: 0.95, speed: 0.035 },
      { x: 860, y: 30, s: 1.4, speed: 0.05 },
      { x: 1300, y: 60, s: 1.1, speed: 0.04 },
      { x: 1750, y: 40, s: 1.25, speed: 0.045 },
    ];
    const cycleW = 2000;

    for (const c of clouds) {
      const scrollX = ((c.x - camX * c.speed + timer * 6) % cycleW + cycleW) % cycleW - 150;
      if (scrollX > viewW + 120 || scrollX < -180) continue;

      ctx.save();
      ctx.translate(scrollX, c.y);
      ctx.scale(c.s, c.s);

      // Cloud cyan-blue bottom shadow
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(40, 36, 26, 0, Math.PI * 2);
      ctx.arc(80, 40, 24, 0, Math.PI * 2);
      ctx.arc(120, 36, 26, 0, Math.PI * 2);
      ctx.rect(30, 32, 110, 16);
      ctx.fill();

      // Cloud pure white body
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(40, 30, 24, 0, Math.PI * 2);
      ctx.arc(75, 20, 28, 0, Math.PI * 2);
      ctx.arc(115, 24, 26, 0, Math.PI * 2);
      ctx.arc(145, 34, 18, 0, Math.PI * 2);
      ctx.rect(25, 26, 125, 16);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Distant Town Skyline & Communication Towers
   */
  // Skyline buildings are pre-rendered ONCE into a repeating 360px tile.
  // This replaces ~800 draw calls/frame with ~4 drawImage calls, and also fixes
  // flickering: building heights used to be derived from the fractional screen-x,
  // so they changed every frame while scrolling. Now each building has a stable height.
  private static skylineTile: HTMLCanvasElement | null = null;
  private static skylineTileKey = '';
  private static readonly TILE_W = 360;
  private static readonly TILE_TOP = 105;
  private static readonly TILE_H = 185;

  private static getSkylineTile(scale: number): HTMLCanvasElement {
    const key = String(scale);
    if (this.skylineTile && this.skylineTileKey === key) return this.skylineTile;

    const tile = document.createElement('canvas');
    tile.width = Math.round(this.TILE_W * scale);
    tile.height = Math.round(this.TILE_H * scale);
    const c = tile.getContext('2d')!;
    c.scale(scale, scale);

    const top = this.TILE_TOP; // y of the horizon inside the tile
    for (let i = 0; i < 4; i++) {
      const x = i * 90;
      const bH = 60 + ((i * 37) % 45);
      const bW = 65 + ((i * 53) % 25);
      c.fillStyle = '#93C5FD';
      c.fillRect(x, top - bH, bW, bH + 80);

      // Windows
      c.fillStyle = '#DBEAFE';
      for (let wx = x + 6; wx < x + bW - 6; wx += 12) {
        for (let wy = top - bH + 8; wy < top; wy += 14) {
          c.fillRect(wx, wy, 6, 8);
        }
      }
    }

    this.skylineTile = tile;
    this.skylineTileKey = key;
    return tile;
  }

  private static drawDistantTownSkyline(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    renderScale: number = 1
  ) {
    const horizonY = viewH * 0.58;
    const scrollFactor = 0.12;
    const tile = this.getSkylineTile(renderScale);
    const tileW = this.TILE_W;

    // Distant buildings: repeat the pre-rendered tile across the viewport
    const off = -((camX * scrollFactor) % tileW) - tileW;
    for (let x = off; x <= viewW; x += tileW) {
      const sx = Math.round(x * renderScale) / renderScale; // snap -> no tile seams
      ctx.drawImage(tile, sx, horizonY - this.TILE_TOP, tileW, this.TILE_H);
    }

    // Radio / Communication Antenna Towers (few, cheap)
    const startX = -((camX * scrollFactor) % 340) - 340;
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    for (let x = startX + 160; x <= viewW + 20; x += 340) {
      if (x < -30) continue;
      const tH = 90;
      ctx.beginPath();
      ctx.moveTo(x, horizonY - 40);
      ctx.lineTo(x + 10, horizonY - 40 - tH);
      ctx.lineTo(x + 20, horizonY - 40);
      // Crossbars
      ctx.moveTo(x + 4, horizonY - 40 - tH * 0.3);
      ctx.lineTo(x + 16, horizonY - 40 - tH * 0.3);
      ctx.moveTo(x + 6, horizonY - 40 - tH * 0.6);
      ctx.lineTo(x + 14, horizonY - 40 - tH * 0.6);
      ctx.stroke();

      // Red blinking warning light on tower tip
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x + 9, horizonY - 42 - tH, 3, 3);
    }
  }

  /**
   * Concrete Highway Overpass with Classic Blue Vietnamese Bus
   */
  private static drawOverpassAndBus(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    timer: number
  ) {
    const overpassY = viewH * 0.52;
    const scrollFactor = 0.22;
    const startX = -(camX * scrollFactor) % 500 - 500;

    // Overpass concrete deck & pillars
    ctx.fillStyle = '#CBD5E1'; // Concrete road deck
    ctx.fillRect(0, overpassY, viewW, 20);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(0, overpassY + 20, viewW, 6);

    // Green highway guardrail
    ctx.fillStyle = '#15803D';
    ctx.fillRect(0, overpassY - 8, viewW, 4);
    for (let x = 0; x < viewW; x += 30) {
      ctx.fillRect(x, overpassY - 8, 3, 8);
    }

    // Heavy concrete bridge support pillars
    ctx.fillStyle = '#64748B';
    for (let x = startX + 150; x <= viewW + 500; x += 280) {
      ctx.fillRect(x, overpassY + 26, 32, 160);
      // Pillar shadow
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 24, overpassY + 26, 8, 160);
      ctx.fillStyle = '#64748B';
    }

    // Classic Blue City Bus (Xe Buýt Đô Thị) driving across under/on the overpass!
    const busCycle = 2200;
    const busX = ((timer * 35 - camX * 0.22) % busCycle + busCycle) % busCycle - 200;

    if (busX > -150 && busX < viewW + 150) {
      ctx.save();
      ctx.translate(busX, overpassY + 45);

      // Bus shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(4, 38, 90, 6);

      // Bus body (Blue and White)
      ctx.fillStyle = '#0284C7'; // Blue lower body
      ctx.fillRect(0, 16, 95, 22);
      ctx.fillStyle = '#FFFFFF'; // White upper body
      ctx.fillRect(0, 0, 95, 16);

      // Yellow stripe
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(0, 14, 95, 3);

      // Windows
      ctx.fillStyle = '#0284C7';
      for (let wx = 12; wx < 85; wx += 16) {
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(wx, 3, 12, 10);
      }
      // Front windshield
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(86, 2, 7, 18);

      // Headlights & Taillights
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(94, 24, 2, 5);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(0, 24, 2, 5);

      // Wheels
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(22, 38, 8, 0, Math.PI * 2);
      ctx.arc(75, 38, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(22, 38, 3, 0, Math.PI * 2);
      ctx.arc(75, 38, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Distant Swallows / Birds
   */
  private static drawFlyingBirds(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    camX: number,
    timer: number
  ) {
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.2;

    const birds = [
      { x: 260, y: 70, s: 1.0 },
      { x: 285, y: 62, s: 0.8 },
      { x: 310, y: 75, s: 0.9 },
      { x: 920, y: 55, s: 1.1 },
      { x: 945, y: 48, s: 0.85 },
    ];

    for (const b of birds) {
      const bx = ((b.x - camX * 0.15 + timer * 25) % (viewW + 200) + viewW + 200) % (viewW + 200) - 100;
      const flap = Math.sin(timer * 8 + b.x) * 4;

      ctx.save();
      ctx.translate(bx, b.y);
      ctx.beginPath();
      ctx.moveTo(-6 * b.s, flap * b.s);
      ctx.quadraticCurveTo(-3 * b.s, -2 * b.s, 0, 0);
      ctx.quadraticCurveTo(3 * b.s, -2 * b.s, 6 * b.s, flap * b.s);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * 2. Draw Foreground & Midground Scenery for Map 2:
   * - Quán PHỞ BÒ & Hoa Giấy
   * - Quán TẠP HÓA & Xe Máy & Chó Mái Tôn
   * - Trạm CSGT, Cột Đèn Giao Thông, Rào Chắn
   * - Cột Điện, Dây Điện & Băng Rôn "VIỆT NAM VÔ ĐỊCH"
   * - Bàn Gỗ, Giàn Giáo Ống Sắt, Thùng Phi Đỏ, Thùng Gỗ
   */
  public static drawEnvironment(
    ctx: CanvasRenderingContext2D,
    camX: number,
    timer: number
  ) {
    // Viewport culling: skip props that are entirely off-screen
    const vis = (x: number, w: number) => x + w + 100 >= camX && x - 100 <= camX + 960;

    // 1. Quán PHỞ BÒ (Left Side: x: 0 to 360)
    if (vis(0, 380)) this.drawPhoBoShop(ctx, 0, 180, timer);

    // 2. Quán TẠP HÓA (Center: x: 620 to 1020)
    if (vis(620, 420)) this.drawTapHoaShop(ctx, 620, 240, timer);

    // 3. Trạm CSGT & Cổng Phố Huyện (Right Side: x: 1600 to 2100)
    if (vis(1600, 520)) this.drawCsgtStation(ctx, 1680, 260, timer);

    // 4. Utility Telephone Poles & Tangled Power Lines
    this.drawPowerLines(ctx, timer, camX);

    // 5. Scaffolding Platforms, Pipes & Barrels
    this.drawScaffoldingStructures(ctx, camX);
  }

  /**
   * Quán PHỞ BÒ:
   * - 2-story yellow townhouse with balcony & climbing bougainvillea (hoa giấy tím hồng)
   * - National Flag fluttering on balcony
   * - Wooden sign "PHỞ BÒ" with steaming noodle bowl
   * - Blue-white awning canopy
   * - Red plastic stools, potted plants, green trash can, and cute cat
   */
  private static drawPhoBoShop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timer: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Building stucco walls (Warm yellow/cream)
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(10, 0, 320, 320);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(10, 0, 320, 15);

    // Second floor window & balcony railing
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(50, 40, 60, 70);
    ctx.fillRect(150, 40, 60, 70);
    // Window glass
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(54, 44, 52, 62);
    ctx.fillRect(154, 44, 52, 62);

    // Balcony railing
    ctx.fillStyle = '#475569';
    ctx.fillRect(35, 105, 195, 6);
    for (let bx = 40; bx < 230; bx += 14) {
      ctx.fillRect(bx, 105, 3, 25);
    }

    // Vietnamese National Flag on Balcony (Cờ đỏ sao vàng)
    const flagWave = Math.sin(timer * 4) * 3;
    ctx.fillStyle = '#DC2626'; // Red flag
    ctx.fillRect(235, 60, 42, 28 + flagWave);
    // Yellow star
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(256, 74 + flagWave * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Climbing Bougainvillea (Cây Hoa Giấy tím hồng nở rộ leo tường)
    ctx.fillStyle = '#15803D'; // Green foliage
    ctx.beginPath();
    ctx.ellipse(30, 80, 24, 70, 0.2, 0, Math.PI * 2);
    ctx.ellipse(45, 40, 20, 35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Magenta / Pink flower clusters (Hoa giấy)
    const flowerColors = ['#E11D48', '#F43F5E', '#FB7185', '#FDA4AF'];
    for (let f = 0; f < 30; f++) {
      const fx = 15 + ((f * 17) % 45);
      const fy = 20 + ((f * 13) % 120);
      ctx.fillStyle = flowerColors[f % flowerColors.length];
      ctx.fillRect(fx, fy, 5, 5);
    }

    // Blue Street Name Sign "ĐƯỜNG LÊ LỢI"
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(16, 155, 60, 26);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 155, 60, 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ĐƯỜNG', 26, 166);
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LÊ LỢI', 26, 177);

    // Wooden Arrow Sign "BẮT ĐẦU ➔"
    ctx.fillStyle = '#78350F';
    ctx.fillRect(18, 190, 56, 26);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 190, 56, 26);
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BẮT ĐẦU ➔', 22, 207);

    // "PHỞ BÒ" Shop Sign (Light pink/cream board with bowl illustration)
    ctx.fillStyle = '#FFF1F2';
    ctx.fillRect(90, 140, 110, 40);
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 140, 110, 40);

    ctx.fillStyle = '#BE123C';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PHỞ', 100, 166);
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BÒ', 138, 166);

    // Pho bowl icon on sign
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(175, 162, 10, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#FBBF24'; // Noodles
    ctx.fillRect(168, 156, 14, 4);

    // Blue-White Striped Awning Canopy
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(80, 182, 130, 20);
    for (let s = 80; s < 210; s += 20) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(s, 182, 10, 20);
      ctx.fillStyle = '#0284C7';
    }

    // Shop Entry Door
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(100, 202, 90, 118);

    // Red Plastic Stools (Ghế nhựa đỏ quen thuộc ở Việt Nam!)
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(105, 290, 14, 12);
    ctx.fillRect(125, 290, 14, 12);
    ctx.fillRect(145, 290, 14, 12);

    // Green Trash Can & Concrete Steps
    ctx.fillStyle = '#15803D';
    ctx.fillRect(205, 280, 16, 24);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(90, 304, 120, 16);

    // Cute Calico Cat sitting on the porch / box
    ctx.fillStyle = '#F59E0B'; // Orange patch
    ctx.beginPath();
    ctx.arc(60, 295, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF'; // White belly
    ctx.beginPath();
    ctx.arc(58, 297, 5, 0, Math.PI * 2);
    ctx.fill();
    // Cat ears
    ctx.fillStyle = '#78350F';
    ctx.fillRect(55, 286, 3, 3);
    ctx.fillRect(63, 286, 3, 3);

    ctx.restore();
  }

  /**
   * Cửa hàng TẠP HÓA:
   * - Blue sign "TẠP HÓA" with striped awning
   * - Side signboards: "NƯỚC GIẢI KHÁT", "BÁNH MÌ"
   * - Blue scooter / motorcycle parked outside
   * - Corrugated tin roof with cute puppy dog sitting on it
   */
  private static drawTapHoaShop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timer: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Store building
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 40, 260, 220);

    // Corrugated Tin Roof (Mái tôn) over shop
    ctx.fillStyle = '#64748B';
    ctx.fillRect(-15, 30, 290, 14);
    for (let rx = -15; rx < 275; rx += 8) {
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(rx, 30, 4, 14);
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx + 4, 30, 4, 14);
    }

    // Cute chubby puppy dog sitting on the tin roof! (Matching the photo!)
    const dogX = 75;
    const dogY = 16;
    // Body
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(dogX + 8, dogY + 8, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // White chest
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(dogX + 11, dogY + 10, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(dogX + 16, dogY + 3, 7, 0, Math.PI * 2);
    ctx.fill();
    // Cute black nose & ears
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(dogX + 20, dogY + 3, 2, 2);
    ctx.fillRect(dogX + 13, dogY - 4, 3, 4);
    // Wagging tail
    const wag = Math.sin(timer * 10) * 3;
    ctx.fillStyle = '#D97706';
    ctx.fillRect(dogX - 2, dogY + 6 + wag, 4, 3);

    // Signboard "TẠP HÓA" (Blue rectangular sign with white text)
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(45, 50, 170, 36);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 50, 170, 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 17px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TẠP HÓA', 130, 75);

    // Blue-White striped awning
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(35, 88, 190, 18);
    for (let ax = 35; ax < 225; ax += 20) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ax, 88, 10, 18);
    }

    // Glass display shelves inside grocery store
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(60, 108, 140, 110);
    // Shelves with colorful snack bags & drink cans
    for (let sy = 120; sy < 210; sy += 26) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(65, sy, 130, 3);
      // Items on shelf
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
      for (let ix = 70; ix < 185; ix += 14) {
        ctx.fillStyle = colors[(ix + sy) % colors.length];
        ctx.fillRect(ix, sy - 14, 8, 14);
      }
    }

    // Signboard "NƯỚC GIẢI KHÁT" on the left
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(6, 120, 48, 65);
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 120, 48, 65);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NƯỚC', 30, 138);
    ctx.fillText('GIẢI', 30, 152);
    ctx.fillText('KHÁT', 30, 166);

    // Signboard "BÁNH MÌ" with banh mi illustration on the right
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(206, 130, 50, 75);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(206, 130, 50, 75);

    ctx.fillStyle = '#B45309';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BÁNH', 231, 146);
    ctx.fillText('MÌ', 231, 158);

    // Banh mi graphic
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(231, 178, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803D'; // Cucumber/cilantro
    ctx.fillRect(222, 175, 18, 3);
    ctx.fillStyle = '#DC2626'; // Chili/meat
    ctx.fillRect(225, 178, 12, 3);

    // Parked Blue Scooter / Motorbike (Xe máy Cub xanh)
    const motoX = 110;
    const motoY = 195;
    // Wheels
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(motoX, motoY + 16, 9, 0, Math.PI * 2);
    ctx.arc(motoX + 32, motoY + 16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(motoX, motoY + 16, 4, 0, Math.PI * 2);
    ctx.arc(motoX + 32, motoY + 16, 4, 0, Math.PI * 2);
    ctx.fill();

    // Blue Chassis
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(motoX + 6, motoY + 6, 22, 10);
    ctx.fillStyle = '#1E293B'; // Seat
    ctx.fillRect(motoX + 4, motoY + 4, 16, 4);
    // Handlebar & Mirror
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(motoX + 26, motoY + 8);
    ctx.lineTo(motoX + 28, motoY - 4);
    ctx.lineTo(motoX + 32, motoY - 4);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Police Outpost "CSGT", Traffic Light, Barricades & Traffic Cones
   */
  private static drawCsgtStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timer: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Station building (Ochre yellow)
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(80, 0, 180, 240);
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(80, 0, 180, 12);

    // Station sign "CSGT"
    ctx.fillStyle = '#B45309';
    ctx.fillRect(95, 30, 80, 32);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CSGT', 135, 52);

    // Red National Flag on Station Roof
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(180, -35, 45, 30);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(202, -20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, -35);
    ctx.lineTo(180, 0);
    ctx.stroke();

    // Traffic Light Pole (Cột đèn giao thông)
    const tlX = 220;
    const tlY = 20;
    // Pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(tlX + 8, tlY + 70, 8, 150);

    // Traffic light housing
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(tlX, tlY, 24, 70);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.strokeRect(tlX, tlY, 24, 70);

    // Red, Yellow, Green Lights
    const lightCycle = Math.floor(timer * 1.5) % 3;
    // Red
    ctx.fillStyle = lightCycle === 0 ? '#EF4444' : '#7F1D1D';
    ctx.beginPath();
    ctx.arc(tlX + 12, tlY + 14, 7, 0, Math.PI * 2);
    ctx.fill();
    // Yellow
    ctx.fillStyle = lightCycle === 1 ? '#FACC15' : '#78350F';
    ctx.beginPath();
    ctx.arc(tlX + 12, tlY + 35, 7, 0, Math.PI * 2);
    ctx.fill();
    // Green
    ctx.fillStyle = lightCycle === 2 ? '#22C55E' : '#14532D';
    ctx.beginPath();
    ctx.arc(tlX + 12, tlY + 56, 7, 0, Math.PI * 2);
    ctx.fill();

    // Red and White Construction Barricade (Rào chắn công trình)
    const barX = -80;
    const barY = 190;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(barX, barY, 130, 24);
    // Diagonal red stripes
    ctx.fillStyle = '#DC2626';
    for (let s = barX; s < barX + 130; s += 20) {
      ctx.beginPath();
      ctx.moveTo(s, barY);
      ctx.lineTo(s + 10, barY);
      ctx.lineTo(s, barY + 24);
      ctx.closePath();
      ctx.fill();
    }
    // Barricade legs
    ctx.fillStyle = '#475569';
    ctx.fillRect(barX + 10, barY + 24, 6, 26);
    ctx.fillRect(barX + 114, barY + 24, 6, 26);

    // Orange Traffic Cones (Cọc tiêu giao thông viền trắng)
    this.drawTrafficCone(ctx, -100, 215);
    this.drawTrafficCone(ctx, -30, 215);
    this.drawTrafficCone(ctx, 40, 215);

    // Red STOP Barrier Sign
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(10, 205, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STOP', 10, 208);

    ctx.restore();
  }

  /**
   * Utility Telephone Poles & Tangled Power Lines (Đặc trưng đường phố Việt Nam)
   */
  private static drawPowerLines(
    ctx: CanvasRenderingContext2D,
    timer: number,
    camX: number = 0
  ) {
    const vis = (x: number, w: number) => x + w + 60 >= camX && x - 60 <= camX + 960;
    // 2 Prominent Concrete Utility Poles
    const poles = [
      { x: 340, y: 120, h: 380 },
      { x: 1280, y: 130, h: 370 },
    ];

    for (const p of poles) {
      if (!vis(p.x - 30, 80)) continue;
      // Concrete pole body
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(p.x, p.y, 14, p.h);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(p.x + 10, p.y, 4, p.h);

      // Wooden / metal crossarms on top
      ctx.fillStyle = '#78350F';
      ctx.fillRect(p.x - 28, p.y + 15, 70, 7);
      ctx.fillRect(p.x - 20, p.y + 40, 54, 7);

      // White ceramic insulators
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.x - 24, p.y + 8, 5, 8);
      ctx.fillRect(p.x - 8, p.y + 8, 5, 8);
      ctx.fillRect(p.x + 16, p.y + 8, 5, 8);
      ctx.fillRect(p.x + 32, p.y + 8, 5, 8);

      // Perched bird on the pole / crossarm!
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(p.x - 12, p.y + 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p.x - 10, p.y + 5, 2, 2);
    }

    // Red Street Banner "VIỆT NAM VÔ ĐỊCH" hanging from pole 1280
    const bannerX = 1295;
    const bannerY = 160;
    if (vis(bannerX, 36)) {
    const bannerSway = Math.sin(timer * 2.5) * 2;
    ctx.fillStyle = '#DC2626'; // Bright red
    ctx.fillRect(bannerX, bannerY + bannerSway, 36, 120);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bannerX, bannerY + bannerSway, 36, 120);

    // Yellow Star & Text
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(bannerX + 18, bannerY + 18 + bannerSway, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIỆT', bannerX + 18, bannerY + 45 + bannerSway);
    ctx.fillText('NAM', bannerX + 18, bannerY + 62 + bannerSway);
    ctx.fillText('VÔ', bannerX + 18, bannerY + 82 + bannerSway);
    ctx.fillText('ĐỊCH', bannerX + 18, bannerY + 100 + bannerSway);
    }

    // Tangled Power Lines stretching between poles & buildings
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.2;

    const lineSpans = [
      { startX: 0, startY: 130, endX: 340, endY: 135, sag: 20 },
      { startX: 340, startY: 135, endX: 1280, endY: 145, sag: 50 },
      { startX: 1280, startY: 145, endX: 2200, endY: 160, sag: 45 },
      { startX: 340, startY: 160, endX: 1280, endY: 170, sag: 40 },
      { startX: 0, startY: 160, endX: 340, endY: 160, sag: 15 },
    ];

    for (const ls of lineSpans) {
      if (!vis(ls.startX, ls.endX - ls.startX)) continue;
      ctx.beginPath();
      ctx.moveTo(ls.startX, ls.startY);
      const midX = (ls.startX + ls.endX) / 2;
      const midY = (ls.startY + ls.endY) / 2 + ls.sag;
      ctx.quadraticCurveTo(midX, midY, ls.endX, ls.endY);
      ctx.stroke();
    }
  }

  /**
   * Scaffolding Structures, Industrial Pipes, Red Barrels & Crates
   */
  private static drawScaffoldingStructures(ctx: CanvasRenderingContext2D, camX: number = 0) {
    const vis = (x: number, w: number) => x + w + 60 >= camX && x - 60 <= camX + 960;

    // Pipe Scaffold Structure 1 (x: 460 - 660)
    if (vis(480, 180)) this.drawPipeCluster(ctx, 480, 280, 180, 220);

    // Pipe Scaffold Structure 2 (x: 1320 - 1580)
    if (vis(1340, 190)) this.drawPipeCluster(ctx, 1340, 290, 190, 210);

    // Red Fuel / Oil Barrels
    if (vis(510, 30)) this.drawOilBarrel(ctx, 510, 470);
    if (vis(1360, 30)) this.drawOilBarrel(ctx, 1360, 460);
    if (vis(1420, 30)) this.drawOilBarrel(ctx, 1420, 360);

    // Wooden Crates
    if (vis(580, 28)) this.drawWoodenCrate(ctx, 580, 470, 28);
    if (vis(1140, 30)) this.drawWoodenCrate(ctx, 1140, 470, 30);
  }

  /**
   * Steel Scaffolding Pipe Tier with Vines
   */
  private static drawPipeCluster(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Metal pipes (Rusted steel)
    ctx.fillStyle = '#64748B';
    // Vertical legs
    ctx.fillRect(8, 0, 7, h);
    ctx.fillRect(w - 15, 0, 7, h);
    ctx.fillRect(w / 2 - 3, 0, 7, h);

    // Horizontal bars
    ctx.fillRect(0, 0, w, 8);
    ctx.fillRect(0, h * 0.45, w, 7);
    ctx.fillRect(0, h * 0.8, w, 7);

    // Diagonal support pipes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(w / 2, h * 0.45);
    ctx.lineTo(w - 15, 0);
    ctx.moveTo(8, h * 0.45);
    ctx.lineTo(w / 2, h * 0.8);
    ctx.lineTo(w - 15, h * 0.45);
    ctx.stroke();

    // Creeping Ivy Vines on pipes
    ctx.fillStyle = '#15803D';
    for (let vy = 10; vy < h; vy += 20) {
      ctx.beginPath();
      ctx.ellipse(8, vy, 5, 8, 0.4, 0, Math.PI * 2);
      ctx.ellipse(w - 12, vy + 8, 5, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Red Oil Barrel (Thùng phi đỏ)
   */
  private static drawOilBarrel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Barrel body
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, 0, 22, 30);
    // Darker rim ribs
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(0, 4, 22, 3);
    ctx.fillRect(0, 14, 22, 3);
    ctx.fillRect(0, 24, 22, 3);

    // Yellow hazard warning symbol
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(11, 8);
    ctx.lineTo(6, 18);
    ctx.lineTo(16, 18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Wooden Shipping Crate (Thùng gỗ)
   */
  private static drawWoodenCrate(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#B45309';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    // Cross diagonal braces
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Orange Traffic Cone with White Reflective Stripe
   */
  private static drawTrafficCone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Square base
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(-10, 16, 20, 4);

    // Cone body
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, 16);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();

    // White reflective bands
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, 5, 8, 4);
    ctx.fillRect(-6, 11, 12, 3);

    ctx.restore();
  }

  /**
   * 3. Draw Heart Healing Collectible (Trái Tim Hồi Máu)
   * Pulsating 16-bit pixel heart with radiant glow & sparkle
   */
  public static drawHeart(
    ctx: CanvasRenderingContext2D,
    c: Collectible,
    timer: number
  ) {
    const bobY = c.y + Math.sin(c.bobOffset + timer * 4) * 3;
    const cx = c.x + c.width / 2;
    const cy = bobY + c.height / 2;

    // Heartbeat pulse effect
    const pulse = 1 + Math.sin(timer * 6 + c.bobOffset) * 0.12;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    // Outer soft pink glow
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Dark ruby outline
    ctx.fillStyle = '#881337';
    // Draw 16-bit Heart Shape
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-14, 2, -14, -10, -6, -10);
    ctx.bezierCurveTo(0, -10, 0, -5, 0, -3);
    ctx.bezierCurveTo(0, -5, 0, -10, 6, -10);
    ctx.bezierCurveTo(14, -10, 14, 2, 0, 12);
    ctx.closePath();
    ctx.fill();

    // Vibrant Red Heart Body
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-12, 1, -12, -8, -5, -8);
    ctx.bezierCurveTo(0, -8, 0, -4, 0, -2);
    ctx.bezierCurveTo(0, -4, 0, -8, 5, -8);
    ctx.bezierCurveTo(12, -8, 12, 1, 0, 10);
    ctx.closePath();
    ctx.fill();

    // Bright Coral Inner Highlight
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(-4, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shiny Specular Sparkle Pixel
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, -6, 2, 2);
    ctx.fillRect(-3, -4, 1.5, 1.5);

    ctx.restore();
  }
}
