/**
 * Detailed 16-Bit Pixel Canvas Renderer for Boss Bá Hộ Long
 * Model updated to match user's uploaded sprite sheet:
 * - Handsome young Vietnamese rich boy
 * - Black wavy center-part comma hair
 * - Silver chain necklace
 * - Oversized black streetwear T-shirt with bold white "LAS" graphic print
 * - Baggy black cargo pants
 * - Trendy black skate sneakers with white laces & thick white rubber soles
 * - Smooth animation states:
 *   * Run / Patrol cycle (matching RUN LEFT / RUN RIGHT from sprite sheet)
 *   * Jump / Fall (matching JUMP / FALL from sheet)
 *   * Dice Throw Volley (flinging glowing red/white dice)
 *   * Money Throw (hurling fans of green $100 dollar bills / cash stacks)
 *   * Defeated (kneeling on ground pleading for forgiveness)
 */

import { Boss } from '../types/game';
import baHoLongAvatarSrc from '../assets/images/ba_ho_long_las_streetwear_1792349486434.jpg';

const bossAvatarImg = new Image();
bossAvatarImg.src = baHoLongAvatarSrc;

export interface BaHoLongRenderOptions {
  boss: Boss;
  timer: number;
}

export function drawBaHoLongBoss(ctx: CanvasRenderingContext2D, opt: BaHoLongRenderOptions) {
  const { boss, timer } = opt;

  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));

  // Invulnerability blink
  if (boss.invulnerableTimer > 0 && Math.floor(boss.animTimer * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Facing direction (Default faces left towards Phước)
  if (boss.facing === 'right') {
    ctx.scale(-1, 1);
    ctx.translate(-boss.width, 0);
  }

  const cx = 36;
  const isDefeated = boss.state === 'defeated';
  const isStunned = boss.state === 'stunned';
  const isDiceThrow = boss.state === 'dice_throw';
  const isMoneyThrow = boss.state === 'money_throw' || boss.state === 'citation_attack';
  const isJumpOrFall = boss.state === 'jump_slam';

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, 100, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDefeated) {
    // Kneeling down defeated pose
    drawDefeatedPose(ctx, cx);
    drawHealthBar(ctx, boss, cx);
    drawDialogueBubble(ctx, boss, cx);
    ctx.restore();
    return;
  }

  // Run cycle calculation (8 frames like sprite sheet L1-L8 / R1-R8)
  const isMoving = boss.state === 'idle' || boss.state === 'patrol';
  const runFrame = isMoving ? Math.floor((boss.animTimer * 12) % 8) : 0;
  const legOffset = isMoving ? Math.sin(boss.animTimer * 12) * 8 : 0;
  const bounceY = isMoving ? Math.abs(Math.sin(boss.animTimer * 12)) * 3 : 0;

  ctx.save();
  ctx.translate(0, -bounceY);

  // 1. LEGS & SNEAKERS (Black streetwear baggy pants + Black/White skate sneakers)
  ctx.fillStyle = '#18181B'; // Deep black / charcoal baggy trousers

  if (isJumpOrFall) {
    // Jump / Fall pose (knees tucked / legs bent)
    ctx.fillRect(cx - 16, 68, 12, 16);
    ctx.fillRect(cx + 4, 64, 12, 18);

    // Black & White Skate Sneakers (mid-air)
    drawSneaker(ctx, cx - 18, 84, -0.2);
    drawSneaker(ctx, cx + 4, 82, 0.2);
  } else {
    // Running / Standing legs
    const leftLegY = 68 + legOffset;
    const rightLegY = 68 - legOffset;

    ctx.fillRect(cx - 14, 66, 11, 20 + legOffset * 0.4);
    ctx.fillRect(cx + 3, 66, 11, 20 - legOffset * 0.4);

    // Sneakers with white soles and laces
    drawSneaker(ctx, cx - 18, leftLegY + 14, (legOffset / 8) * 0.2);
    drawSneaker(ctx, cx + 2, rightLegY + 14, (-legOffset / 8) * 0.2);
  }

  // 2. TORSO: OVERSIZED BLACK STREETWEAR T-SHIRT WITH WHITE "LAS" LOGO
  // Main shirt body
  ctx.fillStyle = '#18181B'; // Jet black t-shirt
  ctx.fillRect(cx - 20, 32, 40, 38);

  // Drop-shoulder loose sleeves
  ctx.fillRect(cx - 24, 34, 8, 20);
  ctx.fillRect(cx + 16, 34, 8, 20);

  // Bold White Streetwear "LAS" Logo across chest (matching sprite sheet)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 13px "Rowdies", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('LAS', cx, 52);

  // Bottom shirt hem highlight
  ctx.fillStyle = '#27272A';
  ctx.fillRect(cx - 20, 68, 40, 3);

  // 3. NECK & SILVER CHAIN NECKLACE
  ctx.fillStyle = '#FDE68A'; // Healthy warm skin
  ctx.fillRect(cx - 6, 23, 12, 11);

  // Delicate shiny silver Cuban chain necklace
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, 26, 7, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = '#F8FAFC'; // Diamond / silver shine
  ctx.fillRect(cx - 1, 32, 2, 3);

  // 4. HANDSOME ANIME FACE & BLACK COMMA HAIR
  // Head
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(cx, 16, 14, 0, Math.PI * 2);
  ctx.fill();

  // Face features (Eyes, Eyebrows, Smirk)
  if (isStunned) {
    // Dizzy X_X eyes when hit with BECAUSE!
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 9, 13);
    ctx.lineTo(cx - 4, 18);
    ctx.moveTo(cx - 4, 13);
    ctx.lineTo(cx - 9, 18);
    ctx.moveTo(cx + 4, 13);
    ctx.lineTo(cx + 9, 18);
    ctx.moveTo(cx + 9, 13);
    ctx.lineTo(cx + 4, 18);
    ctx.stroke();
  } else {
    // Sharp handsome anime eyes with dark pupils & white glint
    ctx.fillStyle = '#18181B';
    // Left eye
    ctx.fillRect(cx - 9, 14, 5, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 8, 14, 2, 2);

    // Right eye
    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx + 4, 14, 5, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 5, 14, 2, 2);

    // Sleek arched eyebrows
    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx - 10, 11, 7, 2);
    ctx.fillRect(cx + 3, 11, 7, 2);
  }

  // Confident smirk
  ctx.fillStyle = '#B45309';
  ctx.fillRect(cx - 3, 23, 7, 2);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx - 4, 24, 2, 1);

  // Modern Black Center-Part / Comma Hair (Curtain bangs framing face)
  ctx.fillStyle = '#18181B'; // Natural jet black hair
  // Crown of hair
  ctx.beginPath();
  ctx.arc(cx, 11, 15, Math.PI * 0.85, Math.PI * 2.15);
  ctx.fill();

  // Back hair volume
  ctx.fillRect(cx - 15, 6, 30, 8);
  ctx.fillRect(cx - 16, 12, 5, 10);
  ctx.fillRect(cx + 12, 12, 5, 10);

  // Left & right center-part comma bangs curving inward
  ctx.beginPath();
  ctx.ellipse(cx - 7, 10, 7, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + 7, 10, 7, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Highlight sheen on hair (subtle stylish gloss)
  ctx.fillStyle = '#3F3F46';
  ctx.fillRect(cx - 10, 3, 7, 3);
  ctx.fillRect(cx + 4, 3, 7, 3);

  // 5. ARMS & ATTACK POSES (DICE / MONEY BARRAGE)
  if (isDiceThrow) {
    // Both arms raised hurling glowing red & white dice!
    drawDiceThrowStance(ctx, cx);
  } else if (isMoneyThrow) {
    // Flinging fans of $100 dollar bills / stacks of cash!
    drawMoneyThrowStance(ctx, cx, timer);
  } else if (isMoving) {
    // Running arms swinging naturally
    const armSwing = Math.sin(boss.animTimer * 12) * 12;
    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx - 24, 40 + armSwing * 0.3, 8, 14);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx - 24, 52 + armSwing * 0.3, 7, 6);

    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx + 16, 40 - armSwing * 0.3, 8, 14);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx + 17, 52 - armSwing * 0.3, 7, 6);
  } else {
    // Cool idle stance with hands casually in pockets or hip
    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx - 24, 38, 8, 18);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx - 23, 54, 7, 6);

    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx + 16, 38, 8, 18);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx + 17, 54, 7, 6);
  }

  ctx.restore();

  // 6. FLOATING BOSS HEALTH BAR
  drawHealthBar(ctx, boss, cx);

  // 7. DIALOGUE BUBBLE
  drawDialogueBubble(ctx, boss, cx);

  ctx.restore();
}

