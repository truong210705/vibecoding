import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, MessageSquareWarning } from 'lucide-react';
import { AttackBecauseOptions } from '../types/game';

interface MobileControlsProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onAttackBecause: (options?: AttackBecauseOptions) => void;
  hasSpeechAttack: boolean;
  cooldownRemaining?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onJumpStart,
  onJumpEnd,
  onAttackBecause,
  hasSpeechAttack,
  cooldownRemaining = 0,
}) => {
  const isOnCooldown = cooldownRemaining > 0;

  return (
    <div className="absolute inset-x-0 bottom-4 px-4 sm:px-8 z-20 flex items-end justify-between pointer-events-none select-none touch-none">
      {/* Left / Right Movement Buttons - Enlarged & Translucent Glass */}
      <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto touch-none">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveLeftStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onMoveLeftEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onMoveLeftEnd();
          }}
          className="w-18 h-18 sm:w-20 sm:h-20 bg-stone-950/55 active:bg-amber-500/60 border-2 border-white/25 active:border-amber-300/80 text-white/90 active:text-white rounded-3xl flex items-center justify-center shadow-2xl active:scale-95 touch-none cursor-pointer transition-transform"
          aria-label="Sang trái"
        >
          <ArrowLeft className="w-9 h-9 sm:w-10 sm:h-10" />
        </button>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveRightStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onMoveRightEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onMoveRightEnd();
          }}
          className="w-18 h-18 sm:w-20 sm:h-20 bg-stone-950/55 active:bg-amber-500/60 border-2 border-white/25 active:border-amber-300/80 text-white/90 active:text-white rounded-3xl flex items-center justify-center shadow-2xl active:scale-95 touch-none cursor-pointer transition-transform"
          aria-label="Sang phải"
        >
          <ArrowRight className="w-9 h-9 sm:w-10 sm:h-10" />
        </button>
      </div>

      {/* Right Action Buttons: Jump & BECAUSE - Enlarged & Translucent Glass */}
      <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto touch-none">
        {hasSpeechAttack && (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAttackBecause();
            }}
            disabled={isOnCooldown}
            className={`w-18 h-18 sm:w-20 sm:h-20 border-2 rounded-3xl flex flex-col items-center justify-center shadow-2xl active:scale-95 touch-none cursor-pointer transition-all ${
              isOnCooldown
                ? 'bg-stone-900/20 border-stone-600/30 text-stone-400 opacity-60 cursor-not-allowed'
                : 'bg-amber-500/25 active:bg-amber-500/50 border-amber-300/40 active:border-amber-300 text-amber-200'
            }`}
            aria-label="Tung chiêu BECAUSE (Chạm màn hình hoặc nút)"
          >
            <MessageSquareWarning className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[10px] font-black tracking-tight mt-0.5">BECAUSE!</span>
            {isOnCooldown && (
              <span className="text-[9px] font-mono text-amber-300 font-bold -mt-0.5">
                {cooldownRemaining.toFixed(1)}s
              </span>
            )}
          </button>
        )}

        {/* Jump Button: Extra large, comfortable, translucent emerald glass */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onJumpStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          className="w-20 h-20 sm:w-22 sm:h-22 bg-emerald-700/55 active:bg-emerald-500/70 border-2 border-emerald-400/40 active:border-emerald-300 text-white rounded-3xl flex flex-col items-center justify-center shadow-2xl active:scale-95 touch-none cursor-pointer transition-transform"
          aria-label="Nhảy cao"
        >
          <ArrowUp className="w-9 h-9 sm:w-10 sm:h-10" />
          <span className="text-[11px] tracking-tight -mt-1 font-extrabold">NHẢY</span>
        </button>
      </div>
    </div>
  );
};
