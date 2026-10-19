/**
 * Canvas 2D Game Engine for Hành Trình Phước
 * High-performance 60fps physics, zero-lag input, robust collision detection,
 * and character model matching the user's reference sprite sheet.
 */

import {
  Player,
  Boss,
  EnemyOtter,
  Projectile,
  BossAttack,
  Collectible,
  Platform,
  Particle,
  LevelData,
  BossStoryEvent,
  AttackBecauseOptions,
  MobileAimMode,
} from '../types/game';
import { sounds } from '../audio/soundEffects';
import { drawPhuoc } from './phuocSprite';
import { drawOtter } from './otterSprite';
import { Level1Scenery } from './level1Scenery';
import { Level2Scenery } from './level2Scenery';
import { Level4Scenery } from './level4Scenery';
import { Level3Scenery } from './level3Scenery';
import { drawCsgtBoss } from './bossCsgtSprite';
import {
  getVerticalGradient,
  clearGradientCache,
  buildOverlayLayer,
  drawContactShadow,
  inView,
} from './renderUtils';
import { drawBaHoLongBoss } from './bossBaHoLongSprite';

export interface EngineCallbacks {
  onLevelComplete: (nextLevelId: number) => void;
  onVictory: () => void;
  onGameOver: (reason?: string) => void;
  onScoreUpdate: (score: number, coins: number, health: number) => void;
  onBossHealthUpdate?: (hp: number, maxHp: number, bossName?: string) => void;
  onTimeUpdate?: (timeLeft: number) => void;
  onCooldownUpdate?: (cooldownRemaining: number, maxCooldown: number) => void;
  onBossStoryEvent?: (event: BossStoryEvent) => void;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  public level: LevelData;
  public player: Player;
  public boss: Boss | null = null;
  public enemies: EnemyOtter[] = [];
  public collectibles: Collectible[] = [];
  public platforms: Platform[] = [];
  public projectiles: Projectile[] = [];
  public bossAttacks: BossAttack[] = [];
  public particles: Particle[] = [];

  // Countdown timer for level
  public timeLeft = 120;
  private lastReportedTime = -1;

  // Attack cooldown constraint tracking (Phước 2.5s cooldown)
  public readonly maxAttackCooldown = 2.5;
  private lastReportedCooldown = -1;

  // Safe ground checkpoint coordinates for pitfall recovery
  private lastSafeGroundedX = 80;
  private lastSafeGroundedY = 448;

  // Cached callback state to avoid unnecessary React re-renders
  private lastReportedScore = -1;
  private lastReportedCoins = -1;
  private lastReportedHealth = -1;
  private lastReportedBossHp = -1;

  // Camera viewport
  public cameraX = 0;
  public cameraY = 0;
  public viewportWidth = 960;
  public viewportHeight = 540;

  // Input states
  private keysHeld: Record<string, boolean> = {};
  private jumpBuffered = false;

  // Game loop & simulation
  private animFrameId: number | null = null;
  private lastTime = 0;
  public isRunning = false;
  public isPaused = false;

  // Stats
  public score = 0;
  public coins = 0;
  public becauseShoutsCount = 0;

  // Screen shake
  private screenShake = 0;

  // Background river waves timer
  private riverTimer = 0;

  // ---- HiDPI / adaptive resolution ----
  // Game logic always runs in a fixed 960x540 "logical" space. The backing
  // store is sized to the real on-screen size * devicePixelRatio, so sprites
  // are rendered crisp instead of being up-scaled (blurry) by CSS.
  private renderScale = 1;
  private overlayLayer: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly maxBackingWidth = 1920;
  private readonly maxParticles = 160;
  private lastBackingW = 0;
  private lastBackingH = 0;

  // Aim Trajectory preview (for mobile drag-to-aim)
  public aimTrajectory: { active: boolean; angle: number } | null = null;
  // Tap-to-aim visual effect on canvas
  public tapTargetEffect: { x: number; y: number; life: number; maxLife: number } | null = null;

  public setAimTrajectory(angleRad: number, active: boolean) {
    if (!active) {
      this.aimTrajectory = null;
    } else {
      this.aimTrajectory = { active: true, angle: angleRad };
    }
  }

  public triggerTapTargetEffect(x: number, y: number) {
    this.tapTargetEffect = { x, y, life: 0.35, maxLife: 0.35 };
  }