/**
 * Draw trendy black & white skate sneaker
 */
function drawSneaker(ctx: CanvasRenderingContext2D, x: number, y: number, angle = 0) {
  ctx.save();
  ctx.translate(x + 8, y + 4);
  ctx.rotate(angle);

  // Black canvas upper
  ctx.fillStyle = '#18181B';
  ctx.fillRect(-8, -4, 16, 7);

  // White rubber foxing stripe & laces
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-4, -4, 6, 2); // Laces
  ctx.fillRect(-9, 1, 18, 4); // Thick white platform rubber sole

  // Rubber toe bumper
  ctx.fillStyle = '#F4F4F5';
  ctx.fillRect(-9, -2, 4, 6);

  ctx.restore();
}

/**
 * Pose for throwing pairs of glowing dice
 */
function drawDiceThrowStance(ctx: CanvasRenderingContext2D, cx: number) {
  // Right throwing arm thrust forward
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 26, 34, 22, 10);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx - 32, 33, 8, 8);

  // Glowing pair of dice in hand
  // Red dice
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - 38, 22, 11, 11);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 35, 25, 5, 5);

  // White dice
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 26, 18, 11, 11);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - 23, 21, 5, 5);

  // Left arm balancing
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx + 16, 38, 10, 16);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx + 18, 52, 7, 6);
}

