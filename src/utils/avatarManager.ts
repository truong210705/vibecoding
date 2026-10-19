/**
 * Avatar & Character Manager
 * Manages original uploaded photos for Phước and Bá Hộ Long
 * and ensures instant reactive updates across the entire application.
 */

import defaultPhuocAvatar from '../assets/images/phuoc_real_avatar_1792344663444.jpg';
import defaultBaHoLongAvatar from '../assets/images/ba_ho_long_las_streetwear_1792349486434.jpg';

const PHUOC_STORAGE_KEY = 'phuoc_original_custom_avatar';
const BAHOLONG_STORAGE_KEY = 'baholong_original_custom_avatar';

type Listener = (avatarUrl: string) => void;
const phuocListeners = new Set<Listener>();
const baHoLongListeners = new Set<Listener>();

// --- Phước ---
export function getPhuocAvatar(): string {
  try {
    const saved = localStorage.getItem(PHUOC_STORAGE_KEY);
    if (saved && saved.startsWith('data:image')) {
      return saved;
    }
  } catch {
    // ignore
  }
  return defaultPhuocAvatar;
}

export function setPhuocAvatar(dataUrl: string) {
  try {
    localStorage.setItem(PHUOC_STORAGE_KEY, dataUrl);
  } catch {
    // ignore
  }
  phuocListeners.forEach((fn) => fn(dataUrl));
}

export function subscribePhuocAvatar(listener: Listener): () => void {
  phuocListeners.add(listener);
  return () => {
    phuocListeners.delete(listener);
  };
}

// --- Bá Hộ Long ---
export function getBaHoLongAvatar(): string {
  try {
    const saved = localStorage.getItem(BAHOLONG_STORAGE_KEY);
    if (saved && saved.startsWith('data:image')) {
      return saved;
    }
  } catch {
    // ignore
  }
  return defaultBaHoLongAvatar;
}

export function setBaHoLongAvatar(dataUrl: string) {
  try {
    localStorage.setItem(BAHOLONG_STORAGE_KEY, dataUrl);
  } catch {
    // ignore
  }
  baHoLongListeners.forEach((fn) => fn(dataUrl));
}

export function subscribeBaHoLongAvatar(listener: Listener): () => void {
  baHoLongListeners.add(listener);
  return () => {
    baHoLongListeners.delete(listener);
  };
}
