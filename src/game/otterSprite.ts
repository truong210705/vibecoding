/**
 * Detailed Pixel Canvas Renderer for Mischievous River Otters (Rái Cá Sông Buông)
 * Designed to match the vibrant 16-bit retro pixel aesthetic of Level 1:
 * - Rich chestnut & cocoa brown fur with pixel highlights
 * - Creamy golden-yellow throat & underbelly
 * - Expressive face with shiny eyes, twitching white whiskers & black button nose
 * - Waving otter tail and running paw gait
 * - Comical cartoon squish with dazed eyes & star sparkles when stomped
 */

export interface OtterRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  state: 'alive' | 'squished' | 'dead';
  squishTimer: number;
  animTimer: number;
  isJumper?: boolean;
}

export function drawOtter(ctx: CanvasRenderingContext2D, opt: OtterRenderOptions) {
  const { x, y, width, height, facing, state, squishTimer, animTimer, isJumper } = opt;

  if (state === 'dead') return;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // If squished: flat cartoon pancake bounce
  if (state === 'squished') {
    const squishFactor = Math.max(0.15, (0.5 - squishTimer) / 0.5);
    ctx.translate(width / 2, height);
    ctx.scale(1.4, 0.35 + squishFactor * 0.1);
    ctx.translate(-width / 2, -height);

    // Flattened otter body
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 6, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 8, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 8, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dazed spiral/X eyes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    // Eye 1: X
    ctx.beginPath();
    ctx.moveTo(width / 2 + 6, height - 12);
    ctx.lineTo(width / 2 + 12, height - 6);
    ctx.moveTo(width / 2 + 12, height - 12);
    ctx.lineTo(width / 2 + 6, height - 6);
    ctx.stroke();

    // Eye 2: X
    ctx.beginPath();
    ctx.moveTo(width / 2 + 15, height - 12);
    ctx.lineTo(width / 2 + 21, height - 6);
    ctx.moveTo(width / 2 + 21, height - 12);
    ctx.lineTo(width / 2 + 15, height - 6);
    ctx.stroke();

    // Little pink tongue sticking out
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(width / 2 + 14, height - 4, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling dizziness stars above head
    const starCycle = (animTimer * 10) % (Math.PI * 2);
    ctx.fillStyle = '#FDE047';
    for (let i = 0; i < 3; i++) {
      const angle = starCycle + (i * Math.PI * 2) / 3;
      const sx = width / 2 + Math.cos(angle) * 16;
      const sy = height - 22 + Math.sin(angle) * 5;
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.fillRect(sx - 1, sy - 3, 2, 6);
      ctx.fillRect(sx - 3, sy - 1, 6, 2);
    }

    ctx.restore();
    return;
  }

  // Facing orientation (sprite is designed facing right)
  if (facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  // Animation walk cycle (0, 1, 2, 3)
  const walkPhase = (animTimer * 10) % (Math.PI * 2);
  const runFrame = Math.floor((animTimer * 12) % 4);
  const bobY = Math.sin(walkPhase * 2) * 1.5;
  const tailSway = Math.sin(walkPhase) * 6;

  // Jump posture if jumping
  const isAirborne = isJumper && opt.y < 420;

  // 1. Otter Tail (Behind body)
  ctx.save();
  ctx.translate(6, 20 + bobY);
  ctx.rotate((-0.2 + tailSway * 0.05));
  // Tail base & taper
  ctx.fillStyle = '#5A2E0E';
  ctx.beginPath();
  ctx.ellipse(-6, 0, 10, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.ellipse(-8, 1, 8, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Tail tip highlight
  ctx.fillStyle = '#92400E';
  ctx.fillRect(-14, 2, 4, 3);
  ctx.restore();

  // 2. Back legs / Paws (Far side)
  ctx.fillStyle = '#451A03';
  const backLegOffset = Math.sin(walkPhase + Math.PI) * 4;
  ctx.fillRect(12 + backLegOffset, 27 + bobY, 6, 8);
  ctx.fillRect(28 - backLegOffset, 27 + bobY, 6, 8);

  // 3. Main Torso Body
  // Darker shadow rim
  ctx.fillStyle = '#451A03';
  ctx.beginPath();
  ctx.ellipse(22, 21 + bobY, 17, 12, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Rich warm brown fur
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.ellipse(22, 20 + bobY, 15, 10, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Fur highlight ridge on back
  ctx.fillStyle = '#92400E';
  ctx.beginPath();
  ctx.ellipse(20, 15 + bobY, 11, 4, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // 4. Golden cream belly & chest (Cute otter patch)
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.ellipse(21, 23 + bobY, 11, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.ellipse(20, 24 + bobY, 8, 4, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // 5. Front Legs / Paws (Near side)
  ctx.fillStyle = '#78350F';
  const frontLegOffset = Math.sin(walkPhase) * 5;
  // Rear near leg
  ctx.fillRect(15 - frontLegOffset, 27 + bobY, 6, 8);
  ctx.fillStyle = '#451A03';
  ctx.fillRect(14 - frontLegOffset, 33 + bobY, 7, 3); // Paw toe pads

  // Front near leg
  ctx.fillStyle = '#78350F';
  ctx.fillRect(29 + frontLegOffset, 27 + bobY, 6, 8);
  ctx.fillStyle = '#451A03';
  ctx.fillRect(29 + frontLegOffset, 33 + bobY, 7, 3); // Paw toe pads

  // 6. Cute Otter Head
  const headBob = bobY * 0.7;
  // Head shadow base
  ctx.fillStyle = '#451A03';
  ctx.beginPath();
  ctx.arc(33, 14 + headBob, 11, 0, Math.PI * 2);
  ctx.fill();

  // Head main fur
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(33, 13 + headBob, 10, 0, Math.PI * 2);
  ctx.fill();

  // Head top highlight
  ctx.fillStyle = '#92400E';
  ctx.beginPath();
  ctx.arc(32, 8 + headBob, 6, 0, Math.PI * 2);
  ctx.fill();

  // Cream muzzle / cheek pouch
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.ellipse(37, 16 + headBob, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Round little ear
  ctx.fillStyle = '#451A03';
  ctx.beginPath();
  ctx.arc(28, 6 + headBob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F472B6'; // Pink inner ear
  ctx.beginPath();
  ctx.arc(28, 6 + headBob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Black button nose
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(41, 14 + headBob, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Nose shine
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(41, 13 + headBob, 1, 1);

  // Big sparkling dark eye
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(35, 11 + headBob, 2.8, 0, Math.PI * 2);
  ctx.fill();
  // Eye sparkle pixel
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(35, 10 + headBob, 1.5, 1.5);
  ctx.fillRect(37, 12 + headBob, 0.8, 0.8);

  // Cute white whiskers
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Upper whisker
  ctx.moveTo(39, 15 + headBob);
  ctx.lineTo(47, 14 + headBob);
  // Middle whisker
  ctx.moveTo(39, 16 + headBob);
  ctx.lineTo(48, 17 + headBob);
  // Lower whisker
  ctx.moveTo(39, 17 + headBob);
  ctx.lineTo(46, 20 + headBob);
  ctx.stroke();

  // Cute playful leaf or water drop on head for jumpers
  if (isJumper) {
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(31, 4 + headBob, 3, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