/**
 * Pose for throwing fan of money stacks / $100 dollar bills
 */
function drawMoneyThrowStance(ctx: CanvasRenderingContext2D, cx: number, timer: number) {
  // Arm swinging forward flinging cash
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 24, 32, 22, 11);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx - 30, 31, 8, 8);

  // Fan of crisp green $100 dollar bills flying from hand
  ctx.fillStyle = '#16A34A'; // Emerald dollar green
  ctx.fillRect(cx - 42, 20, 14, 8);
  ctx.fillRect(cx - 46, 26, 14, 8);
  ctx.fillRect(cx - 38, 14, 14, 8);

  // Gold band / portrait circle on cash
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(cx - 37, 23, 4, 3);
  ctx.fillRect(cx - 41, 29, 4, 3);
  ctx.fillRect(cx - 33, 17, 4, 3);

  // Left hand on hip
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx + 16, 38, 10, 16);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx + 18, 52, 7, 6);
}

/**
 * Defeated pose: Long collapses to knees on the ground, head lowered in regret
 */
function drawDefeatedPose(ctx: CanvasRenderingContext2D, cx: number) {
  // Kneeling legs
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 18, 80, 36, 14);
  drawSneaker(ctx, cx - 20, 88);
  drawSneaker(ctx, cx + 6, 88);

  // Hunched torso with "LAS" shirt
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 18, 48, 36, 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LAS', cx, 66);

  // Head bowed down
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(cx, 34, 12, 0, Math.PI * 2);
  ctx.fill();

  // Comma hair drooping
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(cx, 30, 13, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();

  // Hands on head / praying for forgiveness
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(cx - 14, 32, 6, 6);
  ctx.fillRect(cx + 8, 32, 6, 6);

  // Tears of defeat
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(cx - 6, 38, 2, 6);
  ctx.fillRect(cx + 4, 38, 2, 6);
}

function drawHealthBar(ctx: CanvasRenderingContext2D, boss: Boss, cx: number) {
  const hpBarW = 90;
  const hpBarH = 10;
  const hpBarX = cx - hpBarW / 2;
  const hpBarY = -24;

  // Boss Avatar circular badge
  if (bossAvatarImg.complete && bossAvatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(hpBarX - 14, hpBarY + 5, 12, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(bossAvatarImg, hpBarX - 26, hpBarY - 7, 24, 24);
    ctx.restore();

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hpBarX - 14, hpBarY + 5, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.fillText('Bá Hộ Long (Trùm Cuối)', cx, hpBarY - 4);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#27272A';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

  const hpRatio = Math.max(0, Math.min(1, boss.health / boss.maxHealth));
  const hpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW, 0);
  hpGrad.addColorStop(0, '#DC2626');
  hpGrad.addColorStop(0.5, '#F59E0B');
  hpGrad.addColorStop(1, '#10B981');

  ctx.fillStyle = hpGrad;
  ctx.fillRect(hpBarX, hpBarY, Math.round(hpBarW * hpRatio), hpBarH);

  // Clean border
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
}

function drawDialogueBubble(ctx: CanvasRenderingContext2D, boss: Boss, cx: number) {
  if (boss.dialogueBubble && boss.dialogueBubble.timer > 0) {
    const text = boss.dialogueBubble.text;
    ctx.save();
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(text).width;
    const bubbleW = Math.max(80, textW + 18);
    const bubbleH = 24;
    const bubbleX = cx - bubbleW / 2;
    const bubbleY = -56;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, [8]);
    ctx.fill();

    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pointer tail
    ctx.beginPath();
    ctx.moveTo(cx - 5, bubbleY + bubbleH);
    ctx.lineTo(cx, bubbleY + bubbleH + 6);
    ctx.lineTo(cx + 5, bubbleY + bubbleH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.fillStyle = '#DC2626';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, bubbleY + 16);
    ctx.restore();
  }
}