  constructor(canvas: HTMLCanvasElement, level: LevelData, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;
    this.level = level;

    this.player = this.createInitialPlayer(level.spawnPoint.x, level.spawnPoint.y);
    this.initLevel(level);

    clearGradientCache();
    this.updateResolution();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateResolution());
      this.resizeObserver.observe(canvas);
    }
  }

  /**
   * Resize the canvas backing store to match its on-screen size (HiDPI aware)
   * while keeping logical game coordinates at viewportWidth x viewportHeight.
   */
  public updateResolution() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const aspect = this.viewportWidth / this.viewportHeight;
    // canvas uses object-fit: contain, so the visible picture is letter-boxed
    const contentW = Math.min(rect.width, rect.height * aspect);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let pxW = Math.round(contentW * dpr);
    pxW = Math.max(this.viewportWidth, Math.min(pxW, this.maxBackingWidth));
    const pxH = Math.round(pxW / aspect);

    if (pxW === this.lastBackingW && pxH === this.lastBackingH) return;
    this.lastBackingW = pxW;
    this.lastBackingH = pxH;

    this.canvas.width = pxW;
    this.canvas.height = pxH;
    this.renderScale = pxW / this.viewportWidth;
    this.overlayLayer = buildOverlayLayer(pxW, pxH, this.level.id);
    // Setting width/height resets context state
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /** Converts a client (pointer) position to logical game coordinates. */
  public clientToLogical(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = this.viewportWidth / this.viewportHeight;
    const contentW = Math.min(rect.width, rect.height * aspect);
    const contentH = contentW / aspect;
    const offX = rect.left + (rect.width - contentW) / 2;
    const offY = rect.top + (rect.height - contentH) / 2;
    const x = Math.max(0, Math.min(1, (clientX - offX) / contentW)) * this.viewportWidth;
    const y = Math.max(0, Math.min(1, (clientY - offY) / contentH)) * this.viewportHeight;
    return { x, y };
  }

  private createInitialPlayer(x: number, y: number): Player {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      width: 34,
      height: 50,
      facing: 'right',
      isGrounded: false,
      health: 3,
      maxHealth: 3,
      invulnerableTimer: 0,
      attackCooldown: 0,
      isAttacking: false,
      speechShoutTimer: 0,
      state: 'idle',
      animTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      mobileJumpSustainTimer: 0,
    };
  }

  public initLevel(level: LevelData) {
    this.level = level;
    if (this.lastBackingW > 0) {
      this.overlayLayer = buildOverlayLayer(this.lastBackingW, this.lastBackingH, level.id);
    }
    this.platforms = structuredClone(level.platforms);
    this.enemies = structuredClone(level.enemies);
    this.collectibles = structuredClone(level.collectibles);
    this.boss = level.boss ? structuredClone(level.boss) : null;

    this.projectiles = [];
    this.bossAttacks = [];
    this.particles = [];
    this.player.x = level.spawnPoint.x;
    this.player.y = level.spawnPoint.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.cameraX = 0;
    this.lastSafeGroundedX = level.spawnPoint.x;
    this.lastSafeGroundedY = level.spawnPoint.y;

    // Initialize Countdown Timer for Level
    this.timeLeft = level.timeLimit || 100;
    this.lastReportedTime = -1;
    this.player.attackCooldown = 0;
    this.lastReportedCooldown = -1;

    this.lastReportedScore = -1;
    this.lastReportedCoins = -1;
    this.lastReportedHealth = -1;
    this.lastReportedBossHp = -1;

    if (this.boss && this.callbacks.onBossHealthUpdate) {
      const bossName = this.boss.bossType === 'baholong' ? 'Bá Hộ Long' : 'Công an';
      this.callbacks.onBossHealthUpdate(this.boss.health, this.boss.maxHealth, bossName);
    }
    if (this.callbacks.onTimeUpdate) {
      this.callbacks.onTimeUpdate(Math.ceil(this.timeLeft));
    }
    if (this.callbacks.onCooldownUpdate) {
      this.callbacks.onCooldownUpdate(0, this.maxAttackCooldown);
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sounds.startBgm(this.level.id);

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      const rawDt = (currentTime - this.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.04); // clamp dt
      this.lastTime = currentTime;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sounds.stopBgm();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  // Instant responsive input handling
  public handleKeyDown(code: string) {
    this.keysHeld[code] = true;
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      this.performJump();
    }
    if (code === 'KeyF') {
      this.triggerBecauseAttack();
    }
  }

  public handleKeyUp(code: string) {
    this.keysHeld[code] = false;
  }

  public performJump(fromMobile: boolean = false) {
    const p = this.player;
    if (p.isGrounded || p.coyoteTimer > 0) {
      p.vy = -12.0;
      p.isGrounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      this.jumpBuffered = false;
      if (fromMobile) {
        this.keysHeld['Space'] = true;
        p.mobileJumpSustainTimer = 0.32;
      }
      sounds.playJump();
      this.spawnJumpDust();
    } else {
      // Buffer jump for responsive landing leap
      this.jumpBuffered = true;
      p.jumpBufferTimer = 0.18;
    }
  }

  public handleCanvasClick(targetX?: number, targetY?: number) {
    if (this.level.hasSpeechAttack) {
      if (targetX !== undefined && targetY !== undefined) {
        this.triggerTapTargetEffect(targetX, targetY);
        this.triggerBecauseAttack({ targetX, targetY });
      } else {
        this.triggerBecauseAttack();
      }
    }
  }

  public triggerBecauseAttack(optionsOrTargetX?: number | AttackBecauseOptions, maybeTargetY?: number) {
    if (!this.level.hasSpeechAttack) return;
    if (this.player.attackCooldown > 0) {
      // Play tactile click indicating recharge constraint
      sounds.playCooldownClick();
      return;
    }

    // Exact 2.5-second recharge constraint as requested by the user:
    // "thời gian mỗi lần tung chiêu because là 2.5 giây"
    this.player.attackCooldown = 2.5;
    this.player.speechShoutTimer = 0.35;
    this.player.isAttacking = true;
    this.becauseShoutsCount++;

    sounds.playBecauseAttack();

    // Chiêu because chỉ hiện "BECAUSE!" thôi không sửa thành bởi vì hay lí lẽ
    const chosenPhrase = 'BECAUSE!';

    let targetX: number | undefined;
    let targetY: number | undefined;
    let mode: MobileAimMode = 'auto';
    let customAngleRad: number | undefined;

    if (typeof optionsOrTargetX === 'object' && optionsOrTargetX !== null) {
      targetX = optionsOrTargetX.targetX;
      targetY = optionsOrTargetX.targetY;
      mode = optionsOrTargetX.mode || 'auto';
      customAngleRad = optionsOrTargetX.customAngleRad;
    } else if (typeof optionsOrTargetX === 'number') {
      targetX = optionsOrTargetX;
      targetY = maybeTargetY;
    }

    let vx = this.player.facing === 'right' ? 14 : -14;
    let vy = -1;

    // 1. Direct screen tap / click coordinates
    if (targetX !== undefined && targetY !== undefined) {
      const worldTargetX = targetX + this.cameraX;
      const worldTargetY = targetY + this.cameraY;
      const dx = worldTargetX - (this.player.x + this.player.width / 2);
      const dy = worldTargetY - (this.player.y + 16);
      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        vx = (dx / mag) * 14;
        vy = (dy / mag) * 14;
      }
    }
    // 2. Drag angle from mobile joystick
    else if (customAngleRad !== undefined) {
      vx = Math.cos(customAngleRad) * 14;
      vy = Math.sin(customAngleRad) * 14;
    }
    // 3. Preset aim modes
    else if (mode === 'up') {
      vx = 0;
      vy = -14;
    } else if (mode === 'diagonal') {
      const dirX = this.player.facing === 'right' ? 1 : -1;
      vx = dirX * 14 * 0.7071;
      vy = -14 * 0.7071;
    } else if (mode === 'straight') {
      const dirX = this.player.facing === 'right' ? 1 : -1;
      vx = dirX * 14;
      vy = -1;
    }
    // 4. Auto-Aim (Default smart lock onto Boss or nearest enemy)
    else {
      let lockedTarget = false;
      if (this.boss && this.boss.state !== 'defeated') {
        const distToBoss = Math.abs(this.boss.x - this.player.x);
        if (distToBoss < 850) {
          const bCenterX = this.boss.x + this.boss.width / 2;
          const bCenterY = this.boss.y + this.boss.height * 0.45;
          const pCenterX = this.player.x + this.player.width / 2;
          const pCenterY = this.player.y + 16;
          const dx = bCenterX - pCenterX;
          const dy = bCenterY - pCenterY;
          const mag = Math.hypot(dx, dy);
          if (mag > 0) {
            vx = (dx / mag) * 14;
            vy = (dy / mag) * 14;
            lockedTarget = true;
          }
        }
      }

      if (!lockedTarget) {
        const aliveEnemies = this.enemies.filter(
          (e) => e.state === 'alive' && Math.abs(e.x - this.player.x) < 550
        );
        if (aliveEnemies.length > 0) {
          aliveEnemies.sort(
            (a, b) =>
              Math.hypot(a.x - this.player.x, a.y - this.player.y) -
              Math.hypot(b.x - this.player.x, b.y - this.player.y)
          );
          const e = aliveEnemies[0];
          const eCenterX = e.x + e.width / 2;
          const eCenterY = e.y + e.height / 2;
          const pCenterX = this.player.x + this.player.width / 2;
          const pCenterY = this.player.y + 16;
          const dx = eCenterX - pCenterX;
          const dy = eCenterY - pCenterY;
          const mag = Math.hypot(dx, dy);
          if (mag > 0) {
            vx = (dx / mag) * 14;
            vy = (dy / mag) * 14;
            lockedTarget = true;
          }
        }
      }

      if (!lockedTarget) {
        const dirX = this.player.facing === 'right' ? 1 : -1;
        vx = dirX * 14;
        vy = -1;
      }
    }

    // Auto-update facing direction so Phước faces where he shouts!
    if (vx > 0.5) {
      this.player.facing = 'right';
    } else if (vx < -0.5) {
      this.player.facing = 'left';
    }

    const startX = this.player.facing === 'right' ? this.player.x + this.player.width + 4 : this.player.x - 24;
    const startY = this.player.y + 12;

    this.projectiles.push({
      id: Math.random().toString(),
      x: startX,
      y: startY,
      vx,
      vy,
      text: chosenPhrase,
      size: 18,
      color: '#FACC15',
      life: 1.2,
      maxLife: 1.2,
      isFromPlayer: true,
      rotation: (Math.random() - 0.5) * 0.15,
      scale: 0.85,
    });

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 4 + vx * 0.15,
        vy: (Math.random() - 0.5) * 4 + vy * 0.15,
        size: Math.random() * 4 + 2,
        color: '#FEF08A',
        alpha: 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'star',
      });
    }
  }

  private spawnJumpDust() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        size: Math.random() * 4 + 2,
        color: '#E4E4E7',
        alpha: 0.8,
        life: 0.28,
        maxLife: 0.28,
        shape: 'circle',
      });
    }
  }

  // Main simulation update
  private update(dt: number) {
    this.riverTimer += dt;
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 10);
    }

    // Level Time Countdown
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const roundedTime = Math.ceil(this.timeLeft);
    if (this.callbacks.onTimeUpdate && roundedTime !== this.lastReportedTime) {
      this.lastReportedTime = roundedTime;
      this.callbacks.onTimeUpdate(roundedTime);
    }

    if (this.timeLeft <= 0) {
      sounds.playGameOver();
      this.callbacks.onGameOver('Hết thời gian! Hãy di chuyển nhanh hơn để kịp cứu Trúc!');
      return;
    }

    this.updatePlayer(dt);
    this.updatePlatforms(dt);
    this.updateEnemies(dt);

    if (this.boss) {
      this.updateBoss(dt);
    }

    this.updateProjectiles(dt);
    this.updateCollectibles();
    this.updateParticles(dt);
    if (this.tapTargetEffect) {
      this.tapTargetEffect.life -= dt;
      if (this.tapTargetEffect.life <= 0) {
        this.tapTargetEffect = null;
      }
    }
    this.updateCamera(dt);
    this.checkLevelGoal();

    // Attack cooldown reporting for HUD
    if (this.callbacks.onCooldownUpdate) {
      const remaining = Math.max(0, this.player.attackCooldown);
      if (Math.abs(remaining - this.lastReportedCooldown) > 0.1 || remaining === 0) {
        this.lastReportedCooldown = remaining;
        this.callbacks.onCooldownUpdate(remaining, this.maxAttackCooldown);
      }
    }

    // Notify React only when values actually change (stops full re-renders!)
    if (
      this.score !== this.lastReportedScore ||
      this.coins !== this.lastReportedCoins ||
      this.player.health !== this.lastReportedHealth
    ) {
      this.lastReportedScore = this.score;
      this.lastReportedCoins = this.coins;
      this.lastReportedHealth = this.player.health;
      this.callbacks.onScoreUpdate(this.score, this.coins, this.player.health);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.speechShoutTimer > 0) {
      p.speechShoutTimer -= dt;
      if (p.speechShoutTimer <= 0) p.isAttacking = false;
    }
    if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer -= dt;
      if (p.jumpBufferTimer <= 0) this.jumpBuffered = false;
    }
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;

    p.animTimer += dt;

    // Buffered jump execution upon touching ground
    if ((this.jumpBuffered || p.jumpBufferTimer > 0) && p.isGrounded) {
      this.performJump();
    }

    // Horizontal Movement
    const moveLeft = this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft'];
    const moveRight = this.keysHeld['KeyD'] || this.keysHeld['ArrowRight'];

    const ACCEL = 32;
    const MAX_SPEED = 5.4;
    const FRICTION = p.isGrounded ? 22 : 8;

    if (moveLeft && !moveRight) {
      p.vx = Math.max(p.vx - ACCEL * dt, -MAX_SPEED);
      p.facing = 'left';
    } else if (moveRight && !moveLeft) {
      p.vx = Math.min(p.vx + ACCEL * dt, MAX_SPEED);
      p.facing = 'right';
    } else {
      if (p.vx > 0) {
        p.vx = Math.max(0, p.vx - FRICTION * dt);
      } else if (p.vx < 0) {
        p.vx = Math.min(0, p.vx + FRICTION * dt);
      }
    }

    // Gravity (clamped fall speed to prevent platform tunneling)
    const GRAVITY = 28;
    p.vy += GRAVITY * dt;
    if (p.vy > 12) p.vy = 12;

    // Mobile jump sustain timer decrement
    if (p.mobileJumpSustainTimer !== undefined && p.mobileJumpSustainTimer > 0) {
      p.mobileJumpSustainTimer -= dt;
      if (p.mobileJumpSustainTimer <= 0) {
        if (!this.keysHeld['Space'] && !this.keysHeld['KeyW'] && !this.keysHeld['ArrowUp']) {
          p.mobileJumpSustainTimer = 0;
        }
      }
    }

    // Variable jump height - sustains full peak height matching computer
    const jumpHeld =
      this.keysHeld['Space'] ||
      this.keysHeld['KeyW'] ||
      this.keysHeld['ArrowUp'] ||
      (p.mobileJumpSustainTimer !== undefined && p.mobileJumpSustainTimer > 0);

    if (!jumpHeld && p.vy < -4) {
      p.vy *= 0.65;
    }

    // 1. Move X and check side blocking
    p.x += p.vx * 60 * dt;
    this.checkHorizontalPlatformCollisions(p);

    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (p.x + p.width > this.level.width) {
      p.x = this.level.width - p.width;
      p.vx = 0;
    }

    // 2. Move Y with precise swept landing logic (Solves T2 floor drop bug!)
    const prevY = p.y;
    const wasGrounded = p.isGrounded;
    p.y += p.vy * 60 * dt;

    if (p.vy >= 0) {
      // Falling down or standing: check top landing (Mario one-way landing)
      let landed = false;
      const prevBottom = prevY + p.height;
      const currentBottom = p.y + p.height;

      for (const plat of this.platforms) {
        // Horizontal overlap
        const overlapsX = p.x + p.width > plat.x + 2 && p.x < plat.x + plat.width - 2;
        if (!overlapsX) continue;

        // Feet crossed platform top surface from above
        if (prevBottom <= plat.y + 16 && currentBottom >= plat.y) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          landed = true;

          // Carry along moving platforms
          if (plat.isMoving && plat.speed && plat.direction) {
            p.x += plat.speed * plat.direction * 60 * dt;
          }

          // Record safe recovery point
          if (plat.type === 'ground' || plat.type === 'bridge_wood') {
            this.lastSafeGroundedX = p.x;
            this.lastSafeGroundedY = p.y;
          }
          break;
        }
      }

      if (!landed) {
        p.isGrounded = false;
      }
    } else {
      // Rising upwards (JUMPING):
      // Mario-style one-way platforms: Never block head from underneath! Pass through freely!
      p.isGrounded = false;
    }

    // Coyote time trigger when stepping off a ledge
    if (wasGrounded && !p.isGrounded && p.vy >= 0) {
      p.coyoteTimer = 0.12;
    }

    // Determine visual animation state
    if (p.speechShoutTimer > 0) {
      p.state = 'shout';
    } else if (!p.isGrounded) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.4) {
      p.state = 'run';
    } else {
      p.state = 'idle';
    }

    // Water pitfall in Sông Buông: safe recovery
    if (p.y > 530) {
      this.handleWaterPitfall();
    }
  }

  private checkHorizontalPlatformCollisions(p: Player) {
    for (const plat of this.platforms) {
      // Only block against ground barricades/walls, never elevated platform steps
      if (plat.type === 'barricade') {
        if (
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          p.y + p.height > plat.y + 12 &&
          p.y < plat.y + plat.height - 4
        ) {
          if (p.vx > 0) {
            p.x = plat.x - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.width;
            p.vx = 0;
          }
        }
      }
    }
  }

  private handleWaterPitfall() {
    const p = this.player;
    p.health--;
    sounds.playPlayerHurt();
    this.screenShake = 1.0;

    if (p.health <= 0) {
      sounds.playGameOver();
      this.callbacks.onGameOver();
      return;
    }

    // Safely respawn at the last verified solid ground platform
    p.x = this.lastSafeGroundedX;
    p.y = this.lastSafeGroundedY;
    p.vx = 0;
    p.vy = 0;
    p.isGrounded = true;
    p.invulnerableTimer = 1.6;
  }

  private updatePlatforms(dt: number) {
    for (const plat of this.platforms) {
      if (plat.isMoving && plat.speed && plat.direction && plat.minX !== undefined && plat.maxX !== undefined) {
        plat.x += plat.speed * plat.direction * 60 * dt;
        if (plat.x <= plat.minX) {
          plat.x = plat.minX;
          plat.direction = 1;
        } else if (plat.x + plat.width >= plat.maxX) {
          plat.x = plat.maxX - plat.width;
          plat.direction = -1;
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    for (const otter of this.enemies) {
      if (otter.state === 'squished') {
        otter.squishTimer -= dt;
        if (otter.squishTimer <= 0) {
          otter.state = 'dead';
        }
        continue;
      }
      if (otter.state === 'dead') continue;

      otter.animTimer += dt;

      if (otter.isJumper) {
        otter.jumpTimer = (otter.jumpTimer || 0) + dt;
        if (otter.jumpTimer > 2.2) {
          otter.vy = -6.5;
          otter.jumpTimer = 0;
        }
        otter.vy += 20 * dt;
        otter.y += otter.vy * 60 * dt;
        if (otter.y > 450) {
          otter.y = 450;
          otter.vy = 0;
        }
      }

      otter.x += otter.vx * 60 * dt;
      if (Math.abs(otter.x - otter.startX) > otter.patrolDistance) {
        otter.vx *= -1;
        otter.facing = otter.vx > 0 ? 'right' : 'left';
      }

      // Player stomp or hurt
      const p = this.player;
      if (
        p.x + p.width > otter.x + 4 &&
        p.x < otter.x + otter.width - 4 &&
        p.y + p.height > otter.y + 4 &&
        p.y < otter.y + otter.height
      ) {
        const isStomp = p.vy > 0 && p.y + p.height <= otter.y + 20;
        if (isStomp) {
          otter.state = 'squished';
          otter.squishTimer = 0.35;
          p.vy = this.keysHeld['Space'] || this.keysHeld['KeyW'] ? -11.5 : -8.5;
          sounds.playStomp();
          this.score += 150;

          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: otter.x + otter.width / 2,
              y: otter.y,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 4 - 2,
              size: Math.random() * 5 + 3,
              color: '#38BDF8',
              alpha: 1,
              life: 0.45,
              maxLife: 0.45,
              shape: 'splash',
            });
            this.particles.push({
              x: otter.x + otter.width / 2,
              y: otter.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              size: Math.random() * 5 + 2,
              color: '#FBBF24',
              alpha: 1,
              life: 0.35,
              maxLife: 0.35,
              shape: 'star',
            });
          }
        } else {
          if (p.invulnerableTimer <= 0) {
            this.handlePlayerDamage();
          }
        }
      }
    }
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (!b) return;

    b.animTimer += dt;
    if (b.invulnerableTimer > 0) b.invulnerableTimer -= dt;
    if (b.dialogueBubble) {
      b.dialogueBubble.timer -= dt;
      if (b.dialogueBubble.timer <= 0) b.dialogueBubble = undefined;
    }

    if (b.state === 'defeated') return;

    if (b.state === 'stunned') {
      b.stunTimer -= dt;
      if (b.stunTimer <= 0) {
        b.state = 'idle';
        b.isShootingGun = false;
        b.phaseTimer = 0.9;
      }
      return;
    }

    if (b.isShootingGun && b.gunShootTimer !== undefined) {
      b.gunShootTimer -= dt;
      if (b.gunShootTimer <= 0) {
        b.isShootingGun = false;
      }
    }

    b.phaseTimer -= dt;
    b.attackCooldown -= dt;

    const p = this.player;
    b.facing = p.x < b.x ? 'left' : 'right';

    if (b.phaseTimer <= 0) {
      if (b.bossType === 'baholong') {
        const rand = Math.random();
        if (rand < 0.38) {
          // Dice Throw Volley (Vũ khí xúc xắc ném dồn dập)
          this.executeBaHoLongDiceAttack();
        } else if (rand < 0.74) {
          // Chiêu ném tiền đô la & xấp tiền của Bá Hộ Long
          this.executeBaHoLongMoneyAttack();
        } else if (rand < 0.90) {
          b.state = 'jump_slam';
          b.phaseTimer = 1.8;
          b.vy = -10.5;
        } else {
          b.state = 'whistle_attack';
          b.phaseTimer = 1.4;
          this.executeBaHoLongTaunt();
        }
      } else {
        // Boss CSGT: Gun shooting attack, Whistle wave, Citation ticket, Jump slam
        const rand = Math.random();
        if (rand < 0.35) {
          // GUN SHOOTING ATTACK!
          b.state = 'gun_attack';
          b.isShootingGun = true;
          b.gunShootTimer = 1.2;
          b.phaseTimer = 1.7;
          this.executeBossGunAttack();
        } else if (rand < 0.62) {
          b.state = 'whistle_attack';
          b.phaseTimer = 1.4;
          this.executeBossWhistleAttack();
        } else if (rand < 0.82) {
          b.state = 'citation_attack';
          b.phaseTimer = 1.5;
          this.executeBossCitationAttack();
        } else {
          b.state = 'jump_slam';
          b.phaseTimer = 1.8;
          b.vy = -10;
        }
      }
    }

    if (b.state === 'jump_slam') {
      b.vy += 24 * dt;
      b.y += b.vy * 60 * dt;
      b.x += (b.facing === 'left' ? -2.2 : 2.2) * 60 * dt;

      if (b.y >= (b.bossType === 'baholong' ? 365 : 404)) {
        b.y = b.bossType === 'baholong' ? 365 : 404;
        b.vy = 0;
        b.state = 'idle';
        this.screenShake = 1.0;
        sounds.playBossHurt();

        const shockType = b.bossType === 'baholong' ? 'cane_shock' : 'ground_shock';
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: b.x - 20,
          y: 470,
          vx: -6.5,
          vy: 0,
          type: shockType,
          width: 24,
          height: 24,
          life: 1.6,
        });
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: b.x + b.width + 10,
          y: 470,
          vx: 6.5,
          vy: 0,
          type: shockType,
          width: 24,
          height: 24,
          life: 1.6,
        });
      }
    } else if (b.state === 'idle') {
      b.x += (b.facing === 'left' ? -1.3 : 1.3) * 60 * dt;
      if (b.x < 720) b.x = 720;
      if (b.x > 1880) b.x = 1880;
    }

    if (
      p.invulnerableTimer <= 0 &&
      p.x + p.width > b.x + 8 &&
      p.x < b.x + b.width - 8 &&
      p.y + p.height > b.y + 8 &&
      p.y < b.y + b.height
    ) {
      this.handlePlayerDamage();
    }
  }

  /**
   * Final Boss Bá Hộ Long Specialty Attack: Throwing Pairs of Rolling Dice
   * Spaced exactly 0.3s apart, each throw flings 2 dice with randomized trajectories!
   */
  private executeBaHoLongDiceAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'dice_throw';
    b.phaseTimer = 2.6;

    const taunts = [
      'XÚC XẮC ĐỊNH MỆNH! ĐỠ LẤY PHƯỚC!',
      'NÉ THỬ CẶP XÚC XẮC NÀY XEM!',
      'TAO SẼ DÙNG XÚC XẮC ĐÈ BẸP MÀY!',
    ];
    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    // 4 bursts, each precisely 0.3s (300ms) apart!
    const bursts = [0, 300, 600, 900];
    bursts.forEach((delay, burstIdx) => {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;

        sounds.playDiceThrow();
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 24;

        // Dice 1: random high or mid-arc
        const angle1 = -0.25 - Math.random() * 0.55;
        const speed1 = 5.6 + Math.random() * 3.6;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: spawnX,
          y: spawnY,
          vx: dir * Math.cos(angle1) * speed1,
          vy: Math.sin(angle1) * speed1,
          type: 'dice_shot',
          width: 24,
          height: 24,
          life: 3.5,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 16,
          bounceCount: 0,
          pipNumber: Math.floor(Math.random() * 6) + 1,
        });

        // Dice 2: distinct trajectory (faster ground roll or steep arc)
        const angle2 = -0.15 - Math.random() * 0.7;
        const speed2 = 4.8 + Math.random() * 4.2;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: spawnX,
          y: spawnY - 6,
          vx: dir * Math.cos(angle2) * speed2,
          vy: Math.sin(angle2) * speed2,
          type: 'dice_shot',
          width: 24,
          height: 24,
          life: 3.5,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 20,
          bounceCount: 0,
          pipNumber: Math.floor(Math.random() * 6) + 1,
        });

        if (burstIdx === 0) {
          this.screenShake = 0.5;
        }
      }, delay);
    });
  }

  /**
   * Bá Hộ Long Money Throw Attack (Ném xấp tiền đô la $100 & lốc xoáy tiền mặt)
   */
  private executeBaHoLongMoneyAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'money_throw';
    b.phaseTimer = 2.4;

    const taunts = [
      'TIỀN NÀY! CẦM LẤY RỒI BIẾN KHỎI SÀI GÒN!',
      'TAO KHÔNG THIẾU TIỀN! ĐỠ LẤY BÃO ĐÔ LA NÀY!',
      'BÃO TIỀN ĐÔ ĐÂY! ĐỠ ĐƯỢC KHÔNG PHƯỚC?!',
      'XÈNG ĐÂU MÀ ĐẤU LẠI TIỀN CỦA TAO?!',
    ];
    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    // 3 waves of flying $100 bills and strapped cash stacks
    const waves = [0, 280, 560];
    waves.forEach((delay, waveIdx) => {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;

        sounds.playMoneyThrow();
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 28;

        // Fling 3 bills in a spreading fan trajectory
        for (let i = 0; i < 3; i++) {
          const angle = -0.12 - (i * 0.16) + (Math.random() - 0.5) * 0.08;
          const speed = 5.2 + i * 1.3 + Math.random() * 1.2;
          const isStack = i === 1 && waveIdx === 1;

          this.bossAttacks.push({
            id: Math.random().toString(),
            x: spawnX,
            y: spawnY + i * 5,
            vx: dir * Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: isStack ? 'money_stack' : 'dollar_bill',
            width: isStack ? 32 : 28,
            height: isStack ? 18 : 14,
            life: 3.2,
            rotation: Math.random() * Math.PI,
            rotationSpeed: dir * (5 + Math.random() * 6),
          });
        }

        // Green money sparkles
        for (let p = 0; p < 4; p++) {
          this.particles.push({
            x: spawnX,
            y: spawnY,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3,
            size: Math.random() * 3 + 2,
            color: '#4ADE80',
            alpha: 1,
            life: 0.35,
            maxLife: 0.35,
            shape: 'star',
          });
        }

        if (waveIdx === 0) {
          this.screenShake = 0.4;
        }
      }, delay);
    });
  }

  /**
   * CSGT Gun Shooting Attack (Súng lục bắn đạn liên thanh tốc độ cao)
   */
  private executeBossGunAttack() {
    if (!this.boss) return;
    const dir = this.boss.facing === 'left' ? -1 : 1;
    this.boss.dialogueBubble = {
      text: 'ĐỨNG LẠI! GIƠ TAY LÊN!',
      timer: 1.6,
    };

    // First bullet fired after quick aim (0.3s)
    setTimeout(() => {
      if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated') return;
      sounds.playGunshot();
      this.screenShake = 0.6;

      this.bossAttacks.push({
        id: Math.random().toString(),
        x: this.boss.x + (dir === 1 ? this.boss.width + 12 : -12),
        y: this.boss.y + 36,
        vx: dir * 11.0,
        vy: 0,
        type: 'bullet_shot',
        width: 22,
        height: 10,
        life: 2.5,
      });

      // Second burst bullet (0.24s later)
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated') return;
        sounds.playGunshot();
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width + 12 : -12),
          y: this.boss.y + 36,
          vx: dir * 11.5,
          vy: (Math.random() - 0.5) * 1.8,
          type: 'bullet_shot',
          width: 22,
          height: 10,
          life: 2.5,
        });
      }, 240);
    }, 320);
  }

  private executeBossWhistleAttack() {
    if (!this.boss) return;
    sounds.playBossWhistle();
    const dir = this.boss.facing === 'left' ? -1 : 1;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated') return;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width : 0),
          y: this.boss.y + 24,
          vx: dir * (5.5 + i * 1.6),
          vy: (i - 1) * 1.2,
          type: 'whistle_wave',
          width: 28,
          height: 28,
          life: 2.2,
        });
      }, i * 180);
    }
  }

  private executeBossCitationAttack() {
    if (!this.boss) return;
    const dir = this.boss.facing === 'left' ? -1 : 1;

    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated') return;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width : 0),
          y: this.boss.y + 30,
          vx: dir * 7.0,
          vy: -2 + i * 3,
          type: 'citation_paper',
          width: 22,
          height: 28,
          life: 2.4,
          rotation: 0,
        });
      }, i * 220);
    }
  }

  private executeBaHoLongTaunt() {
    if (!this.boss) return;
    const lines = [
      'Trúc là của tao! Mày nghèo đừng mơ!',
      'Mày chỉ có set son 500k mà đòi đú!',
      'Tao giàu nứt đố đổ vách, mày có gì?!',
    ];
    this.boss.dialogueBubble = {
      text: lines[Math.floor(Math.random() * lines.length)],
      timer: 1.8,
    };
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * 60 * dt;
      proj.y += proj.vy * 60 * dt;
      proj.scale = Math.min(1.25, proj.scale + dt * 0.8);

      if (this.boss && this.boss.state !== 'defeated') {
        const b = this.boss;
        if (
          proj.x + 40 > b.x &&
          proj.x < b.x + b.width &&
          proj.y + 20 > b.y &&
          proj.y < b.y + b.height
        ) {
          b.health = Math.max(0, b.health - 10);
          b.invulnerableTimer = 0.3;
          b.state = 'stunned';
          b.stunTimer = 0.45;
          b.vx = proj.vx > 0 ? 3 : -3;
          this.screenShake = 0.9;
          sounds.playBossHurt();

          if (this.callbacks.onBossHealthUpdate && b.health !== this.lastReportedBossHp) {
            this.lastReportedBossHp = b.health;
            this.callbacks.onBossHealthUpdate(b.health, b.maxHealth);
          }

          // === BÁ HỘ LONG STORY DIALOGUE MILESTONES (User Request) ===
          if (b.bossType === 'baholong') {
            // Milestone 1: Lost >= 30% HP (Health <= 70)
            if (b.health <= 70 && !b.hit30PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit30PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase1_30',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [
                  'Tao giàu còn m thì có gì?!',
                  'M chỉ có set son 500k thôi!',
                ],
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            // Milestone 2: Lost >= 70% HP (Health <= 30)
            if (b.health <= 30 && !b.hit70PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit70PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase2_70',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [
                  'M đi yêu Ý đi, đừng giành Trúc của tao!',
                ],
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            // Milestone 3: Lost 100% HP (Health <= 0)
            if (b.health <= 0 && !b.hit100PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit100PercentCutscene = true;
              b.state = 'defeated';
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase3_100',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [
                  'Đừng đánh nữa, Long xin lỗi được chưa?!',
                ],
              });
              this.projectiles.splice(i, 1);
              continue;
            }
          }

          const remarks = [
            'Bởi vì cái gì?! Sao lý luận vững thế?!',
            'Áaa! Lý lẽ quá thuyết phục, ta đuối lý!',
            'Khoan! Cậu nói nghe chí lý quá...',
            'Đừng nói BECAUSE nữa, nhức đầu quá!',
          ];
          b.dialogueBubble = {
            text: remarks[Math.floor(Math.random() * remarks.length)],
            timer: 1.8,
          };

          for (let p = 0; p < 10; p++) {
            this.particles.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              size: Math.random() * 5 + 3,
              color: '#FACC15',
              alpha: 1,
              life: 0.45,
              maxLife: 0.45,
              shape: 'star',
            });
          }

          if (b.health <= 0) {
            b.state = 'defeated';
            b.isShootingGun = false;
            sounds.playVictory();
            this.score += 2000;
          }

          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check collision against otters / enemies
      let hitEnemy = false;
      for (const enemy of this.enemies) {
        if (enemy.state === 'alive') {
          if (
            proj.x + 36 > enemy.x &&
            proj.x < enemy.x + enemy.width &&
            proj.y + 20 > enemy.y &&
            proj.y < enemy.y + enemy.height
          ) {
            enemy.state = 'squished';
            enemy.squishTimer = 0.5;
            sounds.playStomp();
            this.score += 200;
            this.screenShake = 0.4;
            for (let p = 0; p < 6; p++) {
              this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color: '#FACC15',
                alpha: 1,
                life: 0.35,
                maxLife: 0.35,
                shape: 'star',
              });
            }
            this.projectiles.splice(i, 1);
            hitEnemy = true;
            break;
          }
        }
      }
      if (hitEnemy) continue;

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let j = this.bossAttacks.length - 1; j >= 0; j--) {
      const atk = this.bossAttacks[j];
      atk.life -= dt;

      // Handle custom physics for Dice Shots (Gravity & Bouncing!)
      if (atk.type === 'dice_shot') {
        atk.vy += 22 * dt;
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        atk.rotation = (atk.rotation || 0) + (atk.rotationSpeed || 10) * dt;

        // Ground bounce on road surface at y = 470
        if (atk.y >= 470 && atk.vy > 0) {
          atk.y = 470;
          atk.vy = -atk.vy * 0.65;
          atk.vx *= 0.85;
          atk.bounceCount = (atk.bounceCount || 0) + 1;

          for (let s = 0; s < 2; s++) {
            this.particles.push({
              x: atk.x + 12,
              y: atk.y + 12,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              size: 3,
              color: '#F87171',
              alpha: 1,
              life: 0.25,
              maxLife: 0.25,
              shape: 'star',
            });
          }
        }
      } else if (atk.type === 'dollar_bill' || atk.type === 'money_stack') {
        atk.x += atk.vx * 60 * dt;
        atk.y += (atk.vy + Math.sin(this.riverTimer * 7 + (atk.rotation || 0)) * 0.45) * 60 * dt;
        if (atk.rotation !== undefined) {
          atk.rotation += (atk.rotationSpeed || 6) * dt;
        }
      } else {
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        if (atk.rotation !== undefined) {
          atk.rotation += dt * 8;
        }
      }

      const p = this.player;
      if (
        p.invulnerableTimer <= 0 &&
        p.x + p.width > atk.x &&
        p.x < atk.x + atk.width &&
        p.y + p.height > atk.y &&
        p.y < atk.y + atk.height
      ) {
        this.handlePlayerDamage();
        this.bossAttacks.splice(j, 1);
        continue;
      }

      if (atk.life <= 0) {
        this.bossAttacks.splice(j, 1);
      }
    }
  }

  private updateCollectibles() {
    const p = this.player;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (!inView(this.cameraX, this.viewportWidth, c.x, c.width, 40)) continue;
      c.bobOffset += 0.05;

      if (
        p.x + p.width > c.x &&
        p.x < c.x + c.width &&
        p.y + p.height > c.y &&
        p.y < c.y + c.height
      ) {
        c.collected = true;
        if (c.type === 'lotus_coin') {
          this.coins++;
          this.score += 50;
          sounds.playCoin();
        } else if (c.type === 'grapefruit_heal') {
          p.health = Math.min(p.maxHealth, p.health + 1);
          this.score += 100;
          this.timeLeft = Math.min(240, this.timeLeft + 5);
          sounds.playHeal();
        } else if (c.type === 'heart_heal') {
          // Reaching heart restores HP and gives +10s bonus time!
          p.health = Math.min(p.maxHealth, p.health + 1);
          this.score += 250;
          this.timeLeft = Math.min(240, this.timeLeft + 10);
          sounds.playHeartHeal();
          this.spawnHeartHealParticles(c.x + c.width / 2, c.y + c.height / 2);
        }

        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: c.x + c.width / 2,
            y: c.y + c.height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 2,
            color: c.type === 'lotus_coin' ? '#FACC15' : '#4ADE80',
            alpha: 1,
            life: 0.35,
            maxLife: 0.35,
            shape: 'star',
          });
        }
      }
    }
  }

  private spawnHeartHealParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 5 + 3,
        color: ['#F43F5E', '#FB7185', '#FDA4AF', '#FDE047'][i % 4],
        alpha: 1,
        life: 0.7,
        maxLife: 0.7,
        shape: 'heart',
      });
    }

    // Floating text feedback "+1 HP ❤️ (+10s)"
    this.particles.push({
      x,
      y: y - 12,
      vx: 0,
      vy: -1.6,
      size: 13,
      color: '#F43F5E',
      alpha: 1,
      life: 0.85,
      maxLife: 0.85,
      shape: 'letter',
      char: '+1 HP ❤️ (+10s)',
    });
  }

  private updateParticles(dt: number) {
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= dt;
      part.x += part.vx * 60 * dt;
      part.y += part.vy * 60 * dt;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private handlePlayerDamage() {
    const p = this.player;
    p.health--;
    p.invulnerableTimer = 1.5;
    p.vy = -6;
    p.vx = p.facing === 'right' ? -4 : 4;
    this.screenShake = 0.8;
    sounds.playPlayerHurt();

    if (p.health <= 0) {
      sounds.playGameOver();
      this.callbacks.onGameOver('Bạn đã hết máu!');
    }
  }

  private updateCamera(dt: number) {
    const targetCamX = this.player.x - this.viewportWidth * 0.4;
    // Frame-rate independent smoothing (0.14 per frame @ 60fps)
    const lerp = 1 - Math.pow(1 - 0.14, dt * 60);
    this.cameraX += (targetCamX - this.cameraX) * lerp;
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.level.width - this.viewportWidth));
  }

  private checkLevelGoal() {
    const p = this.player;
    const g = this.level.goalPoint;

    if (this.boss && this.boss.state !== 'defeated') {
      return;
    }

    if (
      p.x + p.width > g.x &&
      p.x < g.x + g.width &&
      p.y + p.height > g.y &&
      p.y < g.y + g.height
    ) {
      sounds.playVictory();
      if (this.level.id === 1) {
        this.callbacks.onLevelComplete(2);
      } else if (this.level.id === 2) {
        this.callbacks.onLevelComplete(3);
      } else if (this.level.id === 3) {
        this.callbacks.onLevelComplete(4);
      } else {
        this.callbacks.onVictory();
      }
    }
  }

  // Rendering Loop
  public render() {
    const ctx = this.ctx;
    // Draw in logical units; renderScale maps them to real device pixels.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);

    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 8;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 8;
      ctx.translate(shakeX, shakeY);
    }

    this.drawParallaxBackground(ctx);

    // Snap camera to a whole *device* pixel -> no shimmering on HiDPI
    ctx.translate(-Math.round(this.cameraX * this.renderScale) / this.renderScale, 0);

    if (this.level.id === 1) {
      Level1Scenery.drawRiver(ctx, this.level.width, this.level.height, this.riverTimer, this.cameraX, this.viewportWidth);
      Level1Scenery.drawEnvironment(ctx, this.cameraX, this.riverTimer);
    } else if (this.level.id === 2) {
      Level2Scenery.drawEnvironment(ctx, this.cameraX, this.riverTimer);
    } else if (this.level.id === 3) {
      this.drawLevel3Environment(ctx);
    } else if (this.level.id === 4) {
      this.drawLevel4Environment(ctx);
    }

    this.drawPlatforms(ctx);
    this.drawGoalPoint(ctx);
    this.drawCollectibles(ctx);
    this.drawCharacterShadows(ctx);
    this.drawEnemies(ctx);

    if (this.boss) {
      this.drawBoss(ctx);
    }

    this.drawProjectiles(ctx);

    // Render Phước with the exact character model from user's sprite sheet!
    const isBossDefeated = this.boss && this.boss.state === 'defeated';
    const playerRenderState = isBossDefeated ? 'celebrate' : this.player.state;

    drawPhuoc(ctx, {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
      facing: this.player.facing,
      state: playerRenderState,
      animTimer: this.player.animTimer,
      isInvulnerable: this.player.invulnerableTimer > 0,
    });

    this.drawParticles(ctx);

    // Draw Aim Trajectory (if active on mobile drag)
    if (this.aimTrajectory && this.aimTrajectory.active) {
      const pX = this.player.x + (this.player.facing === 'right' ? this.player.width + 2 : -2);
      const pY = this.player.y + 16;
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pX, pY);
      const targetLength = 240;
      const endX = pX + Math.cos(this.aimTrajectory.angle) * targetLength;
      const endY = pY + Math.sin(this.aimTrajectory.angle) * targetLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Glowing targeting endpoint
      ctx.setLineDash([]);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer targeting ring
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endX, endY, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Tap-to-Aim Ripple Effect
    if (this.tapTargetEffect) {
      const tX = this.tapTargetEffect.x + this.cameraX;
      const tY = this.tapTargetEffect.y;
      const progress = 1 - this.tapTargetEffect.life / this.tapTargetEffect.maxLife;
      const radius = 10 + progress * 24;
      const alpha = Math.max(0, 1 - progress);

      ctx.save();
      ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tX, tY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair tick marks
      ctx.beginPath();
      ctx.moveTo(tX - radius - 4, tY);
      ctx.lineTo(tX - 4, tY);
      ctx.moveTo(tX + 4, tY);
      ctx.lineTo(tX + radius + 4, tY);
      ctx.moveTo(tX, tY - radius - 4);
      ctx.lineTo(tX, tY - 4);
      ctx.moveTo(tX, tY + 4);
      ctx.lineTo(tX, tY + radius + 4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Post-process overlay (vignette + colour grading) - one drawImage
    if (this.overlayLayer) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.overlayLayer, 0, 0);
    }
  }

  /** Soft contact shadows under characters (found by dropping onto platforms). */
  private drawCharacterShadows(ctx: CanvasRenderingContext2D) {
    const camX = this.cameraX;
    const vw = this.viewportWidth;

    const shadowFor = (x: number, y: number, w: number, h: number, scale = 1) => {
      if (!inView(camX, vw, x, w)) return;
      const cx = x + w / 2;
      const feet = y + h;
      let groundY = Infinity;
      for (const plat of this.platforms) {
        if (plat.type === 'bamboo_pole' || plat.type === 'barricade') continue;
        if (cx < plat.x || cx > plat.x + plat.width) continue;
        if (plat.y >= feet - 4 && plat.y < groundY) groundY = plat.y;
      }
      if (groundY === Infinity) return;
      const dist = groundY - feet;
      if (dist > 160) return;
      const fade = Math.max(0.25, 1 - dist / 160);
      drawContactShadow(ctx, cx, groundY + 1, w * scale * (0.9 + 0.1 * fade), 0.35 * fade);
    };

    const p = this.player;
    shadowFor(p.x, p.y, p.width, p.height);
    for (const e of this.enemies) {
      if (e.state === 'alive') shadowFor(e.x, e.y, e.width, e.height);
    }
    if (this.boss && this.boss.state !== 'defeated') {
      shadowFor(this.boss.x, this.boss.y, this.boss.width, this.boss.height, 0.9);
    }
  }

  private drawParallaxBackground(ctx: CanvasRenderingContext2D) {
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    if (this.level.id === 1) {
      Level1Scenery.drawParallax(ctx, w, h, this.cameraX, this.riverTimer);
      return;
    }

    if (this.level.id === 2) {
      Level2Scenery.drawParallax(ctx, w, h, this.cameraX, this.riverTimer, this.renderScale);
      return;
    }

    if (this.level.id === 3) {
      this.drawLevel3Parallax(ctx, w, h);
      return;
    }

    if (this.level.id === 4) {
      this.drawLevel4Parallax(ctx, w, h);
      return;
    }
  }

  private drawLevel3Parallax(ctx: CanvasRenderingContext2D, w: number, h: number) {
    Level3Scenery.drawParallax(ctx, w, h, this.cameraX, this.riverTimer, this.renderScale);
  }

  private drawLevel3Environment(ctx: CanvasRenderingContext2D) {
    // Red glowing paper lanterns along walls
    for (let x = 160; x <= this.level.width; x += 360) {
      if (!inView(this.cameraX, this.viewportWidth, x - 40, 80)) continue;
      Level3Scenery.drawLanternGlow(ctx, x, 262, this.riverTimer);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(x, 260, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(x - 2, 268, 4, 8);
    }
  }

  private drawLevel4Parallax(ctx: CanvasRenderingContext2D, w: number, h: number) {
    Level4Scenery.drawParallaxBackground(ctx, this.cameraX, this.riverTimer, this.renderScale);
  }

  private drawLevel4Environment(ctx: CanvasRenderingContext2D) {
    // 1. Fallen motorbike stuck beside highway guardrail (near spawn point)
    Level4Scenery.drawCrashedMotorbike(ctx, 160, 440, this.riverTimer);

    // 2. Sweet Trúc resting safely on highway sidewalk beside motorbike
    const isBossDefeated = Boolean(this.boss && this.boss.state === 'defeated');
    Level4Scenery.drawInjuredTruc(ctx, 90, 445, this.riverTimer, isBossDefeated);

    // 3. Orange Traffic Cones & Highway Markers along the arena
    for (let px = 580; px <= this.level.width - 200; px += 360) {
      if (!inView(this.cameraX, this.viewportWidth, px, 14)) continue;
      ctx.save();
      // Orange highway safety cone
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(px, 470);
      ctx.lineTo(px + 7, 446);
      ctx.lineTo(px + 14, 470);
      ctx.closePath();
      ctx.fill();

      // White reflective tape
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 3, 456, 8, 4);

      // Base plate
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(px - 2, 468, 18, 3);
      ctx.restore();
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D) {
    const camX = this.cameraX;
    const vw = this.viewportWidth;
    // Visible window for tiled decorations (keeps pattern aligned to the grid)
    const vis0 = camX - 24;
    const vis1 = camX + vw + 24;
    const gridStart = (start: number, step: number) =>
      start + Math.max(0, Math.floor((vis0 - start) / step)) * step;
    const gridEnd = (end: number) => Math.min(end, vis1);
    for (const plat of this.platforms) {
      if (!inView(camX, vw, plat.x, plat.width, 24)) continue;
      if (plat.type === 'ground') {
        if (this.level.id === 1) {
          // Lush Green Grassy Riverbank Top Layer matching reference image
          ctx.fillStyle = '#15803D';
          ctx.fillRect(plat.x, plat.y, plat.width, 16);
          // Highlight Grass Tuft Edge
          ctx.fillStyle = '#4ADE80';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          for (let gx = gridStart(plat.x, 10); gx < gridEnd(plat.x + plat.width); gx += 10) {
            ctx.fillStyle = '#86EFAC';
            ctx.fillRect(gx, plat.y - 3, 3, 4);
            ctx.fillStyle = '#22C55E';
            ctx.fillRect(gx + 3, plat.y - 2, 2, 3);
          }

          // Rich Stratified Soil & Cliff Rock Face
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
          ctx.fillStyle = '#92400E';
          for (let ry = plat.y + 24; ry < plat.y + plat.height; ry += 18) {
            ctx.fillRect(plat.x, ry, plat.width, 4);
          }
          // Earth roots dangling into water
          ctx.fillStyle = '#451A03';
          for (let rx = gridStart(plat.x + 8, 28); rx < gridEnd(plat.x + plat.width); rx += 28) {
            ctx.fillRect(rx, plat.y + 16, 2, 8);
          }
        } else if (this.level.id === 2) {
          // Asphalt road with white dash lane markings matching reference photo
          ctx.fillStyle = '#334155';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          // Concrete curb edge
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
          // White dashed lane markings
          ctx.fillStyle = '#F8FAFC';
          for (let rx = gridStart(plat.x + 20, 80); rx < gridEnd(plat.x + plat.width); rx += 80) {
            ctx.fillRect(rx, plat.y + 36, 40, 6);
          }
        } else if (this.level.id === 3) {
          // Courtyard ancient flagstone tiles
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
        } else {
          // Level 4: Saigon Highway Bridge Asphalt with white markings & hazard barriers
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          // Concrete curb top
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          // White dashed lane divider markings
          ctx.fillStyle = '#F8FAFC';
          for (let rx = gridStart(plat.x + 20, 80); rx < gridEnd(plat.x + plat.width); rx += 80) {
            ctx.fillRect(rx, plat.y + 24, 38, 4);
          }
          // Red-white reflective concrete guardrail along the bottom
          for (let rx = gridStart(plat.x, 36); rx < gridEnd(plat.x + plat.width); rx += 36) {
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(rx, plat.y + plat.height - 14, 18, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rx + 18, plat.y + plat.height - 14, 18, 14);
          }
        }
      } else if (plat.type === 'bridge_wood') {
        if (this.level.id === 1) {
          // Bamboo bridge walkway slats
          ctx.fillStyle = '#CA8A04';
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          ctx.fillStyle = '#EAB308';
          for (let bx = gridStart(plat.x, 8); bx < gridEnd(plat.x + plat.width); bx += 8) {
            ctx.fillRect(bx, plat.y, 6, 14);
            ctx.fillStyle = '#78350F';
            ctx.fillRect(bx + 6, plat.y, 2, 14);
            ctx.fillStyle = '#EAB308';
          }
        } else if (this.level.id === 4) {
          // Level 4: Steel highway overhead gantry / elevated bridge beam
          ctx.fillStyle = '#334155';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          // Yellow-black caution stripes
          for (let sx = gridStart(plat.x, 20); sx < gridEnd(plat.x + plat.width); sx += 20) {
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(sx, plat.y, 10, 4);
          }
        } else {
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, plat.width, 16);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
        }
      } else if (plat.type === 'hyacinth_raft') {
        // Floating water hyacinth raft (Đám bèo tây / hoa súng)
        ctx.fillStyle = '#14532D';
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 10);
        ctx.fill();

        ctx.fillStyle = '#166534';
        for (let bx = plat.x + 8; bx < plat.x + plat.width - 8; bx += 14) {
          ctx.beginPath();
          ctx.ellipse(bx, plat.y + 8, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Blooming Water Lily Blossoms
        ctx.fillStyle = '#C084FC';
        ctx.beginPath();
        ctx.arc(plat.x + 18, plat.y + 6, 6, 0, Math.PI * 2);
        ctx.arc(plat.x + plat.width / 2, plat.y + 5, 7, 0, Math.PI * 2);
        ctx.arc(plat.x + plat.width - 18, plat.y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (plat.type === 'bamboo_pole') {
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#CA8A04';
        for (let by = plat.y + 15; by < plat.y + plat.height; by += 25) {
          ctx.fillRect(plat.x, by, plat.width, 4);
        }
      } else if (plat.type === 'barricade') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#DC2626';
        for (let s = 0; s < plat.height; s += 20) {
          ctx.fillRect(plat.x, plat.y + s, plat.width, 10);
        }
      } else if (plat.type === 'dinh_roof') {
        // Traditional Red Curved Tile Roof
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(plat.x - 6, plat.y - 4, plat.width + 12, 6);
      } else {
        // 'brick' / scaffolding / stilt steps
        if (this.level.id === 1) {
          ctx.fillStyle = '#15803D';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 6, plat.width, plat.height - 6);
        } else if (this.level.id === 2) {
          // Steel Scaffolding platforms
          ctx.fillStyle = '#64748B';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        } else {
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        }
      }
    }
  }

  private drawGoalPoint(ctx: CanvasRenderingContext2D) {
    const g = this.level.goalPoint;

    if (this.level.id === 1) {
      // Traditional Vietnamese Village / Town Gateway (Cổng Phố Huyện)
      ctx.save();
      // Wooden support pillars
      ctx.fillStyle = '#78350F';
      ctx.fillRect(g.x + 8, g.y, 14, g.height);
      ctx.fillRect(g.x + g.width - 22, g.y, 14, g.height);

      // Thatched eaved roof on top of gate
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.moveTo(g.x - 8, g.y + 12);
      ctx.lineTo(g.x + g.width / 2, g.y - 14);
      ctx.lineTo(g.x + g.width + 8, g.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#D97706';
      ctx.fillRect(g.x - 6, g.y + 10, g.width + 12, 5);

      // Golden lacquered town board
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(g.x + 2, g.y + 18, g.width - 4, 34);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x + 2, g.y + 18, g.width - 4, 34);

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CỬA PHỐ HUYỆN', g.x + g.width / 2, g.y + 38);

      // Hanging red lanterns
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(g.x + 14, g.y + 60, 6, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(g.x + g.width - 14, g.y + 60, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(g.x + 13, g.y + 66, 2, 4);
      ctx.fillRect(g.x + g.width - 15, g.y + 66, 2, 4);

      // Floating pulsating guidance arrow
      const arrowY = g.y + 85 + Math.sin(this.riverTimer * 4) * 6;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(g.x + g.width / 2, arrowY + 14);
      ctx.lineTo(g.x + g.width / 2 - 14, arrowY - 8);
      ctx.lineTo(g.x + g.width / 2 + 14, arrowY - 8);
      ctx.fill();

      ctx.restore();
    } else {
      const isOpen = this.boss && this.boss.state === 'defeated';
      ctx.fillStyle = isOpen ? '#059669' : '#991B1B';
      ctx.fillRect(g.x, g.y, g.width, g.height);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isOpen ? 'CỔNG MỞ' : 'KHÓA CHẶT', g.x + g.width / 2, g.y + 30);
      ctx.fillText(isOpen ? 'CỨU TRÚC!' : 'CẦN CHÌA KHÓA', g.x + g.width / 2, g.y + 50);
    }
  }

  private drawCollectibles(ctx: CanvasRenderingContext2D) {
    for (const c of this.collectibles) {
      if (c.collected) continue;

      if (c.type === 'heart_heal') {
        Level2Scenery.drawHeart(ctx, c, this.riverTimer);
        continue;
      }

      if (this.level.id === 1) {
        if (c.type === 'lotus_coin') {
          Level1Scenery.drawGoldCoin(ctx, c, this.riverTimer);
        } else {
          Level1Scenery.drawPomelo(ctx, c, this.riverTimer);
        }
      } else {
        const bobY = c.y + Math.sin(c.bobOffset + this.riverTimer * 3.5) * 4;
        if (c.type === 'lotus_coin') {
          ctx.save();
          ctx.translate(c.x + c.width / 2, bobY + c.height / 2);
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#D97706';
          ctx.fillRect(-2, -4, 4, 8);
          ctx.restore();
        } else {
          Level1Scenery.drawPomelo(ctx, c, this.riverTimer);
        }
      }
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const otter of this.enemies) {
      if (!inView(this.cameraX, this.viewportWidth, otter.x, otter.width, 80)) continue;
      drawOtter(ctx, {
        x: otter.x,
        y: otter.y,
        width: otter.width,
        height: otter.height,
        facing: otter.facing,
        state: otter.state,
        squishTimer: otter.squishTimer,
        animTimer: otter.animTimer,
        isJumper: otter.isJumper,
      });
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D) {
    const b = this.boss;
    if (!b) return;

    if (b.bossType === 'baholong') {
      drawBaHoLongBoss(ctx, { boss: b, timer: this.riverTimer });
    } else {
      drawCsgtBoss(ctx, { boss: b, timer: this.riverTimer });
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    // 1. Phước's BECAUSE Shouts
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.rotation);
      ctx.scale(proj.scale, proj.scale);

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(20, 8, 30 * (1 - proj.life / proj.maxLife), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(-4, -14, 100, 36, 12);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.roundRect(-2, -12, 96, 32, 10);
      ctx.fill();

      ctx.fillStyle = '#92400E';
      ctx.font = '900 16px "Rowdies", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(proj.text, 46, 10);

      ctx.restore();
    }

    // 2. Boss Attacks (Whistles, Bullets, Citations, Money Bags, Ground Shocks)
    for (const atk of this.bossAttacks) {
      if (!inView(this.cameraX, this.viewportWidth, atk.x, 40, 60)) continue;
      ctx.save();
      ctx.translate(atk.x, atk.y);

      if (atk.type === 'dice_shot') {
        Level4Scenery.drawDice(ctx, atk);
      } else if (atk.type === 'dollar_bill') {
        Level4Scenery.drawDollarBill(ctx, atk);
      } else if (atk.type === 'money_stack') {
        Level4Scenery.drawMoneyStack(ctx, atk);
      } else if (atk.type === 'bullet_shot') {
        // High-speed glowing golden pistol bullet with speed lines & muzzle smoke
        const dir = atk.vx > 0 ? 1 : -1;

        // Tracer streak
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(10 - dir * 26, 5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(10 - dir * 16, 5);
        ctx.stroke();

        // Golden Bullet Head
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.ellipse(10, 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 3.5, 4, 3);
      } else if (atk.type === 'money_bag') {
        if (atk.rotation !== undefined) ctx.rotate(atk.rotation);
        // Rich Landlord Money Sack
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 4);
      } else if (atk.type === 'whistle_wave') {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, 10, 14, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else if (atk.type === 'citation_paper') {
        if (atk.rotation !== undefined) ctx.rotate(atk.rotation);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-10, -14, 20, 28);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -14, 20, 28);
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('PHẠT!', -8, 2);
      } else if (atk.type === 'cane_shock' || atk.type === 'ground_shock') {
        ctx.fillStyle = atk.type === 'cane_shock' ? '#A855F7' : '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(12, 0);
        ctx.lineTo(24, 20);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    const camX = this.cameraX;
    const vw = this.viewportWidth;
    ctx.textAlign = 'center';

    for (const part of this.particles) {
      if (part.x < camX - 60 || part.x > camX + vw + 60) continue;

      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;

      if (part.shape === 'heart') {
        const x = part.x;
        const y = part.y;
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.bezierCurveTo(x - 5, y, x - 5, y - 4, x - 2, y - 4);
        ctx.bezierCurveTo(x, y - 4, x, y - 2, x, y);
        ctx.bezierCurveTo(x, y - 2, x, y - 4, x + 2, y - 4);
        ctx.bezierCurveTo(x + 5, y - 4, x + 5, y, x, y + 4);
        ctx.fill();
      } else if (part.shape === 'letter' && part.char) {
        // Outline instead of shadowBlur (shadowBlur is extremely slow in Canvas2D)
        ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeText(part.char, part.x, part.y);
        ctx.fillText(part.char, part.x, part.y);
      } else if (part.shape === 'splash') {
        ctx.beginPath();
        ctx.ellipse(part.x, part.y, part.size, part.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Particles shrink as they fade -> smoother look
        const r = part.size * (0.4 + 0.6 * part.alpha);
        ctx.beginPath();
        ctx.arc(part.x, part.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
