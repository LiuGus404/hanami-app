'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon,
  DocumentTextIcon,
  CogIcon,
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  ClipboardDocumentIcon,
  StarIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  MapIcon,
  QuestionMarkCircleIcon,
  KeyIcon,
  CheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { HanamiInput } from '@/components/ui';

interface MoriSettingsData {
  // 必填欄位（1欄）+ 可選欄位（10欄）
  models: string[];                 // 模型選項（必填，預設雙模型）
  topic: string;                    // 主題（可選）
  goal: string;                     // 目的
  audience: string;                 // 受眾
  deliverable: string;              // 輸出
  date_range: string;               // 時間範圍（近多少年）
  languages: string[];              // 語言
  region_bias: string[];            // 地區偏好
  key_questions: string[];          // 關鍵問題（3條）
  seed_keywords: Array<{            // 關鍵字
    kw: string;
    variants: string[];
  }>;
  evidence_criteria: string[];      // 證據標準
  
  // 建議加上（可選）
  must_cover: string[];             // 必須涵蓋
  must_avoid: string[];             // 避免
  domain_allowlist: string[];       // 來源白名單
  domain_blocklist: string[];       // 來源黑名單
  notes: string;                    // 備註
}

interface MoriSettingsProps {
  onSettingsChange?: (settings: MoriSettingsData) => void;
  className?: string;
}

