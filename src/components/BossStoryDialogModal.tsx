import React, { useState } from 'react';
import { ArrowRight, Swords, Heart } from 'lucide-react';
import { BossStoryEvent } from '../types/game';
import { getBaHoLongAvatar } from '../utils/avatarManager';

interface BossStoryDialogModalProps {
  event: BossStoryEvent;
  onNextOrResume: () => void;
  onEndGameKiss: () => void;
}

export const BossStoryDialogModal: React.FC<BossStoryDialogModalProps> = ({
  event,
  onNextOrResume,
  onEndGameKiss,
}) => {
  const [dialogIdx, setDialogIdx] = useState<number>(0);
  const baHoLongAvatar = getBaHoLongAvatar();

  const isFinalPhase = event.stage === 'phase3_100';
  const hasMultipleDialogs = event.dialogues.length > 1;
  const isLastLine = dialogIdx >= event.dialogues.length - 1;

  const handleAction = () => {
    if (isFinalPhase) {
      onEndGameKiss();
      return;
    }

    if (hasMultipleDialogs && !isLastLine) {
      setDialogIdx(dialogIdx + 1);
    } else {
      onNextOrResume();
    }
  };

  const currentText = event.dialogues[dialogIdx] || event.dialogues[0];

  // Visual mood tag based on battle phase
  let badgeText = 'ĐỐI THOẠI CHIẾN ĐẤU';
  let badgeColor = 'text-amber-400 border-amber-500/40 bg-amber-950/60';
  if (event.stage === 'phase1_30') {
    badgeText = 'BÁ HỘ LONG BỊ THẤT THẾ (MẤT 30% MÁU)';
    badgeColor = 'text-amber-400 border-amber-500/40 bg-amber-950/60';
  } else if (event.stage === 'phase2_70') {
    badgeText = 'BÁ HỘ LONG HOẢNG LOẠN (MẤT 70% MÁU)';
    badgeColor = 'text-rose-400 border-rose-500/40 bg-rose-950/60';
  } else if (event.stage === 'phase3_100') {
    badgeText = 'BÁ HỘ LONG QUỲ GỤC CHỊU THUA (100% MÁU)';
    badgeColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60';
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-4 md:p-8 bg-stone-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-stone-900/95 border-2 border-amber-500/70 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row gap-5 items-center">
        {/* Left: Prominent Portrait of Boss Bá Hộ Long */}
        <div className="relative shrink-0 w-32 h-36 md:w-44 md:h-48 rounded-xl overflow-hidden border-2 border-purple-500/70 shadow-lg bg-stone-950 flex flex-col items-center">
          <img
            src={baHoLongAvatar}
            alt="Bá Hộ Long"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 inset-x-0 bg-purple-950/90 py-1 text-center text-[11px] font-extrabold text-purple-200 uppercase tracking-wider">
            Bá Hộ Long
          </div>
        </div>

        {/* Right: Dramatic Story Box */}
        <div className="flex-1 w-full flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}
              >
                {badgeText}
              </span>
              {hasMultipleDialogs && (
                <span className="text-xs text-stone-400">
                  {dialogIdx + 1} / {event.dialogues.length}
                </span>
              )}
            </div>

            <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 my-2">
              <p className="text-lg md:text-2xl font-black text-amber-300 tracking-wide font-sans leading-snug">
                "{currentText}"
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAction}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm md:text-base tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer ${
                isFinalPhase
                  ? 'bg-rose-500 hover:bg-rose-400 text-stone-950 shadow-rose-900/50'
                  : hasMultipleDialogs && !isLastLine
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
              }`}
            >
              {isFinalPhase ? (
                <>
                  <Heart className="w-5 h-5 fill-current text-rose-950" />
                  <span>Đoàn Tụ & Hôn Trúc ❤️</span>
                </>
              ) : hasMultipleDialogs && !isLastLine ? (
                <>
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  <span>Đánh tiếp!</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
