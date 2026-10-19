import React, { useRef, useState, useEffect } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import {
  setPhuocAvatar,
  getPhuocAvatar,
  subscribePhuocAvatar,
  setBaHoLongAvatar,
  getBaHoLongAvatar,
  subscribeBaHoLongAvatar,
} from '../utils/avatarManager';

interface AvatarUploaderButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
  target?: 'phuoc' | 'baholong';
}

export const AvatarUploaderButton: React.FC<AvatarUploaderButtonProps> = ({
  className = '',
  variant = 'compact',
  target = 'phuoc',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false);

  useEffect(() => {
    const checkState = () => {
      const current = target === 'phuoc' ? getPhuocAvatar() : getBaHoLongAvatar();
      setHasCustomPhoto(current.startsWith('data:image'));
    };

    checkState();
    const unsubscribe =
      target === 'phuoc'
        ? subscribePhuocAvatar(() => checkState())
        : subscribeBaHoLongAvatar(() => checkState());

    return () => unsubscribe();
  }, [target]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'phuoc') {
          setPhuocAvatar(reader.result);
        } else {
          setBaHoLongAvatar(reader.result);
        }
        setHasCustomPhoto(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const labelDefault =
    target === 'phuoc'
      ? variant === 'full'
        ? 'Chọn ảnh gốc phước-removebg-preview.png'
        : 'Chọn ảnh gốc Phước'
      : variant === 'full'
      ? 'Chọn ảnh gốc Long.jpg cho Bá Hộ'
      : 'Chọn ảnh gốc Bá Hộ Long';

  const labelActive =
    target === 'phuoc'
      ? 'Đang dùng ảnh gốc Phước (Đổi ảnh)'
      : 'Đang dùng ảnh gốc Bá Hộ Long (Đổi ảnh)';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          hasCustomPhoto
            ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 hover:bg-emerald-900/80'
            : target === 'baholong'
            ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 hover:bg-purple-900/80 shadow-md'
            : 'bg-amber-950/80 border-amber-500/80 text-amber-200 hover:bg-amber-900/80 shadow-md'
        }`}
        title={`Tải ảnh gốc ${target === 'phuoc' ? 'phước-removebg-preview.png' : 'Long.jpg'} vào game`}
      >
        {hasCustomPhoto ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{labelActive}</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            <span>{labelDefault}</span>
          </>
        )}
      </button>
    </div>
  );
};
