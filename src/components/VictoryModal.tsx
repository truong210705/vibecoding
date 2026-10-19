import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Sparkles, Heart } from 'lucide-react';
import portraitPhuocTruc from '../assets/images/phuoc_truc_reunited_1792344680888.jpg';
import familyEndGameImg from '../assets/images/phuoc_truc_family_otters_1792348195628.jpg';
import { getPhuocAvatar, subscribePhuocAvatar } from '../utils/avatarManager';

interface VictoryModalProps {
  score: number;
  coins: number;
  becauseCount: number;
  onPlayAgain: () => void;
  onGoToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  coins,
  becauseCount,
  onPlayAgain,
  onGoToTitle,
}) => {
  const [phuocAvatar, setPhuocAvatarState] = useState<string>(getPhuocAvatar());

  useEffect(() => {
    return subscribePhuocAvatar((newUrl) => {
      setPhuocAvatarState(newUrl);
    });
  }, []);

  const hasCustomPhoto = phuocAvatar.startsWith('data:image');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-stone-950/95 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-2xl bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-5 md:p-7 shadow-2xl text-center flex flex-col items-center">
        {/* Victory Badge */}
        <div className="flex items-center gap-2 mb-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-extrabold text-xs tracking-wider">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>ĐẠI THẮNG BÁ HỘ LONG – PHƯỚC & TRÚC SUM VẦY</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-amber-300 tracking-tight mb-1">
          HẠNH PHÚC VIÊN MÃN BÊN SÔNG BUÔNG!
        </h2>
        <p className="text-xs md:text-sm text-stone-300 mb-4 max-w-lg">
          Bá Hộ Long đã bị đánh gục và quỳ gục xin lỗi! Phước chạy tới ôm hôn Trúc trong nước mắt hạnh phúc. Mối tình chân chất đã đơm hoa kết trái!
        </p>

        {/* Grand Happy Family Epilogue Illustration with Otters */}
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl mb-4 bg-stone-950 max-h-[300px]">
          <img
            src={familyEndGameImg}
            alt="Phước và Trúc bên đàn con và bầy rái cá Sông Buông"
            className="w-full h-full object-cover max-h-[300px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 inset-x-0 bg-stone-950/85 backdrop-blur-xs py-2 px-3 text-xs md:text-sm font-bold text-pink-300 flex items-center justify-center gap-2 border-t border-amber-500/30">
            <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
            <span>Tương Lai Hạnh Phúc: Phước & Trúc cùng những đứa con bên đàn rái cá</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3 bg-stone-950/60 border border-stone-800 rounded-xl p-3 mb-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400">Tổng Điểm</span>
            <span className="font-mono font-bold text-lg text-emerald-400 tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col border-x border-stone-800">
            <span className="text-[11px] text-stone-400">Sen Vàng</span>
            <span className="font-mono font-bold text-lg text-amber-400 tabular-nums">{coins} 🪷</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400">Lời Nói BECAUSE</span>
            <span className="font-mono font-bold text-lg text-sky-400 tabular-nums">{becauseCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Lại Từ Đầu</span>
          </button>
          <button
            onClick={onGoToTitle}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm rounded-xl border border-stone-700 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Màn Hình Chính</span>
          </button>
        </div>
      </div>
    </div>
  );
};
