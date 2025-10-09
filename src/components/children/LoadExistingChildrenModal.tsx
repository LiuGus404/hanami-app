'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  CalendarIcon, 
  HeartIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ExistingStudent {
  id: string;
  full_name: string;
  nick_name?: string;
  birth_date: string;
  age_months: number;
  gender: string;
  preferences?: string;
  health_notes?: string;
  contact_number?: string;
  parent_email?: string;
  source: 'trial' | 'regular';
  source_label: string;
}

interface LoadExistingChildrenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (student: ExistingStudent) => void;
}

export default function LoadExistingChildrenModal({ 
  isOpen, 
  onClose, 
  onSelect 
}: LoadExistingChildrenModalProps) {
  const [students, setStudents] = useState<ExistingStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'trial' | 'regular'>('all');

  // 載入現有學生資料
  const loadExistingStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/children/load-existing');
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data.students || []);
      } else {
        console.error('載入學生資料失敗:', data.error);
        alert('載入學生資料失敗');
      }
    } catch (error) {
      console.error('載入學生資料失敗:', error);
      alert('載入學生資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 計算年齡顯示
  const getAgeDisplay = (ageMonths: number) => {
    if (!ageMonths) return '未知';
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    if (years === 0) return `${months}個月`;
    if (months === 0) return `${years}歲`;
    return `${years}歲${months}個月`;
  };

  // 過濾學生
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.nick_name && student.nick_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = selectedSource === 'all' || student.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  // 處理選擇學生
  const handleSelectStudent = (student: ExistingStudent) => {
    onSelect(student);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      loadExistingStudents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模態框內容 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative bg-[#FFFDF8] rounded-2xl shadow-2xl border border-[#EADBC8] w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFDF8 0%, #FFF9F2 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* 標題欄 */}
        <div 
          className="relative p-6 border-b border-[#EADBC8]"
          style={{
            background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)'
          }}
        >
          {/* 裝飾性背景元素 */}
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 自定義圖標 */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center animate-float"
                style={{
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #FFD59A 100%)',
                  boxShadow: '0 8px 16px rgba(255, 182, 193, 0.3)'
                }}
              >
                <div className="w-6 h-6 relative">
                  {/* 眼睛 */}
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#4B4036] rounded-full"></div>
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#4B4036] rounded-full"></div>
                  {/* 嘴巴 */}
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1.5 border-2 border-[#4B4036] border-t-0 rounded-b-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#4B4036]">載入現有孩子資料</h2>
                <p className="text-[#4B4036]/70 text-sm">選擇要載入的孩子資料</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
            </button>
          </div>
        </div>

        {/* 搜索和篩選 */}
        <div className="p-6 border-b border-[#EADBC8]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4B4036]/50" />
              <input
                type="text"
                placeholder="搜索孩子姓名或暱稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-white/80"
              />
            </div>
            
            {/* 來源篩選 */}
            <div className="flex space-x-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'trial', label: '試堂學生' },
                { value: 'regular', label: '常規學生' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedSource(value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSource === value
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'bg-white/60 text-[#4B4036]/70 hover:bg-[#FFD59A]/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 學生列表 */}
        <div 
          className="p-6 max-h-96 overflow-y-auto"
          style={{
            background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF9F2 100%)'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
              <span className="ml-3 text-[#4B4036]">載入中...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-16 h-16 text-[#4B4036]/30 mx-auto mb-4" />
              <p className="text-[#4B4036]/70">
                {searchTerm || selectedSource !== 'all' ? '沒有找到符合條件的孩子' : '沒有找到任何孩子資料'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectStudent(student)}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EADBC8] hover:shadow-lg hover:border-[#FFD59A] cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#FFD59A] rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="w-5 h-5 text-[#4B4036]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#4B4036]">{student.full_name}</h4>
                          {student.nick_name && (
                            <p className="text-sm text-[#4B4036]/70">暱稱: {student.nick_name}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.source === 'trial' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {student.source_label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-[#4B4036]/70">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>{getAgeDisplay(student.age_months)}</span>
                        <span className="mx-2">•</span>
                        <span>{student.gender}</span>
                      </div>
                      
                      {student.preferences && (
                        <div className="flex items-start text-[#4B4036]/70">
                          <HeartIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{student.preferences}</span>
                        </div>
                      )}
                      
                      {student.health_notes && (
                        <div className="flex items-start text-[#4B4036]/70">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="truncate">健康: {student.health_notes}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div 
          className="p-6 border-t border-[#EADBC8]"
          style={{
            background: 'linear-gradient(135deg, #FFF9F2 0%, #FFD59A 100%)'
          }}
        >
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/80 text-[#4B4036] rounded-lg hover:bg-white transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
