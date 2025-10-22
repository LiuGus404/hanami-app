'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  EyeIcon, 
  MusicalNoteIcon,
  BookOpenIcon,
  HandRaisedIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface ProgressContent {
  content: string;
  completed: boolean;
  level: number;
}

interface AbilityProgress {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  progress: number;
  status: 'locked' | 'in_progress' | 'completed';
  color: string;
  description?: string;
  progressMode?: string;
  progressContents?: ProgressContent[];
  assessmentMode?: string;
}

interface DetailedAbilityProgressProps {
  ability: AbilityProgress;
  className?: string;
}

const getAbilityIcon = (abilityName: string) => {
  const name = abilityName.toLowerCase();
  if (name.includes('專注') || name.includes('時長')) return ClockIcon;
  if (name.includes('眼球') || name.includes('追視')) return EyeIcon;
  if (name.includes('樂理') || name.includes('認知')) return AcademicCapIcon;
  if (name.includes('讀譜') || name.includes('譜')) return BookOpenIcon;
  if (name.includes('小肌') || name.includes('演奏')) return HandRaisedIcon;
  if (name.includes('樂曲') || name.includes('彈奏')) return MusicalNoteIcon;
  return AcademicCapIcon;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'in_progress':
      return 'text-blue-600 bg-blue-100';
    case 'locked':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'in_progress':
      return '進行中';
    case 'locked':
      return '未解鎖';
    default:
      return '未評估';
  }
};

export default function DetailedAbilityProgress({ 
  ability, 
  className = '' 
}: DetailedAbilityProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getAbilityIcon(ability.name);

  return (
    <motion.div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 標題區域 */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: ability.color }}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{ability.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ability.status)}`}>
                  {getStatusText(ability.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {ability.progressMode || '進度模式'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 進度資訊 */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                等級 {ability.level} / {ability.maxLevel} ({ability.progress}%)
              </div>
              <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${ability.progress}%`,
                    backgroundColor: ability.color 
                  }}
                ></div>
              </div>
            </div>
            
            {/* 展開/收合按鈕 */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 展開內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100">
              {/* 描述 */}
              {ability.description && (
                <div className="mt-3 mb-4">
                  <p className="text-sm text-gray-600">{ability.description}</p>
                </div>
              )}

              {/* 進度內容 */}
              {ability.progressContents && ability.progressContents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">進度內容</h4>
                  <div className="space-y-2">
                    {ability.progressContents.map((content, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center space-x-3 p-2 rounded-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex-shrink-0">
                          {content.completed ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
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
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 完成度統計 */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">完成度</span>
                  <span className="font-medium text-gray-800">
                    {ability.progressContents?.filter(c => c.completed).length || 0} / {ability.progressContents?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}













