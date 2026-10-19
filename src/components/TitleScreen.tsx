import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import coverImg from '../assets/images/game_cover_river_bridge_1792342229161.jpg';
import { getPhuocAvatar, subscribePhuocAvatar } from '../utils/avatarManager';
import { AvatarUploaderButton } from './AvatarUploaderButton';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenStory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenStory,
  isMuted,
  onToggleMute,
}) => {
  const [phuocAvatar, setPhuocAvatarState] = useState<string>(getPhuocAvatar());

  useEffect(() => {
    return subscribePhuocAvatar((newUrl) => {
      setPhuocAvatarState(newUrl);
    });
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Background with subtle pan & contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={coverImg}
          alt="Cầu Sông Buông"
          className="w-full h-full object-cover brightness-75 scale-105 transition-transform duration-10000 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-900/60" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>PHIÊN BẢN ĐI CẢNH 2D · CẦU SÔNG BUÔNG</span>
        </div>
        <div className="flex items-center gap-2">
          <AvatarUploaderButton variant="compact" />
          <button
            onClick={onToggleMute}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900/80 border border-stone-700/80 text-stone-200 text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="whitespace-nowrap">{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>
        </div>
      </div>

      {/* Main Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto my-auto">
        {/* Real Phuoc Avatar Badge */}
        <div className="flex items-center gap-2.5 bg-stone-900/85 border border-amber-400/60 rounded-full px-3.5 py-1.5 mb-3 shadow-lg">
          <img
            src={phuocAvatar}
            alt="Phước"
            className="w-8 h-8 rounded-full object-cover border-2 border-amber-300"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-bold text-amber-300 tracking-wide">Nhân vật chính: Phước (Sông Buông)</span>
        </div>

        {/* Inline bespoke SVG Title */}
        <div className="mb-2">
          <svg className="w-full max-w-xl h-24" viewBox="0 0 600 100">
            <defs>
              <linearGradient id="titleGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
              </filter>
            </defs>
            <text
              x="300"
              y="50"
              textAnchor="middle"
              className="font-extrabold tracking-wider"
              style={{
                fontFamily: '"Rowdies", "Plus Jakarta Sans", sans-serif',
                fontSize: '44px',
                fill: 'url(#titleGold)',
                stroke: '#451A03',
                strokeWidth: '4px',
                filter: 'url(#shadow)',
              }}
            >
              HÀNH TRÌNH PHƯỚC
            </text>
            <text
              x="300"
              y="86"
              textAnchor="middle"
              className="font-bold tracking-widest text-emerald-300"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '20px',
                fill: '#6EE7B7',
                letterSpacing: '0.25em',
                filter: 'url(#shadow)',
              }}
            >
              GIẢI CỨU TRÚC · CẦU SÔNG BUÔNG
            </text>
          </svg>
        </div>

        {/* Narrative Teaser */}
        <p className="text-stone-300 text-sm md:text-base max-w-xl leading-relaxed mb-6">
          Chàng trai Phước chân chất hàng ngày chơi với rái cá bên cầu Sông Buông. Bỗng một ngày,
          Bá hộ Long giàu có cướp cô em Trúc đi mất! Phước quyết tâm đạp rái cá vượt sông,
          dùng lời lẽ <span className="text-amber-300 font-bold">"BECAUSE!"</span> đanh thép hạ gục Boss Công An để giải cứu người thương!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartGame}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>BẮT ĐẦU CHƠI (SPACE / ENTER)</span>
          </button>

          <button
            onClick={onOpenStory}
            className="flex items-center gap-2 px-5 py-3.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 font-bold text-sm rounded-xl transition-all whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>XEM CỐT TRUYỆN TRANH</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Footer */}
      <div className="relative z-10 py-3 px-4 bg-stone-950/80 border-t border-stone-800 text-center text-xs text-stone-400">
        <span className="font-semibold text-stone-200">A / D hoặc Mũi Tên</span>: Di chuyển ·{' '}
        <span className="font-semibold text-stone-200">Space / W</span>: Nhảy đạp rái cá ·{' '}
        <span className="font-semibold text-amber-300">Chuột Trái hoặc F</span>: Lời nói "BECAUSE!" (Màn 2) ·{' '}
        <span className="font-semibold text-stone-200">P / Esc</span>: Tạm dừng
      </div>
    </div>
  );
};
