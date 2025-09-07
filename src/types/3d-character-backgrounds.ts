/**
 * 3D 角色背景設定相關類型定義
 */

export interface BackgroundVariant {
  name: string;
  displayName: string;
  file: string;
}

export interface BackgroundSetting {
  name: string;
  description: string;
  path: string;
  defaultFile: string;
  variants: BackgroundVariant[];
  suitableFor: string[];
}

export interface BackgroundSettings {
  backgrounds: Record<string, BackgroundSetting>;
  defaultBackground: string;
  autoSwitch: {
    enabled: boolean;
    interval: number;
    randomize: boolean;
  };
  settings: {
    quality: 'low' | 'medium' | 'high';
    format: 'webp' | 'png' | 'jpg';
    fallbackFormat: 'png' | 'jpg';
    lazyLoading: boolean;
    preload: boolean;
  };
}

export type BackgroundType = 
  | 'classroom' 
  | 'music-room' 
  | 'outdoor' 
  | 'home' 
  | 'studio' 
  | 'playground';

export interface BackgroundConfig {
  type: BackgroundType;
  variant?: string;
  customPath?: string;
}

export interface BackgroundManager {
  getBackgroundUrl(config: BackgroundConfig): string;
  getAvailableBackgrounds(): BackgroundSetting[];
  getBackgroundVariants(type: BackgroundType): BackgroundVariant[];
  preloadBackground(config: BackgroundConfig): Promise<void>;
  switchBackground(config: BackgroundConfig): void;
}

// 預設背景設定
export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  type: 'classroom',
  variant: 'morning'
};

// 背景類型對應的中文名稱
export const BACKGROUND_TYPE_NAMES: Record<BackgroundType, string> = {
  'classroom': '教室',
  'music-room': '音樂教室',
  'outdoor': '戶外',
  'home': '家庭',
  'studio': '工作室',
  'playground': '遊樂場'
};

// 背景類型對應的圖標
export const BACKGROUND_TYPE_ICONS: Record<BackgroundType, string> = {
  'classroom': '📚',
  'music-room': '🎵',
  'outdoor': '🌳',
  'home': '🏠',
  'studio': '🎤',
  'playground': '🎪'
};
