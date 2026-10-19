/**
 * Main Application Shell for Hành Trình Phước - Cầu Sông Buông
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, BossStoryEvent } from './types/game';
import { createLevel1, createLevel2, createLevel3, createLevel4 } from './game/levels';
import { CanvasEngine } from './game/canvasEngine';
import { sounds } from './audio/soundEffects';
import { TitleScreen } from './components/TitleScreen';
import { StoryCutscene } from './components/StoryCutscene';
import { GameHUD } from './components/GameHUD';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { MobileControls } from './components/MobileControls';
import { BossStoryDialogModal } from './components/BossStoryDialogModal';
import { Play, RotateCcw, Home } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [health, setHealth] = useState<number>(3);
  const [maxHealth] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number | undefined>(undefined);
  const [bossMaxHp, setBossMaxHp] = useState<number | undefined>(undefined);
  const [bossName, setBossName] = useState<string | undefined>(undefined);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [becauseShoutsCount, setBecauseShoutsCount] = useState<number>(0);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [bossStoryEvent, setBossStoryEvent] = useState<BossStoryEvent | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  // Initialize or restart engine
  const startLevel = useCallback((levelId: number) => {
    setCurrentLevelId(levelId);
    setBossStoryEvent(null);
    let levelData;
    if (levelId === 1) levelData = createLevel1();
    else if (levelId === 2) levelData = createLevel2();
    else if (levelId === 3) levelData = createLevel3();
    else levelData = createLevel4();

    setTimeLeft(levelData.timeLimit || 100);
    setCooldownRemaining(0);

    if (canvasRef.current) {
      if (engineRef.current) {
        engineRef.current.stop();
      }

      const engine = new CanvasEngine(canvasRef.current, levelData, {
        onLevelComplete: (nextLevelId) => {
          engine.stop();
          if (nextLevelId === 2) {
            setGameState('LEVEL_TRANSITION');
          } else if (nextLevelId === 3) {
            setGameState('LEVEL3_TRANSITION');
          } else if (nextLevelId === 4) {
            setGameState('LEVEL4_TRANSITION');
          } else {
            setGameState('VICTORY');
          }
        },
        onVictory: () => {
          engine.stop();
          setBecauseShoutsCount(engine.becauseShoutsCount);
          setGameState('VICTORY');
        },
        onGameOver: (reason?: string) => {
          engine.stop();
          setGameOverReason(reason || 'Phước đã kiệt sức trước chướng ngại vật!');
          setGameState('GAME_OVER');
        },
        onScoreUpdate: (newScore, newCoins, newHp) => {
          setScore(newScore);
          setCoins(newCoins);
          setHealth(newHp);
        },
        onBossHealthUpdate: (hp, max, name) => {
          setBossHp(hp);
          setBossMaxHp(max);
          if (name) setBossName(name);
        },
        onTimeUpdate: (remainingTime) => {
          setTimeLeft(remainingTime);
        },
        onCooldownUpdate: (remainingCooldown) => {
          setCooldownRemaining(remainingCooldown);
        },
        onBossStoryEvent: (event) => {
          setBossStoryEvent(event);
        },
      });

      engineRef.current = engine;
      engine.start();
      setHealth(engine.player.health);
      if (levelData.boss) {
        setBossHp(levelData.boss.health);
        setBossMaxHp(levelData.boss.maxHealth);
        setBossName(levelData.boss.bossType === 'baholong' ? 'Bá Hộ Long' : 'Công an');
      } else {
        setBossHp(undefined);
        setBossMaxHp(undefined);
        setBossName(undefined);
      }
    }

    setGameState('PLAYING');
    setIsPaused(false);
  }, []);

  const handleResumeFromStoryDialog = () => {
    setBossStoryEvent(null);
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  const handleEndGameKiss = () => {
    setBossStoryEvent(null);
    sounds.playKiss();
    if (engineRef.current) {
      setBecauseShoutsCount(engineRef.current.becauseShoutsCount);
      engineRef.current.stop();
    }
    setGameState('VICTORY');
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  // Keyboard Event Handlers (stable listeners with zero latency)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'TITLE_MENU') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startLevel(1);
        }
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (gameState === 'PLAYING' && engineRef.current && !isPaused) {
        if (
          ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF'].includes(
            e.code
          )
        ) {
          e.preventDefault();
        }
        engineRef.current.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING' && engineRef.current) {
        engineRef.current.handleKeyUp(e.code);
      }
    };

    const handleBlur = () => {
      if (engineRef.current) {
        ['KeyA', 'KeyD', 'KeyW', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].forEach((code) =>
          engineRef.current?.handleKeyUp(code)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, isPaused, startLevel]);

  // Click or touch anywhere on screen triggers "BECAUSE!" directly at touched position
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (gameState !== 'PLAYING' || !engineRef.current || isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Engine converts pointer position -> logical 960x540 game space
    // (handles letter-boxing and the HiDPI backing store size).
    const { x: clientX, y: clientY } = engineRef.current.clientToLogical(e.clientX, e.clientY);

    engineRef.current.handleCanvasClick(clientX, clientY);
  };

  const getLevelTitle = (id: number) => {
    switch (id) {
      case 1:
        return 'MÀN 1: CẦU SÔNG BUÔNG';
      case 2:
        return 'MÀN 2: PHỐ HUYỆN & TRẠM CSGT';
      case 3:
        return 'MÀN 3: CỔNG DINH BÁ HỘ LONG';
      case 4:
        return 'MÀN 4: ĐẠI LỘ SÀI GÒN - QUYẾT ĐẤU BÁ HỘ LONG';
      default:
        return `MÀN ${id}`;
    }
  };

  const isCutsceneState =
    gameState === 'TITLE_MENU' ||
    gameState === 'STORY_INTRO' ||
    gameState === 'LEVEL_TRANSITION' ||
    gameState === 'LEVEL3_TRANSITION' ||
    gameState === 'LEVEL4_TRANSITION';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 flex items-center justify-center select-none touch-none">
      {/* 1. Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          onStartGame={() => startLevel(1)}
          onOpenStory={() => setGameState('STORY_INTRO')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Story Cutscene Introduction */}
      {gameState === 'STORY_INTRO' && (
        <StoryCutscene
          onStartPlaying={() => startLevel(1)}
          specificScene="intro"
        />
      )}

      {/* 3. Level 2 Transition Cutscene (Chạm trán Boss Công An) */}
      {gameState === 'LEVEL_TRANSITION' && (
        <StoryCutscene
          onStartPlaying={() => startLevel(2)}
          specificScene="level2_briefing"
        />
      )}

      {/* 4. Level 3 Transition Cutscene (Cổng Dinh Bá Hộ Long) */}
      {gameState === 'LEVEL3_TRANSITION' && (
        <StoryCutscene
          onStartPlaying={() => startLevel(3)}
          specificScene="level3_briefing"
        />
      )}

      {/* 5. Level 4 Transition Cutscene (Đại Điện Dinh Thự - Quyết Đấu Bá Hộ Long) */}
      {gameState === 'LEVEL4_TRANSITION' && (
        <StoryCutscene
          onStartPlaying={() => startLevel(4)}
          specificScene="level4_briefing"
        />
      )}

      {/* 6. Canvas Playfield Container */}
      <div
        onPointerDown={handleCanvasPointerDown}
        className={`relative w-full h-full flex items-center justify-center ${
          isCutsceneState ? 'hidden' : 'block'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full max-w-[1440px] max-h-[810px] aspect-[16/9] object-contain shadow-2xl bg-black cursor-crosshair touch-none"
          style={{ willChange: "transform", imageRendering: "auto" }}
        />

        {/* In-Game HUD */}
        {gameState === 'PLAYING' && (
          <GameHUD
            levelId={currentLevelId}
            levelName={getLevelTitle(currentLevelId)}
            score={score}
            coins={coins}
            health={health}
            maxHealth={maxHealth}
            timeLeft={timeLeft}
            cooldownRemaining={cooldownRemaining}
            maxCooldown={2.5}
            hasSpeechAttack={true}
            bossHp={bossHp}
            bossMaxHp={bossMaxHp}
            bossName={bossName}
            isMuted={isMuted}
            isPaused={isPaused}
            onToggleMute={handleToggleMute}
            onTogglePause={handleTogglePause}
          />
        )}

        {/* Mobile / Direct Touch On-screen Controls */}
        {gameState === 'PLAYING' && !isPaused && (
          <MobileControls
            onMoveLeftStart={() => engineRef.current?.handleKeyDown('KeyA')}
            onMoveLeftEnd={() => engineRef.current?.handleKeyUp('KeyA')}
            onMoveRightStart={() => engineRef.current?.handleKeyDown('KeyD')}
            onMoveRightEnd={() => engineRef.current?.handleKeyUp('KeyD')}
            onJumpStart={() => {
              engineRef.current?.handleKeyDown('Space');
              engineRef.current?.performJump(true);
            }}
            onJumpEnd={() => engineRef.current?.handleKeyUp('Space')}
            onAttackBecause={(options) => engineRef.current?.triggerBecauseAttack(options)}
            hasSpeechAttack={true}
            cooldownRemaining={cooldownRemaining}
          />
        )}

        {/* Mid-Fight Story Dialogue Event (Phase 30%, 70%, 100%) */}
        {bossStoryEvent && (
          <BossStoryDialogModal
            event={bossStoryEvent}
            onNextOrResume={handleResumeFromStoryDialog}
            onEndGameKiss={handleEndGameKiss}
          />
        )}

        {/* Paused Overlay Modal */}
        {isPaused && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center shadow-2xl">
              <h3 className="text-xl font-bold text-stone-100 mb-2">ĐÃ TẠM DỪNG</h3>
              <p className="text-xs text-stone-400 mb-6">
                Nghỉ ngơi một lát trước khi tiếp tục hành trình giải cứu Trúc!
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleTogglePause}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Tiếp tục chơi (P / Esc)</span>
                </button>
                <button
                  onClick={() => startLevel(currentLevelId)}
                  className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại màn này</span>
                </button>
                <button
                  onClick={() => {
                    engineRef.current?.stop();
                    setGameState('TITLE_MENU');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Về màn hình chính</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          score={score}
          coins={coins}
          becauseCount={becauseShoutsCount}
          onPlayAgain={() => startLevel(1)}
          onGoToTitle={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* 6. Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          reason={gameOverReason}
          onRetry={() => startLevel(currentLevelId)}
          onGoToTitle={() => setGameState('TITLE_MENU')}
        />
      )}
    </div>
  );
}
