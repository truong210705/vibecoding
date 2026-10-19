/**
 * Detailed Pixel/Vector Canvas Renderer for Phước
 * Faithfully crafted after the user's sprite sheet model:
 * - Handsome young man with short spiky black anime hair (neat bangs above glasses)
 * - Prominent black-rimmed eyeglasses with bright reflective lenses & expressive eyes
 * - Bright, clear peach face (zero occlusion, 100% visible facial features)
 * - White short-sleeve polo/raglan shirt with dark collar, black sleeves, and chest crest
 * - Grey backpack with bright yellow bottle & blue cap
 * - Dark long pants & crisp white sneakers with dark soles
 */

export interface PhuocRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'jump' | 'fall' | 'shout' | 'celebrate';
  animTimer: number;
  isInvulnerable?: boolean;
}

export function drawPhuoc(ctx: CanvasRenderingContext2D, opt: PhuocRenderOptions) {
  const { x, y, width, facing, state, animTimer, isInvulnerable } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Flashing effect when taking damage
  if (isInvulnerable && Math.floor(animTimer * 24) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Flip horizontally if facing left
  if (facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  const runFrame = Math.floor((animTimer * 12) % 8);
  const celebrateFrame = Math.floor((animTimer * 8) % 6);

  let bodyBobY = 0;
  if (state === 'run') {
    bodyBobY = runFrame % 2 === 1 ? -2 : 0;
  } else if (state === 'idle') {
    bodyBobY = Math.sin(animTimer * 3) * 1;
  }

  const cx = 17; // horizontal center line

  // ==========================================
  // 1. BACKPACK (Drawn behind back)
  // ==========================================
  const backpackX = cx - 12;
  const backpackY = 16 + bodyBobY;

  // Backpack base
  ctx.fillStyle = '#4B5563'; // Slate grey backpack
  ctx.beginPath();
  ctx.roundRect(backpackX, backpackY, 8, 17, 3);
  ctx.fill();

  // Backpack front pocket & zipper
  ctx.fillStyle = '#6B7280';
  ctx.fillRect(backpackX - 1, backpackY + 5, 4, 9);
  ctx.fillStyle = '#9CA3AF';
  ctx.fillRect(backpackX - 1, backpackY + 7, 4, 1.5);

  // Yellow water bottle tucked on side
  const bottleSway = state === 'run' ? Math.sin(animTimer * 14) * 2 : 0;
  ctx.fillStyle = '#FACC15'; // Bright yellow bottle
  ctx.beginPath();
  ctx.roundRect(backpackX - 3 + bottleSway, backpackY + 7, 4, 9, 1.5);
  ctx.fill();
  ctx.fillStyle = '#0284C7'; // Blue cap
  ctx.fillRect(backpackX - 3 + bottleSway, backpackY + 5, 4, 2);

  // ==========================================
  // 2. LEGS & SNEAKERS
  // ==========================================
  const legTopY = 33 + bodyBobY;
  const pantsColor = '#18181B'; // Dark charcoal/black pants
  const shoeColor = '#FFFFFF';  // White sneakers
  const soleColor = '#09090B';  // Dark bottom sole

  if (state === 'run') {
    // 8-frame run cycle matching L1-L8 / R1-R8
    const legOffsets = [
      { lX: -6, lY: 0, rX: 5, rY: -3, lFoot: 0, rFoot: -4 },
      { lX: -4, lY: -2, rX: 7, rY: 0, lFoot: -2, rFoot: 0 },
      { lX: -1, lY: -4, rX: 4, rY: 0, lFoot: -4, rFoot: 0 },
      { lX: 3, lY: -1, rX: -2, rY: 0, lFoot: 0, rFoot: 0 },
      { lX: 6, lY: 0, rX: -5, rY: -3, lFoot: 0, rFoot: -4 },
      { lX: 4, lY: -2, rX: -4, rY: 0, lFoot: -2, rFoot: 0 },
      { lX: 0, lY: -4, rX: 0, rY: 0, lFoot: -4, rFoot: 0 },
      { lX: -4, lY: -1, rX: 3, rY: 0, lFoot: 0, rFoot: 0 },
    ];
    const off = legOffsets[runFrame] || legOffsets[0];

    // Left leg & shoe
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 5 + off.lX, legTopY, 6, 11 + off.lY);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7 + off.lX, legTopY + 11 + off.lY + off.lFoot, 9, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 7 + off.lX, legTopY + 15 + off.lY + off.lFoot, 9, 2);

    // Right leg & shoe
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx + 1 + off.rX, legTopY, 6, 11 + off.rY);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 1 + off.rX, legTopY + 11 + off.rY + off.rFoot, 9, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 1 + off.rX, legTopY + 15 + off.rY + off.rFoot, 9, 2);
  } else if (state === 'jump') {
    // Jump crouch/tuck
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6, legTopY, 6, 8);
    ctx.fillRect(cx + 1, legTopY + 2, 6, 7);

    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 8, legTopY + 7, 8, 5);
    ctx.fillRect(cx + 2, legTopY + 8, 8, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 8, legTopY + 11, 8, 2);
    ctx.fillRect(cx + 2, legTopY + 12, 8, 2);
  } else if (state === 'fall') {
    // Falling legs slightly outstretched
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 5, legTopY, 6, 12);
    ctx.fillRect(cx + 2, legTopY - 1, 6, 10);

    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 6, legTopY + 11, 9, 5);
    ctx.fillRect(cx + 2, legTopY + 9, 9, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 6, legTopY + 15, 9, 2);
    ctx.fillRect(cx + 2, legTopY + 13, 9, 2);
  } else if (state === 'celebrate') {
    // Celebrate stance
    const legSpread = celebrateFrame % 2 === 0 ? 3 : 1;
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 7 - legSpread, legTopY, 6, 12);
    ctx.fillRect(cx + 2 + legSpread, legTopY, 6, 12);

    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 9 - legSpread, legTopY + 11, 9, 5);
    ctx.fillRect(cx + 1 + legSpread, legTopY + 11, 9, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 9 - legSpread, legTopY + 15, 9, 2);
    ctx.fillRect(cx + 1 + legSpread, legTopY + 15, 9, 2);
  } else {
    // Idle straight stance
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6, legTopY, 6, 13);
    ctx.fillRect(cx + 1, legTopY, 6, 13);

    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7, legTopY + 12, 8, 5);
    ctx.fillRect(cx + 1, legTopY + 12, 8, 5);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 7, legTopY + 16, 8, 2);
    ctx.fillRect(cx + 1, legTopY + 16, 8, 2);
  }

  // ==========================================
  // 3. TORSO: WHITE POLO / RAGLAN T-SHIRT
  // ==========================================
  const torsoY = 18 + bodyBobY;

  // White shirt body
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 7, torsoY, 15, 16);

  // Black collar
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 3, torsoY, 6, 3.5);

  // Black raglan sleeves
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 9, torsoY, 4, 9); // Left sleeve
  ctx.fillRect(cx + 6, torsoY, 4, 9); // Right sleeve

  // Small blue pocket crest / emblem on left chest
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(cx + 2, torsoY + 5, 3, 3);

  // ==========================================
  // 4. ARMS & HANDS
  // ==========================================
  const skinColor = '#FED7AA'; // Clear warm peach skin
  if (state === 'shout') {
    // "BECAUSE!" dramatic pointing arm forward
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 6, torsoY + 4, 15, 5);
    ctx.fillRect(cx + 19, torsoY + 3, 4, 6);
  } else if (state === 'celebrate') {
    // Victory arms up
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - 10, torsoY - 8, 5, 12);
    ctx.fillRect(cx + 7, torsoY - 8, 5, 12);
    ctx.fillRect(cx - 11, torsoY - 11, 6, 5);
    ctx.fillRect(cx + 7, torsoY - 11, 6, 5);
  } else if (state === 'run') {
    const armSwing = Math.sin(animTimer * 12) * 5;
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 6 + armSwing * 0.4, torsoY + 5, 5, 9);
  } else if (state === 'jump') {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 7, torsoY - 2, 5, 8);
  } else {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 5, torsoY + 7, 4, 6);
  }

  // ==========================================
  // 5. HEAD, FACE & SHORT HAIR (CRYSTAL CLEAR!)
  // ==========================================
  const headX = cx - 1;
  const headY = 11 + bodyBobY;

  // Neck
  ctx.fillStyle = '#FDBA74';
  ctx.fillRect(headX - 3, headY + 5, 6, 4);

  // STEP A: Hair back base (behind head, will NOT cover face)
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  // Spiky hair dome on top and rear of head only
  ctx.roundRect(headX - 9, headY - 10, 18, 11, [6, 6, 0, 4]);
  ctx.fill();

  // Distinct short anime spikes at the crown & back
  ctx.beginPath();
  ctx.moveTo(headX - 8, headY - 10);
  ctx.lineTo(headX - 5, headY - 13);
  ctx.lineTo(headX - 2, headY - 10);

  ctx.moveTo(headX - 3, headY - 10);
  ctx.lineTo(headX, headY - 14);
  ctx.lineTo(headX + 4, headY - 10);

  ctx.moveTo(headX + 3, headY - 10);
  ctx.lineTo(headX + 6, headY - 13);
  ctx.lineTo(headX + 9, headY - 9);
  ctx.fill();

  // STEP B: The Face (Bright, open, completely unblocked!)
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  // Rounded face canvas: width 17, height 13
  ctx.roundRect(headX - 6, headY - 4, 16, 12, [0, 4, 6, 6]);
  ctx.fill();

  // Ear on the back
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(headX - 6, headY + 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // STEP C: Short fringe/bangs at hairline ONLY (Small tufts well above glasses)
  ctx.fillStyle = '#18181B';
  // 3 small neat tufts that stop at headY - 2 (above the glasses!)
  ctx.beginPath();
  ctx.moveTo(headX - 5, headY - 4);
  ctx.lineTo(headX - 3, headY - 1.5);
  ctx.lineTo(headX - 1, headY - 4);

  ctx.moveTo(headX - 1, headY - 4);
  ctx.lineTo(headX + 2, headY - 1);
  ctx.lineTo(headX + 4, headY - 4);

  ctx.moveTo(headX + 4, headY - 4);
  ctx.lineTo(headX + 7, headY - 1.5);
  ctx.lineTo(headX + 9, headY - 4);
  ctx.fill();

  // Subtle hair highlight
  ctx.fillStyle = '#3F3F46';
  ctx.fillRect(headX - 2, headY - 11, 4, 1.5);

  // ==========================================
  // 6. PHƯỚC'S PROMINENT BLACK GLASSES & EYES!
  // ==========================================
  // Bold black glasses frames
  const glassesY = headY; // Perfectly centered on the face!

  // Frame 1: Left lens (viewer left)
  ctx.fillStyle = '#09090B'; // Deep black frame
  ctx.fillRect(headX - 1, glassesY - 1, 5.5, 5.5);
  // Frame 2: Right lens (viewer right)
  ctx.fillRect(headX + 5, glassesY - 1, 5.5, 5.5);

  // Glasses bridge
  ctx.fillRect(headX + 3.5, glassesY, 2, 1.5);
  // Temple arm to ear
  ctx.fillRect(headX - 6, glassesY, 5, 1.5);

  // Clear reflective glass inside lenses
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(headX - 0.2, glassesY - 0.2, 4, 4);
  ctx.fillRect(headX + 5.8, glassesY - 0.2, 4, 4);

  // Big expressive eyes / pupils inside glasses
  ctx.fillStyle = '#09090B';
  ctx.fillRect(headX + 1, glassesY + 0.5, 2.2, 2.5);
  ctx.fillRect(headX + 7, glassesY + 0.5, 2.2, 2.5);

  // White twinkle reflection in eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(headX + 1.2, glassesY + 0.5, 1, 1);
  ctx.fillRect(headX + 7.2, glassesY + 0.5, 1, 1);

  // ==========================================
  // 7. MOUTH & SMILE EXPRESSIONS
  // ==========================================
  if (state === 'shout') {
    // Wide shouting mouth for "BECAUSE!"
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(headX + 4, headY + 6.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // White teeth flash
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(headX + 3, headY + 5, 3, 1.5);
  } else if (state === 'celebrate') {
    // Big cheerful smile
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(headX + 3.5, headY + 5.5, 3, 0, Math.PI);
    ctx.fill();
  } else {
    // Friendly, confident smile
    ctx.fillStyle = '#9A3412';
    ctx.fillRect(headX + 2.5, headY + 5.5, 3.5, 1.5);
  }

  ctx.restore();
}