export default function MoriSettings({ onSettingsChange, className = '' }: MoriSettingsProps) {
  const [settings, setSettings] = useState<MoriSettingsData>({
    // 必填欄位（1欄）+ 可選欄位（10欄）
    models: ['DeepSeek', 'ChatGPT'], // 預設雙模型（必填）
    topic: '',
    goal: '',
    audience: '',
    deliverable: '',
    date_range: '',
    languages: [],
    region_bias: [],
    key_questions: ['', '', ''],
    seed_keywords: [{ kw: '', variants: [''] }],
    evidence_criteria: [],
    
    // 建議加上（可選）
    must_cover: [],
    must_avoid: [],
    domain_allowlist: [],
    domain_blocklist: [],
    notes: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'required' | 'optional'>('required');

  // 目的選項
  const goalOptions = [
    { value: '決策支援', label: '決策支援' },
    { value: '內容產出', label: '內容產出' },
    { value: '教學設計', label: '教學設計' },
    { value: '政策制定', label: '政策制定' },
    { value: '產品開發', label: '產品開發' }
  ];

  // 受眾選項
  const audienceOptions = [
    { value: '家長', label: '家長' },
    { value: '老師', label: '老師' },
    { value: '主管', label: '主管' },
    { value: '學生', label: '學生' },
    { value: '專業人士', label: '專業人士' },
    { value: '一般大眾', label: '一般大眾' }
  ];

  // 輸出格式選項
  const deliverableOptions = [
    { value: 'brief', label: '簡報 (Brief)' },
    { value: 'report', label: '報告 (Report)' },
    { value: 'slide', label: '投影片 (Slide)' },
    { value: 'summary', label: '摘要 (Summary)' },
    { value: 'analysis', label: '分析 (Analysis)' }
  ];

  // 語言選項
  const languageOptions = [
    { value: 'zh-Hant', label: '繁體中文' },
    { value: 'zh-Hans', label: '簡體中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' }
  ];

  // 地區選項
  const regionOptions = [
    { value: 'GLOBAL', label: '全球' },
    { value: 'HK', label: '香港' },
    { value: 'TW', label: '台灣' },
    { value: 'CN', label: '中國大陸' },
    { value: 'JP', label: '日本' },
    { value: 'KR', label: '韓國' },
    { value: 'SG', label: '新加坡' },
    { value: 'MY', label: '馬來西亞' },
    { value: 'TH', label: '泰國' },
    { value: 'VN', label: '越南' },
    { value: 'PH', label: '菲律賓' },
    { value: 'ID', label: '印尼' },
    { value: 'IN', label: '印度' },
    { value: 'AU', label: '澳洲' },
    { value: 'NZ', label: '紐西蘭' },
    { value: 'US', label: '美國' },
    { value: 'CA', label: '加拿大' },
    { value: 'UK', label: '英國' },
    { value: 'DE', label: '德國' },
    { value: 'FR', label: '法國' },
    { value: 'IT', label: '義大利' },
    { value: 'ES', label: '西班牙' },
    { value: 'NL', label: '荷蘭' },
    { value: 'SE', label: '瑞典' },
    { value: 'NO', label: '挪威' },
    { value: 'DK', label: '丹麥' },
    { value: 'FI', label: '芬蘭' },
    { value: 'CH', label: '瑞士' },
    { value: 'AT', label: '奧地利' },
    { value: 'BE', label: '比利時' },
    { value: 'BR', label: '巴西' },
    { value: 'MX', label: '墨西哥' },
    { value: 'AR', label: '阿根廷' },
    { value: 'CL', label: '智利' },
    { value: 'CO', label: '哥倫比亞' },
    { value: 'RU', label: '俄羅斯' },
    { value: 'TR', label: '土耳其' },
    { value: 'SA', label: '沙烏地阿拉伯' },
    { value: 'AE', label: '阿聯酋' },
    { value: 'IL', label: '以色列' },
    { value: 'EG', label: '埃及' },
    { value: 'ZA', label: '南非' },
    { value: 'NG', label: '奈及利亞' },
    { value: 'KE', label: '肯亞' },
    { value: 'Global', label: '全球' }
  ];

  // 證據標準選項
  const evidenceCriteriaOptions = [
    { value: '可信來源', label: '可信來源' },
    { value: '方法透明', label: '方法透明' },
    { value: '近三年', label: '近三年' },
    { value: '可追溯引用', label: '可追溯引用' },
    { value: '同儕評議', label: '同儕評議' },
    { value: '官方統計', label: '官方統計' }
  ];

  // 模型選項
  const modelOptions = [
    { value: 'DeepSeek', label: 'DeepSeek' },
    { value: 'ChatGPT', label: 'ChatGPT' },
    { value: 'Gemini', label: 'Gemini' },
    { value: 'Grok', label: 'Grok' }
  ];

  // 時間範圍選項
  const dateRangeOptions = [
    { value: '1', label: '近1年' },
    { value: '2', label: '近2年' },
    { value: '3', label: '近3年' },
    { value: '5', label: '近5年' },
    { value: '10', label: '近10年' },
    { value: '不限', label: '不限時間' }
  ];

  // 當設定變化時通知父組件
  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  // 儲存設定到本地存儲
  const saveSettings = () => {
    localStorage.setItem('moriSettings', JSON.stringify(settings));
    setShowPreview(true); // 儲存後顯示預覽
  };

  // 重置為預設設定
  const resetSettings = () => {
    const defaultSettings: MoriSettingsData = {
      // 必填欄位（1欄）+ 可選欄位（10欄）
      models: ['DeepSeek', 'ChatGPT'], // 預設雙模型（必填）
      topic: '',
      goal: '',
      audience: '',
      deliverable: '',
      date_range: '',
      languages: [],
      region_bias: [],
      key_questions: ['', '', ''],
      seed_keywords: [{ kw: '', variants: [''] }],
      evidence_criteria: [],
      
      // 建議加上（可選）
      must_cover: [],
      must_avoid: [],
      domain_allowlist: [],
      domain_blocklist: [],
      notes: ''
    };
    setSettings(defaultSettings);
    localStorage.setItem('moriSettings', JSON.stringify(defaultSettings));
    setShowPreview(false); // 重置時隱藏預覽
  };

  const updateSetting = (key: keyof MoriSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 載入已儲存的設定
  const loadSavedSettings = () => {
    const savedSettings = localStorage.getItem('moriSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setShowPreview(true); // 載入後顯示預覽
        console.log('📥 載入已儲存的墨墨設定:', parsed);
      } catch (error) {
        console.error('載入墨墨設定失敗:', error);
      }
    } else {
      console.log('📭 沒有找到已儲存的墨墨設定');
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
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-[#4B4036]">墨墨研究設定</h3>
              <p className="text-sm text-[#2B3A3B]">自訂研究類型和分析參數</p>
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
        <div className="p-4">
          {/* 標籤頁切換 */}
          <div className="flex mb-4 bg-[#F8F5EC] rounded-xl p-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('required')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'required'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'text-[#4B4036] hover:bg-[#FFD59A]/20'
              }`}
            >
              <ClipboardDocumentIcon className="w-4 h-4 inline mr-1" />
              必填項目 (10)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('optional')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'optional'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'text-[#4B4036] hover:bg-[#FFD59A]/20'
              }`}
            >
              <StarIcon className="w-4 h-4 inline mr-1" />
              建議項目
            </motion.button>
          </div>

          {/* 必填項目 */}
          {activeTab === 'required' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* 1. 模型選項 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <CpuChipIcon className="w-4 h-4 inline mr-1" />
                  1. 模型選項 (models) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {modelOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const newModels = settings.models.includes(option.value)
                          ? settings.models.filter(model => model !== option.value)
                          : [...settings.models, option.value];
                        // 確保至少選擇一個模型，最多選擇四個模型
                        if (newModels.length > 0 && newModels.length <= 4) {
                          setSettings(prev => ({ ...prev, models: newModels }));
                        }
                      }}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.models.includes(option.value)
                          ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white border-blue-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">選擇AI模型（預設雙模型，最多4個）</p>
                <p className="text-xs text-amber-600 mt-1">已選擇: {settings.models.length}/4 個模型</p>
              </div>

              {/* 2. 主題 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <PencilIcon className="w-4 h-4 inline mr-1" />
                  2. 主題 (topic)
                </label>
                <HanamiInput
                  value={settings.topic}
                  onChange={(value) => updateSetting('topic', value)}
                  placeholder="例：幼兒成長研究"
                  className="w-full"
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">你要研究什麼</p>
              </div>

              {/* 3. 目的 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <SparklesIcon className="w-4 h-4 inline mr-1" />
                  3. 目的 (goal)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {goalOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateSetting('goal', option.value)}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.goal === option.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">研究成果要用來做什麼</p>
              </div>

              {/* 4. 受眾 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <UserGroupIcon className="w-4 h-4 inline mr-1" />
                  4. 受眾 (audience)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {audienceOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateSetting('audience', option.value)}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.audience === option.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">寫給誰看</p>
              </div>

              {/* 5. 輸出 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                  5. 輸出 (deliverable)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {deliverableOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateSetting('deliverable', option.value)}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.deliverable === option.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">型態與長度</p>
              </div>

              {/* 6. 時間範圍 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                  6. 時間範圍 (date_range)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {dateRangeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateSetting('date_range', option.value)}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.date_range === option.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">資料新鮮度</p>
              </div>

              {/* 7. 語言 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <GlobeAltIcon className="w-4 h-4 inline mr-1" />
                  7. 語言 (languages)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {languageOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const newLanguages = settings.languages.includes(option.value)
                          ? settings.languages.filter(lang => lang !== option.value)
                          : [...settings.languages, option.value];
                        setSettings(prev => ({ ...prev, languages: newLanguages }));
                      }}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.languages.includes(option.value)
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">檢索與輸出的語言（可多選）</p>
              </div>

              {/* 8. 地區偏好 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <MapIcon className="w-4 h-4 inline mr-1" />
                  8. 地區偏好 (region_bias)
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {regionOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const newRegions = settings.region_bias.includes(option.value)
                          ? settings.region_bias.filter(region => region !== option.value)
                          : [...settings.region_bias, option.value];
                        setSettings(prev => ({ ...prev, region_bias: newRegions }));
                      }}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.region_bias.includes(option.value)
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">優先關注地區（可多選）</p>
              </div>

              {/* 9. 關鍵問題 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <QuestionMarkCircleIcon className="w-4 h-4 inline mr-1" />
                  9. 關鍵問題 (key_questions)
                </label>
                <div className="space-y-2">
                  {settings.key_questions.map((question, index) => (
                    <HanamiInput
                      key={index}
                      value={question}
                      onChange={(value) => {
                        const newQuestions = [...settings.key_questions];
                        newQuestions[index] = value;
                        setSettings(prev => ({ ...prev, key_questions: newQuestions }));
                      }}
                      placeholder={`問題 ${index + 1}：${
                        index === 0 ? '定義/現況？' : 
                        index === 1 ? '趨勢/數據？' : 
                        '建議/風險？'
                      }`}
                      className="w-full"
                    />
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">3條核心問題</p>
              </div>

              {/* 10. 關鍵字 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <KeyIcon className="w-4 h-4 inline mr-1" />
                  10. 關鍵字 (seed_keywords)
                </label>
                {settings.seed_keywords.map((keyword, index) => (
                  <div key={index} className="space-y-2 p-3 bg-[#F8F5EC] rounded-xl border border-[#EADBC8] mb-2">
                    <HanamiInput
                      value={keyword.kw}
                      onChange={(value) => {
                        const newKeywords = [...settings.seed_keywords];
                        newKeywords[index].kw = value;
                        setSettings(prev => ({ ...prev, seed_keywords: newKeywords }));
                      }}
                      placeholder="主關鍵字 (如：幼兒成長)"
                      className="w-full"
                    />
                    <div className="space-y-1">
                      {keyword.variants.map((variant, variantIndex) => (
                        <HanamiInput
                          key={variantIndex}
                          value={variant}
                          onChange={(value) => {
                            const newKeywords = [...settings.seed_keywords];
                            newKeywords[index].variants[variantIndex] = value;
                            setSettings(prev => ({ ...prev, seed_keywords: newKeywords }));
                          }}
                          placeholder={`同義詞 ${variantIndex + 1} (如：學前發展)`}
                          className="w-full"
                        />
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const newKeywords = [...settings.seed_keywords];
                          newKeywords[index].variants.push('');
                          setSettings(prev => ({ ...prev, seed_keywords: newKeywords }));
                        }}
                        className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded"
                      >
                        + 添加同義詞
                      </motion.button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-[#2B3A3B]/70 mt-1">至少1組主關鍵字＋同義詞</p>
              </div>

              {/* 11. 證據標準 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <CheckIcon className="w-4 h-4 inline mr-1" />
                  11. 證據標準 (evidence_criteria)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {evidenceCriteriaOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const newCriteria = settings.evidence_criteria.includes(option.value)
                          ? settings.evidence_criteria.filter(criteria => criteria !== option.value)
                          : [...settings.evidence_criteria, option.value];
                        setSettings(prev => ({ ...prev, evidence_criteria: newCriteria }));
                      }}
                      className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                        settings.evidence_criteria.includes(option.value)
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-400 shadow-md'
                          : 'bg-white/80 text-[#4B4036] border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFD59A]/10'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-[#2B3A3B]/70 mt-1">判斷來源好壞（可多選）</p>
              </div>

            </motion.div>
          )}

          {/* 可選項目 */}
          {activeTab === 'optional' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* 必須涵蓋 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  必須涵蓋 (must_cover)
                </label>
                <textarea
                  value={settings.must_cover.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    must_cover: e.target.value.split('\n').filter(item => item.trim())
                  }))}
                  className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={3}
                  placeholder="每行一個要點&#10;例：教育政策影響&#10;例：家庭環境因素"
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">列出要講的內容</p>
              </div>

              {/* 避免 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <XMarkIcon className="w-4 h-4 inline mr-1" />
                  避免 (must_avoid)
                </label>
                <textarea
                  value={settings.must_avoid.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    must_avoid: e.target.value.split('\n').filter(item => item.trim())
                  }))}
                  className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={2}
                  placeholder="每行一個要點&#10;例：個人隱私&#10;例：商業機密"
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">列出不要講的內容</p>
              </div>

              {/* 來源白名單 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                  來源白名單 (domain_allowlist)
                </label>
                <textarea
                  value={settings.domain_allowlist.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    domain_allowlist: e.target.value.split('\n').filter(item => item.trim())
                  }))}
                  className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={2}
                  placeholder="每行一個網域&#10;例：site:.gov&#10;例：site:who.int"
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">優先參考的網站</p>
              </div>

              {/* 來源黑名單 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                  來源黑名單 (domain_blocklist)
                </label>
                <textarea
                  value={settings.domain_blocklist.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    domain_blocklist: e.target.value.split('\n').filter(item => item.trim())
                  }))}
                  className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={2}
                  placeholder="每行一個網域&#10;例：reddit&#10;例：quora"
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">避免參考的網站</p>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-semibold text-[#4B4036] mb-2">
                  <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
                  備註 (notes)
                </label>
                <textarea
                  value={settings.notes}
                  onChange={(e) => updateSetting('notes', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-[#EADBC8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={3}
                  placeholder="已知限制/假設..."
                />
                <p className="text-xs text-[#2B3A3B]/70 mt-1">額外說明和限制</p>
              </div>
            </motion.div>
          )}

          {/* 控制按鈕 */}
          <div className="flex space-x-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveSettings}
              className="px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
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
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-amber-700">當前設定預覽</h4>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(false)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <EyeIcon className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <span className="text-amber-600 font-medium">模型選項:</span>
                  <span className="ml-1 text-amber-800">{settings.models.length > 0 ? settings.models.join(', ') : '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">主題:</span>
                  <span className="ml-1 text-amber-800">{settings.topic || '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">目的:</span>
                  <span className="ml-1 text-amber-800">{settings.goal || '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">受眾:</span>
                  <span className="ml-1 text-amber-800">{settings.audience || '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">輸出:</span>
                  <span className="ml-1 text-amber-800">{settings.deliverable || '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">時間範圍:</span>
                  <span className="ml-1 text-amber-800">{settings.date_range || '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">語言:</span>
                  <span className="ml-1 text-amber-800">{settings.languages.length > 0 ? settings.languages.join(', ') : '未設定'}</span>
                </div>
                <div>
                  <span className="text-amber-600 font-medium">地區:</span>
                  <span className="ml-1 text-amber-800">{settings.region_bias.length > 0 ? settings.region_bias.join(', ') : '未設定'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
