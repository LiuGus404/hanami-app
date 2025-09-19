'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PaintBrushIcon,
  PhotoIcon,
  CogIcon,
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { HanamiInput, HanamiSelect } from '@/components/ui';

interface PicoSettingsData {
  defaultStyle: string;
  customStyle: string;
  defaultScene: string;
  customScene: string;
  systemPrompt: string;
  defaultSize: string;
  customSize: string;
}

interface PicoSettingsProps {
  onSettingsChange?: (settings: PicoSettingsData) => void;
  className?: string;
}

export default function PicoSettings({ onSettingsChange, className = '' }: PicoSettingsProps) {
  const [settings, setSettings] = useState<PicoSettingsData>({
    defaultStyle: '其他',
    customStyle: '',
    defaultScene: '其他',
    customScene: '',
    systemPrompt: '',
    defaultSize: '其他',
    customSize: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 預設風格選項
  const styleOptions = [
    { value: 'kawaii', label: '可愛風格 (Kawaii)' },
    { value: 'anime', label: '動漫風格 (Anime)' },
    { value: 'watercolor', label: '水彩風格 (Watercolor)' },
    { value: 'cartoon', label: '卡通風格 (Cartoon)' },
    { value: 'realistic', label: '寫實風格 (Realistic)' },
    { value: 'minimalist', label: '簡約風格 (Minimalist)' },
    { value: 'chibi', label: 'Q版風格 (Chibi)' },
    { value: 'pastel', label: '粉彩風格 (Pastel)' },
    { value: '其他', label: '其他 (自訂)' }
  ];

  // 預設場景選項
  const sceneOptions = [
    { value: '溫馨室內', label: '溫馨室內' },
    { value: '自然戶外', label: '自然戶外' },
    { value: '夢幻森林', label: '夢幻森林' },
    { value: '海邊沙灘', label: '海邊沙灘' },
    { value: '城市街景', label: '城市街景' },
    { value: '咖啡廳', label: '咖啡廳' },
    { value: '花園庭院', label: '花園庭院' },
    { value: '星空夜景', label: '星空夜景' },
    { value: '童話世界', label: '童話世界' },
    { value: '簡約背景', label: '簡約背景' },
    { value: '其他', label: '其他 (自訂)' }
  ];

  // 圖片尺寸選項（包含紙本大小）
  const sizeOptions = [
    // 標準數位尺寸
    { value: '512x512', label: '正方形 (512x512)' },
    { value: '1024x1024', label: '高清正方形 (1024x1024)' },
    { value: '1024x768', label: '橫向 (1024x768)' },
    { value: '768x1024', label: '縱向 (768x1024)' },
    { value: '1920x1080', label: '全高清橫向 (1920x1080)' },
    { value: '1080x1920', label: '全高清縱向 (1080x1920)' },
    // 紙本大小
    { value: 'A4', label: 'A4 紙本 (210×297mm)' },
    { value: 'A3', label: 'A3 紙本 (297×420mm)' },
    { value: 'B5', label: 'B5 紙本 (176×250mm)' },
    { value: 'A5', label: 'A5 紙本 (148×210mm)' },
    { value: 'Letter', label: 'Letter 紙本 (216×279mm)' },
    { value: '其他', label: '其他 (自訂)' }
  ];

  // 當設定變化時通知父組件
  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  // 不自動載入儲存的設定，保持空白狀態
  // useEffect(() => {
  //   const savedSettings = localStorage.getItem('picoSettings');
  //   if (savedSettings) {
  //     try {
  //       const parsed = JSON.parse(savedSettings);
  //       setSettings(parsed);
  //     } catch (error) {
  //       console.error('載入皮可設定失敗:', error);
  //     }
  //   }
  // }, []);

  // 儲存設定到本地存儲
  const saveSettings = () => {
    localStorage.setItem('picoSettings', JSON.stringify(settings));
    setShowPreview(true); // 儲存後顯示預覽
  };

  // 重置為預設設定
  const resetSettings = () => {
    const defaultSettings: PicoSettingsData = {
      defaultStyle: '其他',
      customStyle: '',
      defaultScene: '其他',
      customScene: '',
      systemPrompt: '',
      defaultSize: '其他',
      customSize: ''
    };
    setSettings(defaultSettings);
    localStorage.setItem('picoSettings', JSON.stringify(defaultSettings));
    setShowPreview(false); // 重置時隱藏預覽
  };

  const updateSetting = (key: keyof PicoSettingsData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 載入已儲存的設定
  const loadSavedSettings = () => {
    const savedSettings = localStorage.getItem('picoSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setShowPreview(true); // 載入後顯示預覽
        console.log('📥 載入已儲存的設定:', parsed);
      } catch (error) {
        console.error('載入皮可設定失敗:', error);
      }
    } else {
      console.log('📭 沒有找到已儲存的設定');
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] ${className}`}>
      {/* 標題和展開/收合按鈕 */}
      <div className="p-4 border-b border-[#EADBC8]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
              <PaintBrushIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-[#4B4036]">皮可創作設定</h3>
              <p className="text-sm text-[#2B3A3B]">自訂繪圖風格和預設參數</p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#4B4036]"
          >
            <CogIcon className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>

      {/* 設定內容 */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* 預設風格 */}
          <div>
            <label className="block text-sm font-semibold text-[#4B4036] mb-2">
              <SparklesIcon className="w-4 h-4 inline mr-1" />
              預設繪圖風格
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateSetting('defaultStyle', option.value)}
                    className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                      settings.defaultStyle === option.value
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-[#FFB6C1] shadow-md'
                        : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
              {settings.defaultStyle === '其他' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  <HanamiInput
                    value={settings.customStyle}
                    onChange={(value) => updateSetting('customStyle', value)}
                    placeholder="輸入自訂風格..."
                    className="w-full"
                  />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-[#2B3A3B]/70 mt-1">
              當用戶沒有指定風格時，皮可將使用此預設風格
            </p>
          </div>

          {/* 預設場景 */}
          <div>
            <label className="block text-sm font-semibold text-[#4B4036] mb-2">
              <PhotoIcon className="w-4 h-4 inline mr-1" />
              預設場景背景
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {sceneOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateSetting('defaultScene', option.value)}
                    className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                      settings.defaultScene === option.value
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-[#FFB6C1] shadow-md'
                        : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
              {settings.defaultScene === '其他' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  <HanamiInput
                    value={settings.customScene}
                    onChange={(value) => updateSetting('customScene', value)}
                    placeholder="輸入自訂場景..."
                    className="w-full"
                  />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-[#2B3A3B]/70 mt-1">
              當用戶沒有指定場景時，皮可將使用此預設場景
            </p>
          </div>

          {/* 預設尺寸 */}
          <div>
            <label className="block text-sm font-semibold text-[#4B4036] mb-2">
              <EyeIcon className="w-4 h-4 inline mr-1" />
              預設圖片尺寸
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {sizeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateSetting('defaultSize', option.value)}
                    className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                      settings.defaultSize === option.value
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-[#FFB6C1] shadow-md'
                        : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
              {settings.defaultSize === '其他' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  <HanamiInput
                    value={settings.customSize}
                    onChange={(value) => updateSetting('customSize', value)}
                    placeholder="輸入自訂尺寸 (如: 1200x800)..."
                    className="w-full"
                  />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-[#2B3A3B]/70 mt-1">
              當用戶沒有指定尺寸時，皮可將使用此預設尺寸
            </p>
          </div>

          {/* 系統指引 */}
          <div>
            <label className="block text-sm font-semibold text-[#4B4036] mb-2">
              <CogIcon className="w-4 h-4 inline mr-1" />
              系統指引提示
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
              rows={3}
              placeholder="輸入皮可的系統指引和個性設定..."
            />
            <p className="text-xs text-[#2B3A3B]/70 mt-1">
              定義皮可的個性和回應風格
            </p>
          </div>

          {/* 控制按鈕 */}
          <div className="flex space-x-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveSettings}
              className="px-3 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              title="儲存設定"
            >
              <CogIcon className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadSavedSettings}
              className="px-3 py-2 bg-green-100 border border-green-300 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-all"
              title="載入已儲存的設定"
            >
              <FolderOpenIcon className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-2 rounded-xl font-medium transition-all border ${
                showPreview 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white/80 border-[#EADBC8] text-[#4B4036] hover:bg-[#FFD59A]/20'
              }`}
              title="切換預覽顯示"
            >
              <EyeIcon className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetSettings}
              className="px-3 py-2 bg-white/80 border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium hover:bg-[#FFD59A]/20 transition-all"
              title="重置為空白"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {/* 預覽資訊 - 只在儲存後顯示 */}
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-blue-700">當前設定預覽</h4>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(false)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <EyeIcon className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <span className="text-blue-600 font-medium">風格:</span>
                  <span className="ml-1 text-blue-800">
                    {(() => {
                      const effectiveStyle = settings.defaultStyle === '其他' ? settings.customStyle : settings.defaultStyle;
                      return effectiveStyle && effectiveStyle.trim() !== '' ? 
                        (settings.defaultStyle === '其他' ? effectiveStyle : styleOptions.find(s => s.value === settings.defaultStyle)?.label) : 
                        '未設定';
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">場景:</span>
                  <span className="ml-1 text-blue-800">
                    {(() => {
                      const effectiveScene = settings.defaultScene === '其他' ? settings.customScene : settings.defaultScene;
                      return effectiveScene && effectiveScene.trim() !== '' ? effectiveScene : '未設定';
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">尺寸:</span>
                  <span className="ml-1 text-blue-800">
                    {(() => {
                      const effectiveSize = settings.defaultSize === '其他' ? settings.customSize : settings.defaultSize;
                      return effectiveSize && effectiveSize.trim() !== '' ? 
                        (settings.defaultSize === '其他' ? effectiveSize : sizeOptions.find(s => s.value === settings.defaultSize)?.label) : 
                        '未設定';
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">系統指引:</span>
                  <span className="ml-1 text-blue-800">
                    {settings.systemPrompt && settings.systemPrompt.trim() !== '' ? '已設定' : '未設定'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
