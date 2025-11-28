'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Play, 
  Image, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Train,
  Star,
  BookOpen,
  Music,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Download,
  Share2,
  Heart,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StudentMedia } from '@/types/progress';
import { toast } from 'react-hot-toast';

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化時間長度
const getDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface LessonData {
  id: string;
  lesson_date: string;
  actual_timeslot: string;
  lesson_teacher: string;
  lesson_activities: string;
  progress_notes: string | null;
  next_target: string;
  notes: string;
  course_type: string;
  media: StudentMedia[];
  isToday?: boolean;
}

interface StudentMediaTimelineProps {
  studentId: string;
  studentName: string;
  className?: string;
  isTeacher?: boolean; // 是否為老師端，如果是則可以編輯和刪除進度筆記
  orgId?: string | null; // 機構 ID，用於更新資料
}

// 地鐵站樣式的時間軸節點
const MetroStationNode: React.FC<{
  lesson: LessonData | null;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  totalStations: number;
}> = ({ lesson, isActive, isSelected, onClick, index, totalStations }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStationColor = () => {
    if (!lesson) return 'from-gray-200 to-gray-300';
    if (isSelected) return 'from-blue-500 to-blue-600';
    
    // 檢查螢幕寬度，決定中心節點索引
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const centerIndex = isMobile ? 1 : 2; // 移動端中心索引1，桌面端中心索引2
    
    // 中間的課程（最近的一堂）始終用特殊顏色
    if (index === centerIndex) return 'from-orange-400 to-orange-500';
    
    // 根據課程狀態顯示顏色：未上用灰色，已上用綠色
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lessonDate = new Date(lesson.lesson_date);
    lessonDate.setHours(0, 0, 0, 0);
    
    if (lessonDate <= today) {
      // 已上的課程用綠色
      return 'from-green-400 to-green-500';
    } else {
      // 未上的課程用灰色
      return 'from-gray-300 to-gray-400';
    }
  };

  const getStationIcon = () => {
    if (!lesson) return <Calendar className="w-4 h-4 opacity-50" />;
    if (lesson.media.length > 0) {
      const hasVideo = lesson.media.some(m => m.media_type === 'video');
      const hasPhoto = lesson.media.some(m => m.media_type === 'photo');
      if (hasVideo && hasPhoto) return <Video className="w-4 h-4" />;
      if (hasVideo) return <Video className="w-4 h-4" />;
      return <Image className="w-4 h-4" />;
    }
    return <Calendar className="w-4 h-4" />;
  };

  return (
    <motion.div
      className={`relative flex flex-col items-center cursor-pointer py-4 ${
        index === totalStations - 1 ? 'pr-4' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 連接線 */}
      {index < totalStations - 1 && (
        <motion.div
          className={`absolute top-12 left-1/2 w-full h-0.5 ${
            isSelected ? 'bg-blue-500' : 
            (() => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              const centerIndex = isMobile ? 1 : 2;
              return index === centerIndex ? 'bg-orange-400' : 
                lesson && (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const lessonDate = new Date(lesson.lesson_date);
                  lessonDate.setHours(0, 0, 0, 0);
                  return lessonDate <= today ? 'bg-green-400' : 'bg-gray-300';
                })() || 'bg-gray-300';
            })()
          }`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          style={{ transformOrigin: 'left center' }}
        />
      )}

      {/* 車站節點 */}
      <motion.div
        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${getStationColor()} 
          flex items-center justify-center text-white shadow-lg border-2 md:border-4 border-white
          ${isSelected ? 'ring-2 md:ring-4 ring-blue-200' : ''}
          ${isHovered ? 'ring-2 md:ring-4 ring-orange-200' : ''}
        `}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: index * 0.1, 
          duration: 0.6, 
          type: "spring",
          stiffness: 200 
        }}
        whileHover={{ 
          scale: 1.1, 
          rotate: 5,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }}
      >
        {getStationIcon()}
        
        {/* 影片數量指示器 - 只有影片才顯示數字 */}
        {lesson && lesson.media.filter(m => m.media_type === 'video').length > 0 && (
          <motion.div
            className={`absolute -top-2 md:-top-3 w-6 h-6 md:w-7 md:h-7 bg-red-500 text-white text-xs 
              rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg z-10
              ${index === totalStations - 1 ? '-right-3 md:-right-4' : '-right-2 md:-right-3'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            {lesson.media.filter(m => m.media_type === 'video').length}
          </motion.div>
        )}


        {/* 今天指示器 - 只在真正的今天課程上顯示 */}
        {lesson && lesson.isToday && (() => {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          const centerIndex = isMobile ? 1 : 2;
          return index === centerIndex;
        })() && (
          <motion.div
            className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-6 h-6 md:w-7 md:h-7 bg-green-500 text-white text-xs 
              rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            <Star className="w-3 h-3 md:w-4 md:h-4" />
          </motion.div>
        )}
      </motion.div>

      {/* 車站標籤 */}
      <motion.div
        className="mt-2 text-center min-w-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        {lesson ? (
          <>
            <div className={`text-xs md:text-sm font-medium truncate ${
              (() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const centerIndex = isMobile ? 1 : 2;
                return index === centerIndex ? 'text-orange-700' : 
                  (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const lessonDate = new Date(lesson.lesson_date);
                    lessonDate.setHours(0, 0, 0, 0);
                    return lessonDate <= today ? 'text-green-700' : 'text-gray-800';
                  })();
              })()
            }`}>
              {new Date(lesson.lesson_date).toLocaleDateString('zh-TW', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className={`text-xs truncate ${
              (() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const centerIndex = isMobile ? 1 : 2;
                return index === centerIndex ? 'text-orange-600' : 
                  (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const lessonDate = new Date(lesson.lesson_date);
                    lessonDate.setHours(0, 0, 0, 0);
                    return lessonDate <= today ? 'text-green-600' : 'text-gray-500';
                  })();
              })()
            }`}>
              {lesson.actual_timeslot}
            </div>
            {lesson.isToday && (() => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              const centerIndex = isMobile ? 1 : 2;
              return index === centerIndex;
            })() && (
              <div className="text-xs text-green-600 font-medium mt-1">
                今天
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-xs md:text-sm font-medium text-gray-400 truncate">
              --
            </div>
            <div className="text-xs text-gray-400 truncate">
              --
            </div>
          </>
        )}
      </motion.div>

      {/* 懸停提示 */}
      <AnimatePresence>
        {isHovered && lesson && (
          <motion.div
            className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20
              bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap
              shadow-lg border border-gray-700"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
          >
            <div className="font-medium">{lesson.lesson_teacher}</div>
            <div className="text-gray-300">
              {lesson.media.length} 個媒體檔案
            </div>
            {lesson.isToday && (
              <div className="text-green-300">
                今天的課程
              </div>
            )}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
              w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-700"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 媒體展示卡片
const MediaCard: React.FC<{
  media: StudentMedia;
  onView: () => void;
  onDownload: () => void;
  lessonDate?: string; // 新增：課程日期
}> = ({ media, onView, onDownload, lessonDate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative bg-white rounded-xl shadow-md overflow-hidden border border-gray-200
        hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 媒體預覽 */}
      <div className="relative aspect-video bg-gray-100">
        {media.media_type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <div className="text-center">
              <Video className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <div className="text-sm text-blue-600 font-medium">影片檔案</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <div className="text-center">
              <Image className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <div className="text-sm text-green-600 font-medium">相片檔案</div>
            </div>
          </div>
        )}
        
        {/* 播放按鈕覆蓋層 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Play className="w-8 h-8 text-gray-800 ml-1" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 媒體資訊 */}
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800 truncate text-sm md:text-base">
            {media.title || '未命名檔案'}
          </h4>
          <div className="flex items-center space-x-1">
            {media.media_type === 'video' ? (
              <Video className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
            ) : (
              <Image className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          {/* 課程關聯日期 */}
          {lessonDate && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <Calendar className="w-3 h-3" />
              <span>課程: {new Date(lessonDate).toLocaleDateString('zh-TW')}</span>
            </div>
          )}
          
          {/* 上傳日期和觀看次數 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>上傳: {new Date(media.created_at).toLocaleDateString('zh-TW')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute top-2 right-2 flex space-x-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100
                transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Download className="w-4 h-4 text-gray-600" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


export default function StudentMediaTimeline({ 
  studentId, 
  studentName, 
  className = '',
  isTeacher = false,
  orgId = null
}: StudentMediaTimelineProps) {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'media'>('timeline');
  const [currentIndex, setCurrentIndex] = useState(0); // 當前顯示的課程索引
  const [isMobile, setIsMobile] = useState(false); // 響應式狀態
  const [showMediaModal, setShowMediaModal] = useState(false); // 媒體播放模態框
  const [selectedMedia, setSelectedMedia] = useState<StudentMedia | null>(null); // 選中的媒體
  const [selectedMediaLessonDate, setSelectedMediaLessonDate] = useState<string | null>(null); // 選中媒體的課程日期
  const [todayLessonRecord, setTodayLessonRecord] = useState<any>(null); // 當日課堂記錄
  const [isEditingProgressNotes, setIsEditingProgressNotes] = useState(false); // 是否正在編輯進度筆記
  const [editedProgressNotes, setEditedProgressNotes] = useState<string>(''); // 編輯中的進度筆記內容
  const [isSaving, setIsSaving] = useState(false); // 是否正在儲存

  // 載入當日課堂記錄
  const loadTodayLessonRecord = async () => {
    try {
      console.log('🚀 開始載入當日課堂記錄...');
      console.log('🔍 查詢參數:', { studentId, studentName });
      
      if (!studentId) {
        console.error('❌ studentId 為空，無法載入課堂記錄');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      console.log('🔍 查詢當日課堂記錄:', { studentId, todayStr });
      
      // 先查詢該學生的所有課堂記錄
      console.log('🔍 開始查詢 Supabase...');
      
      // 先測試 Supabase 連接
      console.log('🔍 測試 Supabase 連接...');
      const { data: testData, error: testError } = await supabase
        .from('hanami_student_lesson')
        .select('id, student_id, lesson_date')
        .limit(1);
      
      console.log('🔍 Supabase 連接測試結果:', { testData, testError });
      
      if (testError) {
        console.error('❌ Supabase 連接測試失敗:', testError);
        return;
      }
      
      console.log('✅ Supabase 連接測試成功');
      
      console.log('🔍 開始查詢該學生的課堂記錄...');
      console.log('🔍 查詢條件:', { student_id: studentId });
      
      const { data: allLessons, error: allError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false })
        .limit(10);
      
      console.log('🔍 Supabase 查詢結果:', { data: allLessons, error: allError });
      
      if (allError) {
        console.error('❌ 查詢該學生課堂記錄失敗:', allError);
        return;
      }
      
      console.log('✅ 查詢該學生課堂記錄成功');

      const typedAllLessons = (allLessons || []) as Array<{ lesson_date: string | null; [key: string]: any }>;
      console.log('📚 該學生的所有課堂記錄:', typedAllLessons);
      console.log('📊 課堂記錄數量:', typedAllLessons.length);

      // 查找當日的課堂記錄
      console.log('🔍 查找當日的課堂記錄...');
      console.log('🔍 今日日期:', todayStr);
      
      const todayLesson = typedAllLessons.find(lesson => {
        if (!lesson.lesson_date) return false;
        const lessonDate = new Date(lesson.lesson_date);
        lessonDate.setHours(0, 0, 0, 0);
        const isToday = lessonDate.getTime() === today.getTime();
        console.log('🔍 檢查課程日期:', { 
          lessonDate: lesson.lesson_date, 
          normalizedDate: lessonDate.toISOString().split('T')[0],
          isToday 
        });
        return isToday;
      });

      if (todayLesson) {
        setTodayLessonRecord(todayLesson);
        console.log('✅ 當日課堂記錄載入成功:', todayLesson);
      } else {
        // 如果沒有當日的記錄，使用最近的記錄
        const recentLesson = typedAllLessons[0];
        if (recentLesson) {
          setTodayLessonRecord(recentLesson);
          console.log('📅 使用最近的課堂記錄:', recentLesson);
        } else {
          setTodayLessonRecord(null);
          console.log('📅 無任何課堂記錄');
        }
      }
      
      console.log('🎯 當日課堂記錄載入完成');
    } catch (error) {
      console.error('❌ 載入當日課堂記錄錯誤:', error);
      console.error('❌ 錯誤詳情:', {
        message: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  // 保存進度筆記
  const handleSaveProgressNotes = async () => {
    if (!selectedLesson) return;
    
    setIsSaving(true);
    try {
      const lessonId = selectedLesson.id;
      const updateData: Record<string, any> = {
        progress_notes: editedProgressNotes || null,
        updated_at: new Date().toISOString(),
      };

      // 如果有 orgId，添加 org_id 欄位
      if (orgId) {
        updateData.org_id = orgId;
      }

      const { error: updateError } = await supabase
        .from('hanami_student_lesson')
        // @ts-ignore - Supabase type inference issue with dynamic update data
        .update(updateData)
        .eq('id', lessonId);

      if (updateError) {
        console.error('更新進度筆記失敗:', updateError);
        toast.error('儲存失敗，請稍後再試');
        return;
      }

      // 更新本地狀態
      const updatedLesson = {
        ...selectedLesson,
        progress_notes: editedProgressNotes || null,
      };
      setSelectedLesson(updatedLesson);
      
      // 更新 lessons 陣列中的對應項目
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, progress_notes: editedProgressNotes || null }
          : lesson
      ));

      // 如果更新的是當日課堂記錄，也要更新 todayLessonRecord
      if (todayLessonRecord && todayLessonRecord.id === lessonId) {
        setTodayLessonRecord({
          ...todayLessonRecord,
          progress_notes: editedProgressNotes || null,
        });
      }

      setIsEditingProgressNotes(false);
      setEditedProgressNotes('');
      toast.success('進度筆記已儲存');
    } catch (error) {
      console.error('儲存進度筆記時發生錯誤:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  // 刪除進度筆記
  const handleDeleteProgressNotes = async () => {
    if (!selectedLesson) return;

    setIsSaving(true);
    try {
      const lessonId = selectedLesson.id;
      const updateData: Record<string, any> = {
        progress_notes: null,
        updated_at: new Date().toISOString(),
      };

      // 如果有 orgId，添加 org_id 欄位
      if (orgId) {
        updateData.org_id = orgId;
      }

      const { error: updateError } = await supabase
        .from('hanami_student_lesson')
        // @ts-ignore - Supabase type inference issue with dynamic update data
        .update(updateData)
        .eq('id', lessonId);

      if (updateError) {
        console.error('刪除進度筆記失敗:', updateError);
        toast.error('刪除失敗，請稍後再試');
        return;
      }

      // 更新本地狀態
      const updatedLesson = {
        ...selectedLesson,
        progress_notes: null,
      };
      setSelectedLesson(updatedLesson);
      
      // 更新 lessons 陣列中的對應項目
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, progress_notes: null }
          : lesson
      ));

      // 如果更新的是當日課堂記錄，也要更新 todayLessonRecord
      if (todayLessonRecord && todayLessonRecord.id === lessonId) {
        setTodayLessonRecord({
          ...todayLessonRecord,
          progress_notes: null,
        });
      }

      toast.success('進度筆記已刪除');
    } catch (error) {
      console.error('刪除進度筆記時發生錯誤:', error);
      toast.error('刪除失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  // 響應式監聽器
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 當切換課程時，重置編輯狀態
  useEffect(() => {
    setIsEditingProgressNotes(false);
    setEditedProgressNotes('');
  }, [selectedLesson?.id]);

  // 載入課程資料和媒體
  useEffect(() => {
    const loadLessonsWithMedia = async () => {
      try {
        setLoading(true);
        setError(null);

        // 使用簡化版API路由載入資料
        const response = await fetch(`/api/student-media/timeline-simple?studentId=${studentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '載入資料失敗');
        }

        const { lessons } = result.data;
        console.log('📚 課程資料載入成功:', lessons.length, '個課程');
        // 詳細的課程媒體統計
        console.log('📊 課程媒體統計:');
        lessons.forEach((lesson: any, index: number) => {
          const mediaCount = lesson.media?.length || 0;
          const videoCount = lesson.media?.filter((m: any) => m.media_type === 'video').length || 0;
          const photoCount = lesson.media?.filter((m: any) => m.media_type === 'photo').length || 0;
          
          if (mediaCount > 0) {
            console.log(`📅 ${lesson.lesson_date} (課程 ${index + 1}):`, {
              mediaCount,
              videoCount,
              photoCount,
              lessonId: lesson.id
            });
            
            // 詳細顯示每個媒體檔案
            lesson.media?.forEach((media: any, mediaIndex: number) => {
              console.log(`  📁 媒體 ${mediaIndex + 1}:`, {
                fileName: media.file_name,
                type: media.media_type,
                mediaLessonId: media.lesson_id,
                uploadedAt: media.created_at,
                isDirectlyLinked: media.lesson_id === lesson.id ? '✅ 直接關聯' : '❌ 日期匹配'
              });
            });
          }
        });
        
        // 總結統計
        const totalMedia = lessons.reduce((sum: number, l: any) => sum + (l.media?.length || 0), 0);
        const totalVideos = lessons.reduce((sum: number, l: any) => sum + (l.media?.filter((m: any) => m.media_type === 'video').length || 0), 0);
        const totalPhotos = lessons.reduce((sum: number, l: any) => sum + (l.media?.filter((m: any) => m.media_type === 'photo').length || 0), 0);
        console.log('📈 總計統計:', { totalLessons: lessons.length, totalMedia, totalVideos, totalPhotos });
        setLessons(lessons);
        
        // 載入當日課堂記錄
        console.log('🎯 準備載入當日課堂記錄...');
        console.log('🎯 當前 studentId:', studentId);
        console.log('🎯 當前 studentName:', studentName);
        try {
          await loadTodayLessonRecord();
          console.log('✅ 當日課堂記錄載入完成');
        } catch (error) {
          console.error('❌ 載入當日課堂記錄時發生錯誤:', error);
          console.error('❌ 錯誤詳情:', {
            message: error instanceof Error ? error.message : '未知錯誤',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
        
        // 預設選擇今天的課程，如果沒有則選擇最近的課程
        if (lessons.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayLesson = lessons.find((lesson: any) => {
            const lessonDate = new Date(lesson.lesson_date);
            lessonDate.setHours(0, 0, 0, 0);
            return lessonDate.getTime() === today.getTime();
          });
          
          // 如果沒有今天的課程，選擇最接近今天的課程
          if (!todayLesson) {
            const closestLesson = lessons.reduce((closest: any, lesson: any) => {
              const lessonDate = new Date(lesson.lesson_date);
              const todayTime = today.getTime();
              const lessonTime = lessonDate.getTime();
              const closestTime = closest ? new Date(closest.lesson_date).getTime() : Infinity;
              
              const currentDiff = Math.abs(lessonTime - todayTime);
              const closestDiff = Math.abs(closestTime - todayTime);
              
              return currentDiff < closestDiff ? lesson : closest;
            });
            
            setSelectedLesson(closestLesson);
          } else {
            setSelectedLesson(todayLesson);
          }
        }

      } catch (err) {
        console.error('載入課程資料失敗:', err);
        setError('載入課程資料失敗，請稍後再試');
        toast.error('載入課程資料失敗');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadLessonsWithMedia();
    }
  }, [studentId]);

  // 處理課程日期排序和選擇邏輯
  const processedLessons = useMemo(() => {
    if (lessons.length === 0) return [];
    
    // 按日期排序（最早的在前，最晚的在後）
    const sortedLessons = [...lessons].sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 重置時間到當天開始
    
    // 找到最接近今天的課程
    let todayIndex = -1;
    let minDiff = Infinity;
    
    sortedLessons.forEach((lesson, index) => {
      const lessonDate = new Date(lesson.lesson_date);
      lessonDate.setHours(0, 0, 0, 0);
      const diff = Math.abs(lessonDate.getTime() - today.getTime());
      
      if (diff < minDiff) {
        minDiff = diff;
        todayIndex = index;
      }
    });
    
    // 如果沒有找到接近今天的課程，使用第一個課程作為中心
    if (todayIndex === -1) {
      todayIndex = 0;
    }
    
    // 檢查螢幕寬度，決定顯示3個還是5個課程
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const nodeCount = isMobile ? 3 : 5;
    const centerOffset = isMobile ? 1 : 2; // 移動端中心偏移1，桌面端偏移2
    
    // 計算當前顯示的起始索引（基於currentIndex偏移）
    const startIndex = Math.max(0, todayIndex - centerOffset + currentIndex);
    const selectedLessons = [];
    
    // 選擇課程
    for (let i = 0; i < nodeCount; i++) {
      const lessonIndex = startIndex + i;
      if (lessonIndex < sortedLessons.length) {
        const lesson = sortedLessons[lessonIndex];
        const lessonDate = new Date(lesson.lesson_date);
        lessonDate.setHours(0, 0, 0, 0);
        const isToday = lessonDate.getTime() === today.getTime();
        
        selectedLessons.push({
          ...lesson,
          isToday: isToday
        });
      } else {
        selectedLessons.push(null);
      }
    }
    
    return selectedLessons.slice(0, nodeCount);
  }, [lessons, currentIndex, isMobile]);

  // 處理媒體查看
  const handleViewMedia = (media: StudentMedia, lessonDate?: string) => {
    setSelectedMedia(media);
    setSelectedMediaLessonDate(lessonDate || null);
    setShowMediaModal(true);
  };

  // 關閉媒體模態框
  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    setSelectedMedia(null);
    setSelectedMediaLessonDate(null);
  };

  // 箭頭導航函數
  const handlePreviousLessons = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextLessons = () => {
    const sortedLessons = [...lessons].sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    );
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const nodeCount = isMobile ? 3 : 5;
    const maxIndex = Math.max(0, sortedLessons.length - nodeCount);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // 檢查是否可以導航
  const canGoPrevious = currentIndex > 0;
  const canGoNext = (() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const nodeCount = isMobile ? 3 : 5;
    return currentIndex < Math.max(0, lessons.length - nodeCount);
  })();

  // 構建媒體URL的輔助函數
  const buildMediaUrl = (media: StudentMedia): string | null => {
    if (!media.file_path) return null;
    
    // 如果 file_path 已經包含完整的 URL，直接返回
    if (media.file_path.startsWith('http')) {
      return media.file_path;
    }
    
    // 根據實際的 storage bucket 名稱構建 URL
    // 從代碼中看到媒體檔案是上傳到 'hanami-media' bucket
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hanami-media/${media.file_path}`;
  };

  // 處理媒體下載
  const handleDownloadMedia = async (media: StudentMedia) => {
    try {
      // 構建媒體URL
      const mediaUrl = buildMediaUrl(media);
      
      if (!mediaUrl) {
        toast.error('檔案連結不存在');
        return;
      }

      // 使用 fetch 下載檔案
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 創建下載連結
      const link = document.createElement('a');
      link.href = url;
      link.download = media.title || media.file_name || 'media_file';
      link.style.display = 'none';
      
      // 觸發下載
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL 對象
      window.URL.revokeObjectURL(url);
      
      toast.success(`正在下載: ${media.title || media.file_name}`);
    } catch (error) {
      console.error('下載失敗:', error);
      toast.error('下載失敗，請稍後再試');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
          />
          <span className="ml-4 text-gray-600">載入課程資料中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600
              transition-colors duration-200"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">尚未有課程記錄</p>
          <p className="text-gray-500">課程開始後，媒體和評估資料將顯示在這裡</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#FEFCFB] via-[#FDF9F7] to-[#FCF6F3] ${className}`}>
      {/* 標題區域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {studentName} 的學習軌跡
            </h2>
            <p className="text-gray-600 flex items-center">
              <Train className="w-4 h-4 mr-2 text-orange-500" />
              地鐵站線路圖風格 - 探索每個課堂的精彩時刻
            </p>
          </div>
          
          {/* 視圖模式切換 */}
          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto">
            {[
              { key: 'timeline', label: '時間軸', icon: Train },
              { key: 'media', label: '媒體庫', icon: Image }
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  viewMode === key
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.charAt(0)}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="p-6">
        {viewMode === 'timeline' && (
          <div className="space-y-8">
            {/* 地鐵線路圖 */}
            <div className="bg-white rounded-2xl p-8 pt-12 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                  課程時間軸
                </h3>
                
                {/* 時間軸說明 */}
                <div className="text-sm text-gray-600">
                  左邊：過去的課程 | 中間：今天 | 右邊：未來的課程
                </div>
              </div>

              {/* 地鐵站節點 */}
              <div className="flex items-center justify-between relative overflow-x-auto py-8 px-16">
                {/* 左箭頭 */}
                <motion.button
                  onClick={handlePreviousLessons}
                  disabled={!canGoPrevious}
                  className={`absolute left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center
                    ${canGoPrevious 
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } transition-all duration-200`}
                  whileHover={canGoPrevious ? { scale: 1.1 } : {}}
                  whileTap={canGoPrevious ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>

                <div className="flex items-center justify-between min-w-full">
                  {processedLessons.map((lesson, index) => (
                    <MetroStationNode
                      key={lesson?.id || `empty-${index}`}
                      lesson={lesson}
                      isActive={lesson === selectedLesson}
                      isSelected={lesson === selectedLesson}
                      onClick={() => lesson && setSelectedLesson(lesson)}
                      index={index}
                      totalStations={processedLessons.length}
                    />
                  ))}
                </div>

                {/* 右箭頭 */}
                <motion.button
                  onClick={handleNextLessons}
                  disabled={!canGoNext}
                  className={`absolute right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center
                    ${canGoNext 
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } transition-all duration-200`}
                  whileHover={canGoNext ? { scale: 1.1 } : {}}
                  whileTap={canGoNext ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* 選中課程詳情 */}
            {selectedLesson && (
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h4>
                    <p className="text-gray-600">
                      {selectedLesson.actual_timeslot} • {selectedLesson.lesson_teacher}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">課程類型</div>
                    <div className="text-lg font-medium text-orange-600">
                      {selectedLesson.course_type}
                    </div>
                  </div>
                </div>

                {/* 課程內容 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* 課程活動 */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                        本次課堂活動
                      </h5>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">本次課堂活動</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">進行中</span>
                          </div>
                          
                          {/* 正在學習的活動 */}
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">
                                {selectedLesson.lesson_activities || todayLessonRecord?.lesson_activities || '暫無活動記錄'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">正在學習</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {selectedLesson.course_type || '課程'}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  {selectedLesson.lesson_teacher || '教師'}
                                </span>
                              </div>
                              <span>課程時間: {selectedLesson.actual_timeslot || '未設定'}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              分配時間: {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')}
                            </div>
                          </div>

                          {/* 未開始的活動 */}
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-600">未開始活動</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">待開始</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">0002-手指練習</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 2</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">0003-節奏訓練</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 1</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">0004-音階練習</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 3</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              預計完成時間: 下週課程
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* 進度筆記 */}
                    <h5 className="font-semibold text-gray-800 mb-3 mt-4 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-green-500" />
                      進度筆記
                    </h5>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">進度記錄</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">已記錄</span>
                            {isTeacher && !isEditingProgressNotes && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const currentNotes = selectedLesson.progress_notes || todayLessonRecord?.progress_notes || '';
                                    setEditedProgressNotes(currentNotes);
                                    setIsEditingProgressNotes(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] hover:from-[#EBC9A4] hover:to-[#FFD59A] text-[#2B3A3B] transition-colors shadow-sm hover:shadow-md"
                                  title="編輯進度筆記"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {(selectedLesson.progress_notes || todayLessonRecord?.progress_notes) && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm('確定要刪除此進度筆記嗎？')) return;
                                      await handleDeleteProgressNotes();
                                    }}
                                    className="p-1.5 rounded-lg bg-[#FFE0E0] hover:bg-[#FFCCCC] text-[#2B3A3B] transition-colors shadow-sm hover:shadow-md"
                                    title="刪除進度筆記"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">學習進度</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">進行中</span>
                          </div>
                          {isEditingProgressNotes ? (
                            <div className="space-y-3">
                              <textarea
                                value={editedProgressNotes}
                                onChange={(e) => setEditedProgressNotes(e.target.value)}
                                className="w-full p-3 border border-[#EADBC8] rounded-lg text-sm text-[#4B4036] bg-[#FFFDF8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent resize-none placeholder-[#8A7C70]"
                                rows={4}
                                placeholder="請輸入學習進度..."
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setIsEditingProgressNotes(false);
                                    setEditedProgressNotes('');
                                  }}
                                  className="px-4 py-2 text-sm rounded-full bg-[#FFFDF8] hover:bg-[#F8F5EC] text-[#4B4036] border-2 border-[#EADBC8] hover:border-[#FFD59A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                  disabled={isSaving}
                                >
                                  取消
                                </button>
                                <button
                                  onClick={handleSaveProgressNotes}
                                  disabled={isSaving}
                                  className="px-4 py-2 text-sm rounded-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] hover:from-[#EBC9A4] hover:to-[#FFD59A] text-[#2B3A3B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
                                >
                                  {isSaving ? '儲存中...' : '儲存'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm text-[#4B4036] mb-2 whitespace-pre-wrap leading-relaxed">
                                {selectedLesson.progress_notes || todayLessonRecord?.progress_notes || '暫無進度筆記'}
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <div className="flex space-x-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">進度追蹤</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    {selectedLesson.course_type || '課程學習'}
                                  </span>
                                </div>
                                <span>記錄時間: {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 下週目標 */}
                    <h5 className="font-semibold text-gray-800 mb-3 mt-4 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      下週目標
                    </h5>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">學習目標</span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">待完成</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">下週目標</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">計劃中</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            {selectedLesson.next_target || todayLessonRecord?.next_target || '暫無目標設定'}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <div className="flex space-x-2">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">目標設定</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                {selectedLesson.course_type || '課程學習'}
                              </span>
                            </div>
                            <span>設定時間: {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 課程媒體 */}
                    {selectedLesson.media.length > 0 && (
                      <>
                        <h5 className="font-semibold text-gray-800 mb-3 mt-4 flex items-center">
                          <Video className="w-4 h-4 mr-2 text-purple-500" />
                          課程媒體
                        </h5>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedLesson.media.map((media, index) => (
                              <MediaCard
                                key={media.id}
                                media={media}
                                lessonDate={selectedLesson.lesson_date}
                                onView={() => handleViewMedia(media, selectedLesson.lesson_date)}
                                onDownload={() => handleDownloadMedia(media)}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 媒體和評估 */}
                  <div className="space-y-4 md:space-y-6">
                    {/* 媒體統計 */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Image className="w-4 h-4 mr-2 text-purple-500" />
                        媒體檔案
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">影片</span>
                          <span className="font-medium text-purple-600">
                            {selectedLesson.media.filter(m => m.media_type === 'video').length} 個
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">相片</span>
                          <span className="font-medium text-purple-600">
                            {selectedLesson.media.filter(m => m.media_type === 'photo').length} 個
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-purple-200 pt-2">
                          <span className="text-sm font-medium text-gray-700">總計</span>
                          <span className="font-bold text-purple-700">
                            {selectedLesson.media.length} 個
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {viewMode === 'media' && selectedLesson && (
          <div className="space-y-6">
            {/* 媒體庫標題和統計 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-orange-500" />
                  {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')} 的媒體檔案
                </h3>
                <div className="text-sm text-gray-600">
                  共 {selectedLesson.media.length} 個檔案
                </div>
              </div>

              {/* 媒體統計 */}
              {selectedLesson.media.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedLesson.media.filter(m => m.media_type === 'video').length}
                        </div>
                        <div className="text-sm text-gray-600">影片</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedLesson.media.filter(m => m.media_type === 'photo').length}
                        </div>
                        <div className="text-sm text-gray-600">相片</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatFileSize(selectedLesson.media.reduce((total, m) => total + (m.file_size || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">總大小</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedLesson.media.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {selectedLesson.media.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MediaCard
                      media={media}
                      onView={() => handleViewMedia(media, selectedLesson.lesson_date)}
                      onDownload={() => handleDownloadMedia(media)}
                      lessonDate={selectedLesson.lesson_date}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">此課程暫無媒體檔案</h4>
                <p className="text-gray-500">媒體檔案將在課程結束後顯示</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 媒體播放模態框 */}
      <AnimatePresence>
        {showMediaModal && selectedMedia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseMediaModal}
          >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-transparent" />
            
            {/* 媒體播放器 */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 標題欄 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {selectedMedia.media_type === 'video' ? (
                    <Video className="w-6 h-6 text-blue-500" />
                  ) : (
                    <Image className="w-6 h-6 text-green-500" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedMedia.title || selectedMedia.file_name}
                  </h3>
                </div>
                <button
                  onClick={handleCloseMediaModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 媒體內容 */}
              <div className="p-6">
                {selectedMedia.media_type === 'video' ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full"
                      src={buildMediaUrl(selectedMedia) || undefined}
                      onError={(e) => {
                        console.error('影片載入失敗:', e);
                        console.error('檔案路徑:', selectedMedia.file_path);
                        console.error('構建的URL:', buildMediaUrl(selectedMedia));
                        toast.error('影片載入失敗，請檢查檔案路徑');
                      }}
                    >
                      您的瀏覽器不支援影片播放
                    </video>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <img
                      src={buildMediaUrl(selectedMedia) || undefined}
                      alt={selectedMedia.title || selectedMedia.file_name}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                      onError={(e) => {
                        console.error('圖片載入失敗:', e);
                        console.error('檔案路徑:', selectedMedia.file_path);
                        console.error('構建的URL:', buildMediaUrl(selectedMedia));
                        toast.error('圖片載入失敗，請檢查檔案路徑');
                      }}
                    />
                  </div>
                )}

                {/* 媒體資訊 */}
                <div className="mt-4 space-y-3">
                  {/* 日期資訊 */}
                  <div className="space-y-2">
                    {/* 課程關聯日期 */}
                    {selectedMediaLessonDate && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600">
                        <Calendar className="w-4 h-4" />
                        <span>課程日期: {new Date(selectedMediaLessonDate).toLocaleDateString('zh-TW')}</span>
                      </div>
                    )}
                    
                    {/* 上傳日期 */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>上傳時間: {new Date(selectedMedia.created_at).toLocaleString('zh-TW')}</span>
                    </div>
                  </div>
                  
                  {/* 檔案資訊 */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>檔案大小: {formatFileSize(selectedMedia.file_size || 0)}</span>
                    {selectedMedia.media_type === 'video' && selectedMedia.file_duration && (
                      <span>影片長度: {getDuration(selectedMedia.file_duration)}</span>
                    )}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => handleDownloadMedia(selectedMedia)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下載</span>
                  </button>
                  <button
                    onClick={handleCloseMediaModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
