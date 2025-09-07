/**
 * 3D 角色背景管理器
 * 負責管理不同場景的背景圖片載入和切換
 */

import { 
  BackgroundConfig, 
  BackgroundManager, 
  BackgroundSetting, 
  BackgroundVariant,
  BackgroundType,
  BACKGROUND_TYPE_NAMES,
  BACKGROUND_TYPE_ICONS
} from '@/types/3d-character-backgrounds';

class CharacterBackgroundManager implements BackgroundManager {
  private settings: any = null;
  private preloadedImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.loadSettings();
  }

  /**
   * 載入背景設定
   */
  private async loadSettings() {
    try {
      const response = await fetch('/3d-character-backgrounds/background-settings.json');
      this.settings = await response.json();
    } catch (error) {
      console.error('載入背景設定失敗:', error);
      // 使用預設設定
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * 獲取預設設定
   */
  private getDefaultSettings() {
    return {
      backgrounds: {
        classroom: {
          name: '教室',
          description: '一般教室場景',
          path: '/3d-character-backgrounds/classroom/',
          defaultFile: 'classroom_morning_v1.png',
          variants: [
            { name: 'morning', displayName: '早晨', file: 'classroom_morning_v1.png' }
          ],
          suitableFor: ['基礎學習', '理論課程']
        }
      },
      defaultBackground: 'classroom',
      settings: {
        quality: 'high',
        format: 'webp',
        fallbackFormat: 'png',
        lazyLoading: true,
        preload: true
      }
    };
  }

  /**
   * 獲取背景圖片 URL
   */
  getBackgroundUrl(config: BackgroundConfig): string {
    if (config.customPath) {
      return config.customPath;
    }

    const background = this.settings?.backgrounds[config.type];
    if (!background) {
      return this.getFallbackUrl();
    }

    let fileName = background.defaultFile;
    
    if (config.variant) {
      const variant = background.variants?.find((v: any) => v.name === config.variant);
      if (variant) {
        fileName = variant.file;
      }
    }

    return `${background.path}${fileName}`;
  }

  /**
   * 獲取備用背景 URL
   */
  private getFallbackUrl(): string {
    return '/3d-character-backgrounds/classroom/classroom_morning_v1.png';
  }

  /**
   * 獲取可用的背景設定
   */
  getAvailableBackgrounds(): BackgroundSetting[] {
    if (!this.settings?.backgrounds) {
      return [];
    }

    return Object.values(this.settings.backgrounds);
  }

  /**
   * 獲取指定背景類型的變體
   */
  getBackgroundVariants(type: BackgroundType): BackgroundVariant[] {
    const background = this.settings?.backgrounds[type];
    return background?.variants || [];
  }

  /**
   * 預載入背景圖片
   */
  async preloadBackground(config: BackgroundConfig): Promise<void> {
    const url = this.getBackgroundUrl(config);
    const cacheKey = `${config.type}_${config.variant || 'default'}`;

    if (this.preloadedImages.has(cacheKey)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.set(cacheKey, img);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * 切換背景
   */
  switchBackground(config: BackgroundConfig): void {
    const url = this.getBackgroundUrl(config);
    
    // 觸發自定義事件，讓組件知道背景已切換
    const event = new CustomEvent('backgroundChanged', {
      detail: { config, url }
    });
    window.dispatchEvent(event);
  }

  /**
   * 獲取背景類型的中文名稱
   */
  getBackgroundTypeName(type: BackgroundType): string {
    return BACKGROUND_TYPE_NAMES[type] || type;
  }

  /**
   * 獲取背景類型的圖標
   */
  getBackgroundTypeIcon(type: BackgroundType): string {
    return BACKGROUND_TYPE_ICONS[type] || '🎯';
  }

  /**
   * 根據活動類型推薦背景
   */
  recommendBackground(activityType: string): BackgroundConfig {
    const activityTypeLower = activityType.toLowerCase();
    
    if (activityTypeLower.includes('音樂') || activityTypeLower.includes('鋼琴')) {
      return { type: 'music-room', variant: 'elegant' };
    }
    
    if (activityTypeLower.includes('戶外') || activityTypeLower.includes('自然')) {
      return { type: 'outdoor', variant: 'sunny' };
    }
    
    if (activityTypeLower.includes('遊戲') || activityTypeLower.includes('互動')) {
      return { type: 'playground', variant: 'colorful' };
    }
    
    if (activityTypeLower.includes('錄音') || activityTypeLower.includes('創作')) {
      return { type: 'studio', variant: 'modern' };
    }
    
    if (activityTypeLower.includes('家庭') || activityTypeLower.includes('親子')) {
      return { type: 'home', variant: 'cozy' };
    }
    
    // 預設使用教室
    return { type: 'classroom', variant: 'morning' };
  }

  /**
   * 清理預載入的圖片
   */
  clearPreloadedImages(): void {
    this.preloadedImages.clear();
  }
}

// 創建單例實例
export const backgroundManager = new CharacterBackgroundManager();

// 導出類型
export type { BackgroundConfig, BackgroundManager };

