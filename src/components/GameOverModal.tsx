import React from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  reason?: string;
  onRetry: () => void;
  onGoToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  reason,
  onRetry,
  onGoToTitle,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-stone-900 border border-rose-500/40 rounded-2xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center mb-3 text-rose-400">
          <Skull className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-extrabold text-rose-400 tracking-tight mb-1">
          CHƯA THỂ CỨU ĐƯỢC TRÚC!
        </h2>
        <p className="text-xs text-rose-300 font-semibold mb-1">
          {reason || 'Phước đã kiệt sức trước các cửa ải hiểm trở.'}
        </p>
        <p className="text-xs text-stone-400 mb-4">
          Đừng bỏ cuộc, bé Trúc vẫn đang đợi Phước! Hãy nhặt Trái Tim để hồi máu và thêm thời gian!
        </p>

        <div className="w-full bg-stone-950/60 border border-stone-800 rounded-xl p-3 mb-6">
          <span className="text-xs text-stone-400">Điểm số tích lũy: </span>
          <span className="font-mono font-bold text-amber-400 tabular-nums">{score}</span>
        </div>

        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử Lại Ngay</span>
          </button>
          <button
            onClick={onGoToTitle}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm rounded-xl border border-stone-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Chính</span>
          </button>
        </div>
      </div>
    </div>
  );
};
