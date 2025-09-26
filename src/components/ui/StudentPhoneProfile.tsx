'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  User, 
  Brain, 
  Heart, 
  Target, 
  AlertCircle, 
  AlertTriangle,
  Star,
  Calendar,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  Sparkles,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  Wand2
} from 'lucide-react';
import { HanamiCard } from './HanamiCard';
import { HanamiButton } from './HanamiButton';

interface PhoneProfile {
  id: string;
  phone: string;
  user_id?: string;
  person_name?: string;
  personality_traits?: string;
  needs?: string;
  attitude?: string;
  attention_notes?: string;
  level: 'A' | 'B' | 'C' | 'D';
  important_notes?: string;
  analysis_raw_md?: string;
  analysis_structured?: any;
  analysis_model?: string;
  last_analysis_at?: string;
  analysis_version?: string;
  created_at: string;
  updated_at: string;
}

interface StudentPhoneProfileProps {
  studentId: string;
  studentPhone: string;
  studentName: string;
  className?: string;
}

export default function StudentPhoneProfile({ 
  studentId, 
  studentPhone, 
  studentName,
  className = '' 
}: StudentPhoneProfileProps) {
  const [phoneProfile, setPhoneProfile] = useState<PhoneProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  useEffect(() => {
    if (!studentPhone) {
      setLoading(false);
      return;
    }

    const fetchPhoneProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/phone-profiles/${encodeURIComponent(studentPhone)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setPhoneProfile(null);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPhoneProfile(data);
      } catch (err) {
        console.error('獲取電話檔案失敗:', err);
        setError(err instanceof Error ? err.message : '獲取電話檔案時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoneProfile();
  }, [studentPhone]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'A': return '優秀';
      case 'B': return '良好';
      case 'C': return '一般';
      case 'D': return '需關注';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <HanamiCard className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCD58B] mr-3" />
            <span className="text-[#2B3A3B]">載入AI檔案分析中...</span>
          </div>
        </HanamiCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <HanamiCard className="p-6">
          <div className="flex items-center text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>載入AI檔案失敗: {error}</span>
          </div>
        </HanamiCard>
      </div>
    );
  }

  if (!phoneProfile) {
    return (
      <div className={`${className}`}>
        <HanamiCard className="p-6">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-[#FFD59A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-2">尚未建立AI分析</h3>
            <p className="text-[#2B3A3B]/70 mb-4">
              此學生的電話號碼 {studentPhone} 尚未在系統中建立個人AI分析
            </p>
            <HanamiButton 
              variant="secondary" 
              size="sm"
              onClick={() => window.open(`/admin/phone-profiles/create?phone=${encodeURIComponent(studentPhone)}&studentId=${studentId}`, '_blank')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              建立電話檔案
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 標題區域 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl mr-4 shadow-sm">
                <Wand2 className="w-6 h-6 text-[#2B3A3B]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2B3A3B]">AI分析</h2>
                <p className="text-[#2B3A3B]/70">AI 智能分析與個人化洞察</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getLevelColor(phoneProfile.level)}`}>
              <Star className="w-4 h-4 inline mr-1" />
              {getLevelText(phoneProfile.level)}
            </div>
          </div>
        </div>

        {/* 基本資訊卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <HanamiCard className="mb-6">
            <div 
              className="flex items-center justify-between cursor-pointer p-4"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center">
                <User className="w-5 h-5 text-[#2B3A3B] mr-3" />
                <h3 className="text-lg font-semibold text-[#2B3A3B]">基本資訊</h3>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.has('basic') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </div>
            
            {expandedSections.has('basic') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 pb-4 border-t border-[#EADBC8] pt-4"
              >
                <div className="space-y-6">
                  {/* 基本資訊 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左側：基本資訊 */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-[#2B3A3B]/70">電話號碼</label>
                          <p className="text-[#2B3A3B] font-mono">{phoneProfile.phone}</p>
                        </div>
                        {phoneProfile.person_name && (
                          <div>
                            <label className="text-sm font-medium text-[#2B3A3B]/70">檔案名稱</label>
                            <p className="text-[#2B3A3B]">{phoneProfile.person_name}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-[#2B3A3B]/70">分析等級</label>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(phoneProfile.level)}`}>
                            <Star className="w-3 h-3 mr-1" />
                            {getLevelText(phoneProfile.level)}
                          </div>
                        </div>
                        {phoneProfile.last_analysis_at && (
                          <div>
                            <label className="text-sm font-medium text-[#2B3A3B]/70">最後分析時間</label>
                            <p className="text-[#2B3A3B] flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(phoneProfile.last_analysis_at).toLocaleString('zh-HK')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右側：家長需關注程度 - 突出顯示 */}
                    <div className="lg:col-span-1">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-bold text-red-800">家長需關注程度</h3>
                        </div>
                        
                        {/* Level 顯示 */}
                        <div className="mb-3">
                          <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${
                            phoneProfile.level === 'A' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                            phoneProfile.level === 'B' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                            phoneProfile.level === 'C' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                            phoneProfile.level === 'D' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                            'bg-gray-100 text-gray-800 border-2 border-gray-300'
                          }`}>
                            {phoneProfile.level === 'A' ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                A級 - 低關注
                              </>
                            ) : phoneProfile.level === 'B' ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                B級 - 一般關注
                              </>
                            ) : phoneProfile.level === 'C' ? (
                              <>
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                C級 - 中等關注
                              </>
                            ) : phoneProfile.level === 'D' ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                D級 - 高關注
                              </>
                            ) : (
                              <>
                                <HelpCircle className="w-4 h-4 mr-2" />
                                未評估
                              </>
                            )}
                          </span>
                        </div>

                        {/* 顯示風險分析資訊（如果存在） */}
                        {phoneProfile.analysis_structured?.risk && (
                          <>
                            {/* Risk Rationale */}
                            {phoneProfile.analysis_structured.risk.rationale && (
                              <div className="mb-3">
                                <p className="text-sm text-red-700 bg-white/50 rounded-lg p-2 border border-red-200">
                                  <span className="font-medium">評估理由:</span><br/>
                                  {phoneProfile.analysis_structured.risk.rationale}
                                </p>
                              </div>
                            )}

                            {/* Risk Items */}
                            {phoneProfile.analysis_structured.risk.risks && phoneProfile.analysis_structured.risk.risks.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-red-800 mb-2 flex items-center">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  關注項目:
                                </p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {phoneProfile.analysis_structured.risk.risks.map((risk: string, index: number) => (
                                    <div key={index} className="text-xs text-red-700 bg-white/70 border border-red-200 rounded-lg px-2 py-1 flex items-start">
                                      <div className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                      {risk}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 從 analysis_structured 提取的詳細資訊 */}
                  {phoneProfile.analysis_structured && (
                    <div className="border-t border-[#EADBC8] pt-6">
                      <h4 className="text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        AI 分析洞察
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 最後聯絡時間 */}
                        {phoneProfile.analysis_structured.sources?.last_time && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">最後聯絡時間</label>
                            <p className="text-[#2B3A3B] font-medium">
                              {phoneProfile.analysis_structured.sources.last_time}
                            </p>
                          </div>
                        )}

                        {/* 孩子喜愛度 */}
                        {phoneProfile.analysis_structured.persona?.child_liking?.score_1to5 !== undefined && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">孩子喜愛度</label>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-[#FFD59A] h-2 rounded-full" 
                                  style={{ width: `${(phoneProfile.analysis_structured.persona.child_liking.score_1to5 / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[#2B3A3B] font-medium">
                                {phoneProfile.analysis_structured.persona.child_liking.score_1to5}/5
                              </span>
                            </div>
                            {phoneProfile.analysis_structured.persona.child_liking.evidence && (
                              <p className="text-xs text-[#2B3A3B]/60 mt-1">
                                證據: {phoneProfile.analysis_structured.persona.child_liking.evidence}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 家長重視程度 */}
                        {phoneProfile.analysis_structured.persona?.parent_care?.score_1to5 !== undefined && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">家長重視程度</label>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${(phoneProfile.analysis_structured.persona.parent_care.score_1to5 / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[#2B3A3B] font-medium">
                                {phoneProfile.analysis_structured.persona.parent_care.score_1to5}/5
                              </span>
                            </div>
                            {phoneProfile.analysis_structured.persona.parent_care.evidence && (
                              <p className="text-xs text-[#2B3A3B]/60 mt-1">
                                證據: {phoneProfile.analysis_structured.persona.parent_care.evidence}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 最後分析日期 */}
                        {phoneProfile.analysis_structured.basic?.created_at_guess && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">最後分析日期</label>
                            <p className="text-[#2B3A3B] font-medium">
                              {phoneProfile.analysis_structured.basic.created_at_guess}
                            </p>
                          </div>
                        )}


                        {/* 家庭練習資源 */}
                        {phoneProfile.analysis_structured.persona?.home_practice && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">家庭練習資源</label>
                            <div className="space-y-1">
                              {phoneProfile.analysis_structured.persona.home_practice.has_instrument && (
                                <p className="text-[#2B3A3B] text-sm">
                                  樂器: {phoneProfile.analysis_structured.persona.home_practice.has_instrument}
                                </p>
                              )}
                              {phoneProfile.analysis_structured.persona.home_practice.type && (
                                <p className="text-[#2B3A3B] text-sm">
                                  類型: {phoneProfile.analysis_structured.persona.home_practice.type}
                                </p>
                              )}
                              {phoneProfile.analysis_structured.persona.home_practice.practice_freq && (
                                <p className="text-[#2B3A3B] text-sm">
                                  練習頻率: {phoneProfile.analysis_structured.persona.home_practice.practice_freq}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 對機構的喜愛度 */}
                        {phoneProfile.analysis_structured.persona?.org_affinity?.score_1to5 !== undefined && (
                          <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                            <label className="text-sm font-medium text-[#2B3A3B]/70 mb-1 block">對機構的喜愛度</label>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${(phoneProfile.analysis_structured.persona.org_affinity.score_1to5 / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[#2B3A3B] font-medium">
                                {phoneProfile.analysis_structured.persona.org_affinity.score_1to5}/5
                              </span>
                            </div>
                            {phoneProfile.analysis_structured.persona.org_affinity.evidence && (
                              <p className="text-xs text-[#2B3A3B]/60 mt-1">
                                證據: {phoneProfile.analysis_structured.persona.org_affinity.evidence}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {phoneProfile.analysis_structured.basic?.tags && phoneProfile.analysis_structured.basic.tags.length > 0 && (
                        <div className="mt-6">
                          <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">標籤</label>
                          <div className="flex flex-wrap gap-2">
                            {phoneProfile.analysis_structured.basic.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-[#FFD59A] text-[#2B3A3B] rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 重要亮點 */}
                      {phoneProfile.analysis_structured.highlights && phoneProfile.analysis_structured.highlights.length > 0 && (
                        <div className="mt-6">
                          <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">重要亮點</label>
                          <div className="space-y-2">
                            {phoneProfile.analysis_structured.highlights.map((highlight: string, index: number) => (
                              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-[#2B3A3B] text-sm">{highlight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </HanamiCard>
        </motion.div>

        {/* 個性特質卡片 */}
        {phoneProfile.personality_traits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <HanamiCard className="mb-6">
              <div 
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => toggleSection('personality')}
              >
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-[#2B3A3B] mr-3" />
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">個性特質</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.has('personality') ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {expandedSections.has('personality') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 border-t border-[#EADBC8] pt-4"
                >
                  <div className="bg-[#FFF9F2] rounded-lg p-4">
                    <p className="text-[#2B3A3B] leading-relaxed">{phoneProfile.personality_traits}</p>
                  </div>
                </motion.div>
              )}
            </HanamiCard>
          </motion.div>
        )}

        {/* 需求與態度卡片 */}
        {(phoneProfile.needs || phoneProfile.attitude) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <HanamiCard className="mb-6">
              <div 
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => toggleSection('needs')}
              >
                <div className="flex items-center">
                  <Heart className="w-5 h-5 text-[#2B3A3B] mr-3" />
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">需求與態度</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.has('needs') ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {expandedSections.has('needs') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 border-t border-[#EADBC8] pt-4"
                >
                  <div className="space-y-4">
                    {phoneProfile.needs && (
                      <div>
                        <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">需求分析</label>
                        <div className="bg-[#FFF9F2] rounded-lg p-4">
                          <p className="text-[#2B3A3B] leading-relaxed">{phoneProfile.needs}</p>
                        </div>
                      </div>
                    )}
                    {phoneProfile.attitude && (
                      <div>
                        <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">態度評估</label>
                        <div className="bg-[#FFF9F2] rounded-lg p-4">
                          <p className="text-[#2B3A3B] leading-relaxed">{phoneProfile.attitude}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </HanamiCard>
          </motion.div>
        )}

        {/* 注意事項與重要筆記 */}
        {(phoneProfile.attention_notes || phoneProfile.important_notes) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <HanamiCard className="mb-6">
              <div 
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => toggleSection('notes')}
              >
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-[#2B3A3B] mr-3" />
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">重要筆記</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.has('notes') ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {expandedSections.has('notes') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 border-t border-[#EADBC8] pt-4"
                >
                  <div className="space-y-4">
                    {phoneProfile.attention_notes && (
                      <div>
                        <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">注意事項</label>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-[#2B3A3B] leading-relaxed">{phoneProfile.attention_notes}</p>
                        </div>
                      </div>
                    )}
                    {phoneProfile.important_notes && (
                      <div>
                        <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">重要筆記</label>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-[#2B3A3B] leading-relaxed">{phoneProfile.important_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </HanamiCard>
          </motion.div>
        )}

        {/* 分析詳情 */}
        {phoneProfile.analysis_structured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <HanamiCard className="mb-6">
              <div 
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => toggleSection('analysis')}
              >
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-[#2B3A3B] mr-3" />
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">AI 分析詳情</h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.has('analysis') ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {expandedSections.has('analysis') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 border-t border-[#EADBC8] pt-4"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {phoneProfile.analysis_model && (
                        <div>
                          <label className="text-sm font-medium text-[#2B3A3B]/70">分析模型</label>
                          <p className="text-[#2B3A3B] font-mono text-sm">{phoneProfile.analysis_model}</p>
                        </div>
                      )}
                      {phoneProfile.analysis_version && (
                        <div>
                          <label className="text-sm font-medium text-[#2B3A3B]/70">分析版本</label>
                          <p className="text-[#2B3A3B] font-mono text-sm">{phoneProfile.analysis_version}</p>
                        </div>
                      )}
                    </div>
                    
                    {phoneProfile.analysis_structured && (
                      <div>
                        <label className="text-sm font-medium text-[#2B3A3B]/70 mb-2 block">結構化分析</label>
                        <div className="bg-[#FFF9F2] rounded-lg p-4">
                          <pre className="text-[#2B3A3B] text-sm whitespace-pre-wrap font-mono">
                            {JSON.stringify(phoneProfile.analysis_structured, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </HanamiCard>
          </motion.div>
        )}

        {/* 操作按鈕 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex gap-3"
        >
          <HanamiButton 
            variant="primary"
            onClick={() => window.open(`/admin/phone-profiles/${phoneProfile.id}/edit`, '_blank')}
          >
            <FileText className="w-4 h-4 mr-2" />
            編輯檔案
          </HanamiButton>
          <HanamiButton 
            variant="secondary"
            onClick={() => window.open(`/admin/phone-profiles/${phoneProfile.id}/analysis`, '_blank')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            重新分析
          </HanamiButton>
        </motion.div>
      </motion.div>
    </div>
  );
}