'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target } from 'lucide-react';

interface TrendData {
  date: string;
  progress: number;
  level: number;
  assessment_id?: string;
  lesson_date?: string;
  overall_rating?: number;
}

interface AbilityData {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  progress: number;
  status: string;
  color: string;
  description?: string;
  progressContents?: Array<{
    content: string;
    completed: boolean;
    level: number;
  }>;
}

interface AbilityTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  ability: AbilityData | null;
  studentId: string;
}

export default function AbilityTrendModal({ 
  isOpen, 
  onClose, 
  ability, 
  studentId 
}: AbilityTrendModalProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  // 載入該能力的趨勢資料
  useEffect(() => {
    if (isOpen && ability && studentId) {
      loadTrendData();
    }
  }, [isOpen, ability, studentId]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ability-trend-data?student_id=${studentId}&ability_id=${ability?.id}&days=30`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTrendData(result.data);
        } else {
          console.error('API 返回錯誤:', result.error);
          // 如果 API 失敗，使用當前能力的資料作為單一資料點
          setTrendData([{
            date: new Date().toISOString().split('T')[0],
            progress: ability?.progress || 0,
            level: ability?.level || 0
          }]);
        }
      } else {
        console.error('API 請求失敗:', response.status);
        // 如果 API 失敗，使用當前能力的資料作為單一資料點
        setTrendData([{
          date: new Date().toISOString().split('T')[0],
          progress: ability?.progress || 0,
          level: ability?.level || 0
        }]);
      }
    } catch (error) {
      console.error('載入趨勢資料失敗:', error);
      // 如果發生錯誤，使用當前能力的資料作為單一資料點
      setTrendData([{
        date: new Date().toISOString().split('T')[0],
        progress: ability?.progress || 0,
        level: ability?.level || 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ability) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題欄 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: ability.color }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{ability.name}</h2>
                <p className="text-sm text-gray-600">學習進度趨勢</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 內容區域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* 當前進度摘要 */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">當前等級</p>
                    <p className="text-2xl font-bold text-gray-800">Lv.{ability.level}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">進度百分比</p>
                    <p className="text-2xl font-bold text-gray-800">{ability.progress}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">狀態</p>
                    <p className="text-lg font-semibold text-gray-800 capitalize">{ability.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 趨勢圖表 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                進度趨勢圖
              </h3>
              
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="relative h-48">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* 網格線 */}
                      <defs>
                        <pattern id="trendGrid" width="80" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#trendGrid)" />
                      
                      {/* 連接線 */}
                      <motion.path
                        d={trendData.map((dataPoint, index) => {
                          const x = 50 + (index * 60);
                          const y = 180 - ((dataPoint.progress / 100) * 160);
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={ability.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5 }}
                      />
                      
                      {/* 數據點 */}
                      {trendData.map((dataPoint, index) => {
                        const isHovered = hoveredDataPoint === index;
                        const x = 50 + (index * 60);
                        const y = 180 - ((dataPoint.progress / 100) * 160);
                        
                        return (
                          <g key={dataPoint.date}>
                            <motion.circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? ability.color : '#e5e7eb'}
                              stroke={ability.color}
                              strokeWidth="2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredDataPoint(index)}
                              onMouseLeave={() => setHoveredDataPoint(null)}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.3 }}
                            />
                            
                            {/* 懸停提示 */}
                            {isHovered && (
                              <motion.g
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <rect
                                  x={x - 35}
                                  y={y - 50}
                                  width="70"
                                  height={dataPoint.overall_rating ? "30" : "20"}
                                  rx="4"
                                  fill="#374151"
                                />
                                <text
                                  x={x}
                                  y={y - 25}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="10"
                                  fontWeight="500"
                                >
                                  {dataPoint.progress}% (Lv.{dataPoint.level})
                                </text>
                                {dataPoint.overall_rating && (
                                  <text
                                    x={x}
                                    y={y - 10}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="8"
                                  >
                                    總評: {dataPoint.overall_rating}/5
                                  </text>
                                )}
                              </motion.g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* 日期標籤 */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2">
                      {trendData.map((dataPoint, index) => (
                        <div key={dataPoint.date} className="text-center" style={{ width: '60px' }}>
                          <div className="text-xs text-gray-600">
                            {new Date(dataPoint.date).toLocaleDateString('zh-TW', {
                              month: 'numeric',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs font-medium text-gray-700 mt-1">
                            {dataPoint.progress}%
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Y軸標籤 */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pl-2">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 進度內容 */}
            {ability.progressContents && ability.progressContents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">進度內容</h3>
                <div className="space-y-2">
                  {ability.progressContents.map((content, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {content.completed ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm ${content.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                          {content.content}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        等級 {content.level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 描述 */}
            {ability.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">描述</h3>
                <p className="text-sm text-gray-600">{ability.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
