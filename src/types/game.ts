/**
 * Types & Game State interfaces for Hành Trình Phước - Cầu Sông Buông
 */

export type GameState =
  | 'TITLE_MENU'
  | 'STORY_INTRO'
  | 'PLAYING'
  | 'LEVEL_TRANSITION'
  | 'LEVEL3_TRANSITION'
  | 'LEVEL4_TRANSITION'
  | 'BOSS_INTRO'
  | 'VICTORY'
  | 'GAME_OVER'
  | 'PAUSED';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  health: number;
  maxHealth: number;
  invulnerableTimer: number; // in seconds
  attackCooldown: number;
  isAttacking: boolean;
  speechShoutTimer: number;
  state: 'idle' | 'run' | 'jump' | 'fall' | 'shout';
  animTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  mobileJumpSustainTimer?: number;
}

export type MobileAimMode = 'auto' | 'diagonal' | 'up' | 'straight';

export interface AttackBecauseOptions {
  targetX?: number;
  targetY?: number;
  mode?: MobileAimMode;
  customAngleRad?: number;
}

export interface EnemyOtter {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  startX: number;
  patrolDistance: number;
  facing: 'left' | 'right';
  state: 'alive' | 'squished' | 'dead';
  squishTimer: number;
  isJumper?: boolean;
  jumpTimer?: number;
  animTimer: number;
}

export type BossPhase = 'idle' | 'patrol' | 'whistle_attack' | 'citation_attack' | 'gun_attack' | 'dice_throw' | 'money_throw' | 'jump_slam' | 'stunned' | 'defeated';

export interface Boss {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  state: BossPhase;
  phaseTimer: number;
  attackCooldown: number;
  gunShootTimer?: number;
  isShootingGun?: boolean;
  gunAimTimer?: number;
  bossType?: 'csgt' | 'baholong';
  stunTimer: number;
  invulnerableTimer: number;
  dialogueBubble?: {
    text: string;
    timer: number;
  };
  animTimer: number;
  // Story milestones tracked
  hit30PercentCutscene?: boolean;
  hit70PercentCutscene?: boolean;
  hit100PercentCutscene?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string; // e.g. "BECAUSE!", "BỞI VÌ...!"
  size: number;
  color: string;
  life: number;
  maxLife: number;
  isFromPlayer: boolean;
  rotation: number;
  scale: number;
}

export interface BossAttack {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'whistle_wave' | 'citation_paper' | 'ground_shock' | 'bullet_shot' | 'money_bag' | 'cane_shock' | 'dice_shot' | 'dollar_bill' | 'money_stack';
  width: number;
  height: number;
  life: number;
  rotation?: number;
  rotationSpeed?: number;
  bounceCount?: number;
  pipNumber?: number;
}

export interface BossStoryEvent {
  stage: 'phase1_30' | 'phase2_70' | 'phase3_100';
  speaker: string;
  currentDialogIndex: number;
  dialogues: string[];
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'lotus_coin' | 'grapefruit_heal' | 'heart_heal' | 'speech_energy';
  collected: boolean;
  bobOffset: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'bridge_wood' | 'bamboo_pole' | 'hyacinth_raft' | 'brick' | 'barricade' | 'dinh_roof';
  isMoving?: boolean;
  minX?: number;
  maxX?: number;
  speed?: number;
  direction?: 1 | -1;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'splash' | 'letter' | 'heart';
  char?: string;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  timeLimit: number; // in seconds
  platforms: Platform[];
  enemies: EnemyOtter[];
  collectibles: Collectible[];
  spawnPoint: { x: number; y: number };
  goalPoint: { x: number; y: number; width: number; height: number };
  boss?: Boss;
  hasSpeechAttack: boolean;
}
