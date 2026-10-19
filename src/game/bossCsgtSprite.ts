/**
 * Detailed 16-Bit Pixel Canvas Renderer for Boss Công An (CSGT Traffic Police Officer)
 * Faithfully crafted to mirror the character and vehicle from the reference image:
 * - Sand-khaki / tan official CSGT uniform with badges & epaulets
 * - Peaked police cap (mũ kê-pi vàng cát viền đỏ có ngôi sao vàng)
 * - Stern determined face with thick black mustache & furrowed dark eyebrows
 * - Black-and-white striped traffic baton (gậy chỉ huy giao thông sọc trắng đen)
 * - Service pistol for the gun shooting attack with muzzle flash
 * - Iconic CSGT White & Blue Patrol Motorcycle (Xe mô tô đặc chủng CSGT) parked behind him
 * - Floating Boss Health Bar ("Cônng an" with HP)
 */

import { Boss } from '../types/game';

export interface BossRenderOptions {
  boss: Boss;
  timer: number;
}

export function drawCsgtBoss(ctx: CanvasRenderingContext2D, opt: BossRenderOptions) {
  const { boss, timer } = opt;

  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));

  // Flashing invulnerability effect
  if (boss.invulnerableTimer > 0 && Math.floor(boss.animTimer * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Facing flip (Default model faces left towards Phước, as in the image!)
  if (boss.facing === 'right') {
    ctx.scale(-1, 1);
    ctx.translate(-boss.width, 0);
  }

  // Walk/Action animation timers
  const walkPhase = Math.sin(boss.animTimer * 8);
  const legOffset = boss.state === 'patrol' ? walkPhase * 6 : 0;
  const isDefeated = boss.state === 'defeated';
  const isStunned = boss.state === 'stunned';
  const isShooting = boss.state === 'gun_attack' || boss.isShootingGun;

  // ==========================================
  // 1. CSGT SPECIAL PATROL MOTORCYCLE (Parked behind officer)
  // ==========================================
  ctx.save();
  ctx.translate(45, 18);

  // Bike Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.beginPath();
  ctx.ellipse(32, 68, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear Wheel
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(62, 55, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.arc(62, 55, 9, 0, Math.PI * 2);
  ctx.fill();

  // Front Wheel
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(4, 55, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.arc(4, 55, 9, 0, Math.PI * 2);
  ctx.fill();

  // Chrome Exhaust Pipe
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(25, 60, 42, 6);
  ctx.fillRect(67, 58, 6, 8);

  // White Motorcycle Chassis Body
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(12, 40);
  ctx.lineTo(25, 22);
  ctx.lineTo(60, 24);
  ctx.lineTo(75, 42);
  ctx.lineTo(55, 52);
  ctx.lineTo(15, 52);
  ctx.closePath();
  ctx.fill();

  // Blue Side Fairing Stripe
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(18, 36);
  ctx.lineTo(26, 26);
  ctx.lineTo(55, 28);
  ctx.lineTo(65, 42);
  ctx.lineTo(45, 46);
  ctx.lineTo(18, 42);
  ctx.closePath();
  ctx.fill();

  // Side Saddlebag with bold "CSGT" text!
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(44, 34, 30, 18);
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 34, 30, 18);

  ctx.fillStyle = '#0369A1';
  ctx.font = '900 8px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CSGT', 59, 46);

  // Windshield & Handlebar
  ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
  ctx.fillRect(8, 10, 14, 20);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 25);
  ctx.lineTo(20, 14);
  ctx.lineTo(28, 14);
  ctx.stroke();

  // Siren Pole with Flashing Red/Blue Light
  const sirenFlash = Math.sin(timer * 12) > 0;
  ctx.fillStyle = '#64748B';
  ctx.fillRect(70, 2, 3, 26);
  // Beacon light
  ctx.fillStyle = sirenFlash ? '#EF4444' : '#3B82F6';
  ctx.fillRect(68, -4, 7, 7);
  ctx.restore();

  // ==========================================
  // 2. BOSS CÔNG AN (OFFICER) SPRITE
  // ==========================================
  const cx = 28; // Center line of officer body

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, 88, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDefeated) {
    // Defeated / surrender state: kneeling hands up
    ctx.translate(0, 14);
  }

  // A. LEGS & BOOTS (Khaki Pants & Black Police Boots)
  // Left leg
  ctx.fillStyle = '#D97706'; // Dark khaki shadow
  ctx.fillRect(cx - 16 - legOffset, 62, 12, 18);
  ctx.fillStyle = '#F59E0B'; // Main khaki
  ctx.fillRect(cx - 15 - legOffset, 62, 10, 18);
  // Left boot
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(cx - 18 - legOffset, 78, 14, 10);
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 18 - legOffset, 84, 14, 3);

  // Right leg
  ctx.fillStyle = '#D97706';
  ctx.fillRect(cx + 4 + legOffset, 62, 12, 18);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(cx + 5 + legOffset, 62, 10, 18);
  // Right boot
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(cx + 2 + legOffset, 78, 14, 10);
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx + 2 + legOffset, 84, 14, 3);

  // B. TORSO & UNIFORM (Sand-Khaki CSGT Uniform)
  // Uniform tunic
  ctx.fillStyle = '#D97706'; // Shadow base
  ctx.fillRect(cx - 18, 30, 36, 34);
  ctx.fillStyle = '#FBBF24'; // Warm khaki-tan tunic
  ctx.fillRect(cx - 16, 30, 32, 32);

  // Epaulets (Cầu vai công an màu đỏ viền vàng)
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - 19, 30, 8, 4);
  ctx.fillRect(cx + 11, 30, 8, 4);
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(cx - 17, 31, 4, 2);
  ctx.fillRect(cx + 13, 31, 4, 2);

  // Breast pockets & Gold badge
  ctx.fillStyle = '#D97706';
  ctx.fillRect(cx - 13, 38, 9, 8);
  ctx.fillRect(cx + 4, 38, 9, 8);
  // Gold badge
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(cx - 11, 40, 5, 4);

  // Leather Duty Belt & Gold Buckle
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(cx - 17, 56, 34, 7);
  ctx.fillStyle = '#FDE047'; // Brass buckle
  ctx.fillRect(cx - 4, 55, 8, 9);
  ctx.fillStyle = '#78350F'; // Holster on hip
  ctx.fillRect(cx + 12, 57, 6, 12);

  // C. HEAD & FACE
  // Neck
  ctx.fillStyle = '#FED7AA';
  ctx.fillRect(cx - 5, 23, 10, 8);

  // Face
  ctx.fillStyle = '#FED7AA';
  ctx.beginPath();
  ctx.arc(cx, 16, 12, 0, Math.PI * 2);
  ctx.fill();

  // Thick Stern Black Eyebrows
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(cx - 10, 11, 7, 3);
  ctx.fillRect(cx + 3, 11, 7, 3);

  // Fierce Eyes
  if (isStunned) {
    // Dizzy X eyes
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 9, 13);
    ctx.lineTo(cx - 3, 18);
    ctx.moveTo(cx - 3, 13);
    ctx.lineTo(cx - 9, 18);
    ctx.moveTo(cx + 3, 13);
    ctx.lineTo(cx + 9, 18);
    ctx.moveTo(cx + 9, 13);
    ctx.lineTo(cx + 3, 18);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 9, 13, 6, 4);
    ctx.fillRect(cx + 3, 13, 6, 4);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - 8, 14, 3, 3);
    ctx.fillRect(cx + 4, 14, 3, 3);
  }

  // Nose
  ctx.fillStyle = '#FDBA74';
  ctx.fillRect(cx - 2, 16, 4, 3);

  // Iconic Thick Black Mustache!
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(cx, 21, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Grit Mouth / Shout
  if (isShooting) {
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(cx - 4, 23, 8, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 3, 23, 6, 1.5);
  } else {
    ctx.fillStyle = '#78350F';
    ctx.fillRect(cx - 3, 23, 6, 1.5);
  }

  // D. CSGT PEAKED POLICE CAP (Mũ kê-pi vàng cát viền đỏ có ngôi sao)
  // Red cap band
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - 14, 8, 28, 5);

  // Cap crown (Khaki tan)
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(cx - 15, 8);
  ctx.lineTo(cx - 18, 0);
  ctx.lineTo(cx + 18, 0);
  ctx.lineTo(cx + 15, 8);
  ctx.closePath();
  ctx.fill();

  // Black glossy cap visor / brim
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(cx - 5, 12, 12, 3, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Gold Star Badge on Cap (Huy hiệu Công An)
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(cx, 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - 1, 7, 2, 2);

  // E. ARMS & WEAPONS (Traffic Baton or Service Pistol!)
  if (isShooting) {
    // 1. GUN SHOOTING STANCE:
    // Right arm raised, holding service pistol pointing horizontally at Phước!
    ctx.save();
    // Arm
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx - 24, 33, 14, 7);
    // White glove
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 28, 32, 6, 8);

    // Black Service Pistol (Súng lục CSGT)
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(cx - 44, 30, 18, 6); // Barrel
    ctx.fillRect(cx - 34, 35, 6, 9); // Grip
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 44, 31, 14, 2); // Slide highlight

    // Muzzle flash particle if firing!
    const flashTimer = boss.gunShootTimer || 0;
    if (flashTimer > 0.6) {
      // Big cartoon muzzle flash
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx - 50, 33, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(cx - 50, 33, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 52, 32, 4, 3);
    }
    ctx.restore();

    // Left arm steadying or holding baton at waist
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx + 12, 36, 8, 16);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx + 12, 50, 7, 6);
  } else {
    // 2. CLASSIC BATON STANCE (Holding Black & White Striped Traffic Baton)
    // Left arm
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx + 12, 34, 7, 16);
    ctx.fillStyle = '#F8FAFC'; // White glove
    ctx.fillRect(cx + 12, 48, 7, 6);

    // Right arm holding baton pointing forward/up
    ctx.save();
    ctx.translate(cx - 12, 42);
    ctx.rotate(-0.35 + Math.sin(boss.animTimer * 6) * 0.1);

    // Forearm
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-10, -3, 12, 7);
    // White glove
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-14, -4, 6, 8);

    // Black & White Striped Traffic Baton (Gậy chỉ huy giao thông sọc trắng đen)
    const batonLen = 38;
    for (let b = 0; b < batonLen; b += 6) {
      ctx.fillStyle = (b / 6) % 2 === 0 ? '#0F172A' : '#F8FAFC';
      ctx.fillRect(-14 - b - 6, -3, 6, 6);
    }
    // Red rubber tip on baton
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-14 - batonLen - 3, -3, 3, 6);
    ctx.restore();
  }

  // ==========================================
  // 3. FLOATING BOSS HEALTH BAR ("Cônng an")
  // ==========================================
  const hpBarW = 76;
  const hpBarH = 9;
  const hpBarX = cx - hpBarW / 2;
  const hpBarY = -22;

  // Boss Name Tag
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;
  ctx.fillText('Cônng an', cx, hpBarY - 4);
  ctx.shadowBlur = 0;

  // Health bar background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#7F1D1D'; // Depleted red
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

  // Health remaining fill
  const hpRatio = Math.max(0, Math.min(1, boss.health / boss.maxHealth));
  const hpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW, 0);
  hpGrad.addColorStop(0, '#EF4444');
  hpGrad.addColorStop(0.5, '#F59E0B');
  hpGrad.addColorStop(1, '#22C55E');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);

  // Health bar inner border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);

  // Dialogue bubble if present
  if (boss.dialogueBubble && boss.dialogueBubble.timer > 0) {
    const bubbleW = Math.min(160, boss.dialogueBubble.text.length * 8 + 20);
    const bubbleH = 26;
    const bubbleX = cx - bubbleW / 2;
    const bubbleY = hpBarY - 34;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
    ctx.fill();
    ctx.stroke();

    // Bubble beak
    ctx.beginPath();
    ctx.moveTo(cx - 4, bubbleY + bubbleH);
    ctx.lineTo(cx, bubbleY + bubbleH + 6);
    ctx.lineTo(cx + 4, bubbleY + bubbleH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.dialogueBubble.text, cx, bubbleY + 16);
  }

  ctx.restore();
}
