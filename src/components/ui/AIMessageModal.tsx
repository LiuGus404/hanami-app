'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, FileText, UserX, ChevronDown, ChevronUp, Settings, Plus, Edit, Trash2, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// HanamiButton 可愛按鈕（如有可引入，否則用 button 取代）
// import { HanamiButton } from './HanamiButton';

interface AIMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  selectedLesson?: {
    lessons: Array<{
      lesson_date: string;
      course_type: string;
      actual_timeslot?: string;
      lesson_teacher?: string;
      lesson_status?: string;
      lesson_duration?: string;
    }>;
    count: number;
  } | null;
}

interface MessageTemplate {
  id: string;
  template_name: string;
  template_content: string;
  template_type: string;
  is_active: boolean;
}

export default function AIMessageModal({ isOpen, onClose, students, selectedLesson }: AIMessageModalProps) {
  // 狀態管理
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showStudents, setShowStudents] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [mobileTab, setMobileTab] = useState<'students' | 'templates'>('students');
  const [showStudentDetails, setShowStudentDetails] = useState<Record<string, boolean>>({});
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // 範本管理狀態
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_content: '',
    template_type: 'general'
  });
  
  // 課堂資料相關狀態
  const [studentLessons, setStudentLessons] = useState<Record<string, any[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState(false);
  
  // 變數說明展開狀態
  const [showAllVariables, setShowAllVariables] = useState(false);
  const [showStudentVariables, setShowStudentVariables] = useState(false);
  const [showLessonVariables, setShowLessonVariables] = useState(false);
  
  // 變數快取狀態
  const [variablesCache, setVariablesCache] = useState<Record<string, any>>({});
  const [cacheKey, setCacheKey] = useState(0);
  
  // 調試狀態
  const [showDebug, setShowDebug] = useState(false);
  


  // 支援正式學生與試堂學生所有欄位
  const systemVariables = [
    { key: 'full_name', label: '學生姓名' },
    { key: 'nick_name', label: '學生暱稱' },
    { key: 'student_age', label: '學生年齡' },
    { key: 'student_dob', label: '學生生日' },
    { key: 'gender', label: '性別' },
    { key: 'contact_number', label: '聯絡電話' },
    { key: 'student_email', label: '學生電郵' },
    { key: 'parent_email', label: '家長電郵' },
    { key: 'address', label: '地址' },
    { key: 'school', label: '就讀學校' },
    { key: 'student_type', label: '學生類型' },
    { key: 'course_type', label: '課程類型' },
    { key: 'student_teacher', label: '老師姓名' },
    { key: 'regular_weekday', label: '固定上課日' },
    { key: 'regular_timeslot', label: '固定上課時段' },
    { key: 'lesson_date', label: '上課日期' },
    { key: 'lesson_duration', label: '上課時長' },
    { key: 'actual_timeslot', label: '實際上課時段' },
    { key: 'duration_months', label: '課程月數' },
    { key: 'remaining_lessons', label: '剩餘課程數' },
    { key: 'ongoing_lessons', label: '進行中課程數' },
    { key: 'upcoming_lessons', label: '即將到來課程數' },
    { key: 'health_notes', label: '健康備註' },
    { key: 'student_preference', label: '學生偏好' },
    { key: 'student_remarks', label: '學生備註' },
    { key: 'trial_status', label: '試堂狀態' },
    { key: 'trial_remarks', label: '試堂備註' },
    { key: 'student_oid', label: '學生代碼' },
    { key: 'access_role', label: '權限' },
    { key: 'custom_message', label: '自訂訊息' },
  ];

  // 課堂相關變數（使用 useMemo 動態更新）
  const lessonVariables = React.useMemo(() => [
    // 選中課堂資訊
    { key: 'selected_content', label: '選中課堂內容（完整）🎼📆⏰👨‍🏫✅' },
    { key: 'selected_content_basic', label: '選中課堂內容（基本）🎼📆⏰' },
    { key: 'selected_content_date', label: '選中課堂內容（日期）🎼📆' },
    { key: 'selected_content_teacher', label: '選中課堂內容（老師）🎼📆⏰👨‍🏫' },
    { key: 'selected_content_status', label: '選中課堂內容（出席）🎼📆⏰✅' },
    
    // 基本課堂資訊
    { key: 'recent_lesson_date', label: '最近一堂日期' },
    { key: 'recent_lesson_weekday', label: '最近一堂星期' },
    { key: 'recent_lesson_course_type', label: '最近一堂課程類型' },
    { key: 'recent_lesson_actual_timeslot', label: '最近一堂實際上課時段' },
    { key: 'recent_lesson_teacher', label: '最近一堂老師' },
    { key: 'recent_lesson_status', label: '最近一堂出席狀況' },
    { key: 'next_lesson_date', label: '下一堂日期' },
    { key: 'next_lesson_weekday', label: '下一堂星期' },
    { key: 'next_lesson_course_type', label: '下一堂課程類型' },
    { key: 'next_lesson_actual_timeslot', label: '下一堂實際上課時段' },
    { key: 'next_lesson_teacher', label: '下一堂老師' },
    { key: 'previous_lesson_date', label: '上一堂日期' },
    { key: 'previous_lesson_weekday', label: '上一堂星期' },
    { key: 'previous_lesson_course_type', label: '上一堂課程類型' },
    { key: 'previous_lesson_actual_timeslot', label: '上一堂實際上課時段' },
    { key: 'previous_lesson_teacher', label: '上一堂老師' },
    
    // 課堂統計
    { key: 'future_lessons_count', label: '未來課堂數量' },
    { key: 'past_lessons_count', label: '過去課堂數量' },
    { key: 'total_lessons_count', label: '總課堂數量' },
    { key: 'future_lessons_dates', label: '未來課堂日期列表' },
    { key: 'past_lessons_dates', label: '過去課堂日期列表' },
    { key: 'recent_lessons_dates', label: '最近X堂日期列表' },
    { key: 'upcoming_lessons_dates', label: '即將X堂日期列表' },
    
    // 最近一堂詳細資訊
    { key: 'recent_lesson_id', label: '最近一堂ID' },
    { key: 'recent_lesson_student_id', label: '最近一堂學生ID' },
    { key: 'recent_lesson_package_id', label: '最近一堂課程包ID' },
    { key: 'recent_lesson_regular_timeslot', label: '最近一堂預定時段' },
    { key: 'recent_lesson_progress_notes', label: '最近一堂進度備註' },
    { key: 'recent_lesson_video_url', label: '最近一堂影片連結' },
    { key: 'recent_lesson_next_target', label: '最近一堂下個目標' },
    { key: 'recent_lesson_remarks', label: '最近一堂備註' },
    { key: 'recent_lesson_created_at', label: '最近一堂建立時間' },
    { key: 'recent_lesson_updated_at', label: '最近一堂更新時間' },
    { key: 'recent_lesson_status_type', label: '最近一堂狀態類型' },
    { key: 'recent_lesson_access_role', label: '最近一堂權限' },
    { key: 'recent_lesson_notes', label: '最近一堂筆記' },
    { key: 'recent_lesson_regular_weekday', label: '最近一堂預定星期' },
    { key: 'recent_lesson_duration', label: '最近一堂課程時長' },
    { key: 'recent_lesson_student_oid', label: '最近一堂學生代碼' },
    { key: 'recent_lesson_full_name', label: '最近一堂學生姓名' },
    { key: 'recent_lesson_activities', label: '最近一堂活動內容' },
    
    // 下一堂詳細資訊
    { key: 'next_lesson_id', label: '下一堂ID' },
    { key: 'next_lesson_student_id', label: '下一堂學生ID' },
    { key: 'next_lesson_package_id', label: '下一堂課程包ID' },
    { key: 'next_lesson_regular_timeslot', label: '下一堂預定時段' },
    { key: 'next_lesson_progress_notes', label: '下一堂進度備註' },
    { key: 'next_lesson_video_url', label: '下一堂影片連結' },
    { key: 'next_lesson_next_target', label: '下一堂下個目標' },
    { key: 'next_lesson_remarks', label: '下一堂備註' },
    { key: 'next_lesson_created_at', label: '下一堂建立時間' },
    { key: 'next_lesson_updated_at', label: '下一堂更新時間' },
    { key: 'next_lesson_status_type', label: '下一堂狀態類型' },
    { key: 'next_lesson_access_role', label: '下一堂權限' },
    { key: 'next_lesson_notes', label: '下一堂筆記' },
    { key: 'next_lesson_regular_weekday', label: '下一堂預定星期' },
    { key: 'next_lesson_duration', label: '下一堂課程時長' },
    { key: 'next_lesson_student_oid', label: '下一堂學生代碼' },
    { key: 'next_lesson_full_name', label: '下一堂學生姓名' },
    { key: 'next_lesson_activities', label: '下一堂活動內容' },
    
    // 上一堂詳細資訊
    { key: 'previous_lesson_id', label: '上一堂ID' },
    { key: 'previous_lesson_student_id', label: '上一堂學生ID' },
    { key: 'previous_lesson_package_id', label: '上一堂課程包ID' },
    { key: 'previous_lesson_regular_timeslot', label: '上一堂預定時段' },
    { key: 'previous_lesson_progress_notes', label: '上一堂進度備註' },
    { key: 'previous_lesson_video_url', label: '上一堂影片連結' },
    { key: 'previous_lesson_next_target', label: '上一堂下個目標' },
    { key: 'previous_lesson_remarks', label: '上一堂備註' },
    { key: 'previous_lesson_created_at', label: '上一堂建立時間' },
    { key: 'previous_lesson_updated_at', label: '上一堂更新時間' },
    { key: 'previous_lesson_status_type', label: '上一堂狀態類型' },
    { key: 'previous_lesson_access_role', label: '上一堂權限' },
    { key: 'previous_lesson_notes', label: '上一堂筆記' },
    { key: 'previous_lesson_regular_weekday', label: '上一堂預定星期' },
    { key: 'previous_lesson_duration', label: '上一堂課程時長' },
    { key: 'previous_lesson_student_oid', label: '上一堂學生代碼' },
    { key: 'previous_lesson_full_name', label: '上一堂學生姓名' },
    { key: 'previous_lesson_activities', label: '上一堂活動內容' },
    
    // 動態課堂變數範例（支援1-20堂）
    { key: 'custom_past_1_lesson_date', label: '過去第1堂日期' },
    { key: 'custom_past_1_lesson_date_timeslot', label: '過去第1堂日期+時間' },
    { key: 'custom_past_1_lesson_weekday', label: '過去第1堂星期' },
    { key: 'custom_past_2_lesson_date', label: '過去第2堂日期' },
    { key: 'custom_past_2_lesson_date_timeslot', label: '過去第2堂日期+時間' },
    { key: 'custom_past_2_lesson_weekday', label: '過去第2堂星期' },
    { key: 'custom_past_3_lesson_date', label: '過去第3堂日期' },
    { key: 'custom_past_3_lesson_date_timeslot', label: '過去第3堂日期+時間' },
    { key: 'custom_past_3_lesson_weekday', label: '過去第3堂星期' },
    { key: 'custom_future_1_lesson_date', label: '未來第1堂日期' },
    { key: 'custom_future_1_lesson_date_timeslot', label: '未來第1堂日期+時間' },
    { key: 'custom_future_1_lesson_weekday', label: '未來第1堂星期' },
    { key: 'custom_future_2_lesson_date', label: '未來第2堂日期' },
    { key: 'custom_future_2_lesson_date_timeslot', label: '未來第2堂日期+時間' },
    { key: 'custom_future_2_lesson_weekday', label: '未來第2堂星期' },
    { key: 'custom_future_3_lesson_date', label: '未來第3堂日期' },
    { key: 'custom_future_3_lesson_date_timeslot', label: '未來第3堂日期+時間' },
    { key: 'custom_future_3_lesson_weekday', label: '未來第3堂星期' },
  ], []);

  // 變數別名對應表，支援多組常見英文變數
  const variableAlias: Record<string, string[]> = {
    student_name: ['full_name', 'fullName'],
    student_nickname: ['nick_name', 'nickName'],
    teacher_name: ['student_teacher', 'teacher_name'],
    lesson_time: ['regular_timeslot', 'lesson_time'],
  };

  // 處理課堂變數的函數
  const getLessonVariables = (studentId: string) => {
    const lessons = studentLessons[studentId] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 除錯：顯示課堂資料
    console.log(`[AI訊息] 學生 ${studentId} 的課堂資料:`, lessons);
    console.log(`[AI訊息] 學生 ${studentId} 的課堂資料長度:`, lessons.length);
    
    // 分類課堂
    const pastLessons = lessons.filter(lesson => new Date(lesson.lesson_date) < today);
    const futureLessons = lessons.filter(lesson => new Date(lesson.lesson_date) >= today);
    
    console.log(`[AI訊息] 學生 ${studentId} 過去課堂:`, pastLessons.length, '堂');
    console.log(`[AI訊息] 學生 ${studentId} 未來課堂:`, futureLessons.length, '堂');
    
    // 最近一堂（過去的最後一堂）
    const recentLesson = pastLessons.length > 0 ? pastLessons[pastLessons.length - 1] : null;
    
    // 下一堂（未來的第一堂）
    const nextLesson = futureLessons.length > 0 ? futureLessons[0] : null;
    
    // 上一堂（過去的倒數第二堂）
    const previousLesson = pastLessons.length > 1 ? pastLessons[pastLessons.length - 2] : null;
    
    console.log(`[AI訊息] 學生 ${studentId} 最近一堂:`, recentLesson);
    console.log(`[AI訊息] 學生 ${studentId} 下一堂:`, nextLesson);
    console.log(`[AI訊息] 學生 ${studentId} 上一堂:`, previousLesson);
    
    // 格式化日期列表
    const formatDateList = (lessonList: any[], count: number = 5) => {
      return lessonList.slice(0, count).map(lesson => 
        new Date(lesson.lesson_date).toLocaleDateString('zh-TW')
      ).join('、');
    };
    
    // 格式化課堂資訊（可選擇是否顯示時間）
    const formatLessonInfo = (lesson: any, includeTime: boolean = true) => {
      if (!lesson) return '';
      const date = new Date(lesson.lesson_date).toLocaleDateString('zh-TW');
      const time = includeTime && lesson.actual_timeslot ? ` ${lesson.actual_timeslot}` : '';
      return date + time;
    };
    
    // 日期轉星期函數
    const getWeekdayFromDate = (dateString: string) => {
      if (!dateString) {
        console.log(`[AI訊息] 轉換星期，輸入日期為空`);
        return '';
      }
      try {
        console.log(`[AI訊息] 轉換星期，輸入日期:`, dateString, `類型:`, typeof dateString);
        
        // 處理不同的日期格式
        let date: Date;
        if (dateString.includes('/')) {
          // 處理 "2025/8/20" 格式
          const parts = dateString.split('/');
          console.log(`[AI訊息] 分割日期部分:`, parts);
          const [year, month, day] = parts.map(Number);
          console.log(`[AI訊息] 解析數字:`, { year, month, day });
          date = new Date(year, month - 1, day); // month - 1 因為 JavaScript 月份從 0 開始
        } else {
          // 處理其他格式
          date = new Date(dateString);
        }
        
        console.log(`[AI訊息] 轉換星期，Date物件:`, date);
        console.log(`[AI訊息] 轉換星期，Date.getTime():`, date.getTime());
        
        // 檢查日期是否有效
        if (isNaN(date.getTime())) {
          console.error(`[AI訊息] 無效日期:`, dateString);
          return '';
        }
        
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        console.log(`[AI訊息] 轉換星期，結果:`, weekday);
        return weekday;
      } catch (error) {
        console.error(`[AI訊息] 轉換星期錯誤:`, error);
        return '';
      }
    };
    
    // 動態課堂變數處理函數
    const getDynamicLessonData = () => {
      const dynamicData: Record<string, any> = {};
      
      // 處理過去課堂變數 (custom_past_X_lesson_*)
      for (let i = 1; i <= 20; i++) {
        const pastLesson = pastLessons.length >= i ? pastLessons[pastLessons.length - i] : null;
        // 根據變數名稱決定是否顯示時間
        const pastLessonDate = pastLesson ? new Date(pastLesson.lesson_date).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_past_${i}_lesson_date`] = pastLessonDate; // 不顯示時間
        dynamicData[`custom_past_${i}_lesson_date_timeslot`] = formatLessonInfo(pastLesson, true); // 顯示時間
        dynamicData[`custom_past_${i}_lesson_weekday`] = getWeekdayFromDate(pastLesson?.lesson_date); // 星期
        dynamicData[`custom_past_${i}_lesson_course_type`] = pastLesson?.course_type || '';
        dynamicData[`custom_past_${i}_lesson_actual_timeslot`] = pastLesson?.actual_timeslot || '';
        dynamicData[`custom_past_${i}_lesson_teacher`] = pastLesson?.lesson_teacher || '';
        dynamicData[`custom_past_${i}_lesson_status`] = pastLesson?.lesson_status || '';
        
        // 加入所有課堂欄位
        dynamicData[`custom_past_${i}_lesson_id`] = pastLesson?.id || '';
        dynamicData[`custom_past_${i}_lesson_student_id`] = pastLesson?.student_id || '';
        dynamicData[`custom_past_${i}_lesson_package_id`] = pastLesson?.package_id || '';
        dynamicData[`custom_past_${i}_lesson_regular_timeslot`] = pastLesson?.regular_timeslot || '';
        dynamicData[`custom_past_${i}_lesson_progress_notes`] = pastLesson?.progress_notes || '';
        dynamicData[`custom_past_${i}_lesson_video_url`] = pastLesson?.video_url || '';
        dynamicData[`custom_past_${i}_lesson_next_target`] = pastLesson?.next_target || '';
        dynamicData[`custom_past_${i}_lesson_remarks`] = pastLesson?.remarks || '';
        dynamicData[`custom_past_${i}_lesson_created_at`] = pastLesson?.created_at ? new Date(pastLesson.created_at).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_past_${i}_lesson_updated_at`] = pastLesson?.updated_at ? new Date(pastLesson.updated_at).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_past_${i}_lesson_status_type`] = pastLesson?.status || '';
        dynamicData[`custom_past_${i}_lesson_access_role`] = pastLesson?.access_role || '';
        dynamicData[`custom_past_${i}_lesson_notes`] = pastLesson?.notes || '';
        dynamicData[`custom_past_${i}_lesson_regular_weekday`] = pastLesson?.regular_weekday || '';
        dynamicData[`custom_past_${i}_lesson_duration`] = pastLesson?.lesson_duration || '';
        dynamicData[`custom_past_${i}_lesson_student_oid`] = pastLesson?.student_oid || '';
        dynamicData[`custom_past_${i}_lesson_full_name`] = pastLesson?.full_name || '';
        dynamicData[`custom_past_${i}_lesson_activities`] = pastLesson?.lesson_activities || '';
      }
      
      // 處理未來課堂變數 (custom_future_X_lesson_*)
      for (let i = 1; i <= 20; i++) {
        const futureLesson = futureLessons.length >= i ? futureLessons[i - 1] : null;
        // 根據變數名稱決定是否顯示時間
        const futureLessonDate = futureLesson ? new Date(futureLesson.lesson_date).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_future_${i}_lesson_date`] = futureLessonDate; // 不顯示時間
        dynamicData[`custom_future_${i}_lesson_date_timeslot`] = formatLessonInfo(futureLesson, true); // 顯示時間
        dynamicData[`custom_future_${i}_lesson_weekday`] = getWeekdayFromDate(futureLesson?.lesson_date); // 星期
        dynamicData[`custom_future_${i}_lesson_course_type`] = futureLesson?.course_type || '';
        dynamicData[`custom_future_${i}_lesson_actual_timeslot`] = futureLesson?.actual_timeslot || '';
        dynamicData[`custom_future_${i}_lesson_teacher`] = futureLesson?.lesson_teacher || '';
        dynamicData[`custom_future_${i}_lesson_status`] = futureLesson?.lesson_status || '';
        
        // 加入所有課堂欄位
        dynamicData[`custom_future_${i}_lesson_id`] = futureLesson?.id || '';
        dynamicData[`custom_future_${i}_lesson_student_id`] = futureLesson?.student_id || '';
        dynamicData[`custom_future_${i}_lesson_package_id`] = futureLesson?.package_id || '';
        dynamicData[`custom_future_${i}_lesson_regular_timeslot`] = futureLesson?.regular_timeslot || '';
        dynamicData[`custom_future_${i}_lesson_progress_notes`] = futureLesson?.progress_notes || '';
        dynamicData[`custom_future_${i}_lesson_video_url`] = futureLesson?.video_url || '';
        dynamicData[`custom_future_${i}_lesson_next_target`] = futureLesson?.next_target || '';
        dynamicData[`custom_future_${i}_lesson_remarks`] = futureLesson?.remarks || '';
        dynamicData[`custom_future_${i}_lesson_created_at`] = futureLesson?.created_at ? new Date(futureLesson.created_at).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_future_${i}_lesson_updated_at`] = futureLesson?.updated_at ? new Date(futureLesson.updated_at).toLocaleDateString('zh-TW') : '';
        dynamicData[`custom_future_${i}_lesson_status_type`] = futureLesson?.status || '';
        dynamicData[`custom_future_${i}_lesson_access_role`] = futureLesson?.access_role || '';
        dynamicData[`custom_future_${i}_lesson_notes`] = futureLesson?.notes || '';
        dynamicData[`custom_future_${i}_lesson_regular_weekday`] = futureLesson?.regular_weekday || '';
        dynamicData[`custom_future_${i}_lesson_duration`] = futureLesson?.lesson_duration || '';
        dynamicData[`custom_future_${i}_lesson_student_oid`] = futureLesson?.student_oid || '';
        dynamicData[`custom_future_${i}_lesson_full_name`] = futureLesson?.full_name || '';
        dynamicData[`custom_future_${i}_lesson_activities`] = futureLesson?.lesson_activities || '';
      }
      
      return dynamicData;
    };
    
    const result = {
      // 基本課堂資訊
      recent_lesson_date: recentLesson ? new Date(recentLesson.lesson_date).toLocaleDateString('zh-TW') : '',
      recent_lesson_weekday: getWeekdayFromDate(recentLesson?.lesson_date),
      recent_lesson_course_type: recentLesson?.course_type || '',
      recent_lesson_actual_timeslot: recentLesson?.actual_timeslot || '',
      recent_lesson_teacher: recentLesson?.lesson_teacher || '',
      recent_lesson_status: recentLesson?.lesson_status || '',
      next_lesson_date: nextLesson ? new Date(nextLesson.lesson_date).toLocaleDateString('zh-TW') : '',
      next_lesson_weekday: getWeekdayFromDate(nextLesson?.lesson_date),
      next_lesson_course_type: nextLesson?.course_type || '',
      next_lesson_actual_timeslot: nextLesson?.actual_timeslot || '',
      next_lesson_teacher: nextLesson?.lesson_teacher || '',
      previous_lesson_date: previousLesson ? new Date(previousLesson.lesson_date).toLocaleDateString('zh-TW') : '',
      previous_lesson_weekday: getWeekdayFromDate(previousLesson?.lesson_date),
      previous_lesson_course_type: previousLesson?.course_type || '',
      previous_lesson_actual_timeslot: previousLesson?.actual_timeslot || '',
      previous_lesson_teacher: previousLesson?.lesson_teacher || '',
      
      // 課堂統計
      future_lessons_count: futureLessons.length,
      past_lessons_count: pastLessons.length,
      total_lessons_count: lessons.length,
      future_lessons_dates: formatDateList(futureLessons),
      past_lessons_dates: formatDateList(pastLessons),
      recent_lessons_dates: formatDateList(pastLessons.slice(-5)), // 最近5堂
      upcoming_lessons_dates: formatDateList(futureLessons.slice(0, 5)), // 即將5堂
      
      // 最近一堂的所有欄位
      recent_lesson_id: recentLesson?.id || '',
      recent_lesson_student_id: recentLesson?.student_id || '',
      recent_lesson_package_id: recentLesson?.package_id || '',
      recent_lesson_regular_timeslot: recentLesson?.regular_timeslot || '',
      recent_lesson_progress_notes: recentLesson?.progress_notes || '',
      recent_lesson_video_url: recentLesson?.video_url || '',
      recent_lesson_next_target: recentLesson?.next_target || '',
      recent_lesson_remarks: recentLesson?.remarks || '',
      recent_lesson_created_at: recentLesson?.created_at ? new Date(recentLesson.created_at).toLocaleDateString('zh-TW') : '',
      recent_lesson_updated_at: recentLesson?.updated_at ? new Date(recentLesson.updated_at).toLocaleDateString('zh-TW') : '',
      recent_lesson_status_type: recentLesson?.status || '',
      recent_lesson_access_role: recentLesson?.access_role || '',
      recent_lesson_notes: recentLesson?.notes || '',
      recent_lesson_regular_weekday: recentLesson?.regular_weekday || '',
      recent_lesson_duration: recentLesson?.lesson_duration || '',
      recent_lesson_student_oid: recentLesson?.student_oid || '',
      recent_lesson_full_name: recentLesson?.full_name || '',
      recent_lesson_activities: recentLesson?.lesson_activities || '',
      
      // 下一堂的所有欄位
      next_lesson_id: nextLesson?.id || '',
      next_lesson_student_id: nextLesson?.student_id || '',
      next_lesson_package_id: nextLesson?.package_id || '',
      next_lesson_regular_timeslot: nextLesson?.regular_timeslot || '',
      next_lesson_progress_notes: nextLesson?.progress_notes || '',
      next_lesson_video_url: nextLesson?.video_url || '',
      next_lesson_next_target: nextLesson?.next_target || '',
      next_lesson_remarks: nextLesson?.remarks || '',
      next_lesson_created_at: nextLesson?.created_at ? new Date(nextLesson.created_at).toLocaleDateString('zh-TW') : '',
      next_lesson_updated_at: nextLesson?.updated_at ? new Date(nextLesson.updated_at).toLocaleDateString('zh-TW') : '',
      next_lesson_status_type: nextLesson?.status || '',
      next_lesson_access_role: nextLesson?.access_role || '',
      next_lesson_notes: nextLesson?.notes || '',
      next_lesson_regular_weekday: nextLesson?.regular_weekday || '',
      next_lesson_duration: nextLesson?.lesson_duration || '',
      next_lesson_student_oid: nextLesson?.student_oid || '',
      next_lesson_full_name: nextLesson?.full_name || '',
      next_lesson_activities: nextLesson?.lesson_activities || '',
      
      // 上一堂的所有欄位
      previous_lesson_id: previousLesson?.id || '',
      previous_lesson_student_id: previousLesson?.student_id || '',
      previous_lesson_package_id: previousLesson?.package_id || '',
      previous_lesson_regular_timeslot: previousLesson?.regular_timeslot || '',
      previous_lesson_progress_notes: previousLesson?.progress_notes || '',
      previous_lesson_video_url: previousLesson?.video_url || '',
      previous_lesson_next_target: previousLesson?.next_target || '',
      previous_lesson_remarks: previousLesson?.remarks || '',
      previous_lesson_created_at: previousLesson?.created_at ? new Date(previousLesson.created_at).toLocaleDateString('zh-TW') : '',
      previous_lesson_updated_at: previousLesson?.updated_at ? new Date(previousLesson.updated_at).toLocaleDateString('zh-TW') : '',
      previous_lesson_status_type: previousLesson?.status || '',
      previous_lesson_access_role: previousLesson?.access_role || '',
      previous_lesson_notes: previousLesson?.notes || '',
      previous_lesson_regular_weekday: previousLesson?.regular_weekday || '',
      previous_lesson_duration: previousLesson?.lesson_duration || '',
      previous_lesson_student_oid: previousLesson?.student_oid || '',
      previous_lesson_full_name: previousLesson?.full_name || '',
      previous_lesson_activities: previousLesson?.lesson_activities || '',
      
      // 動態課堂變數
      ...getDynamicLessonData(),
    };
    
    // 除錯：顯示生成的課堂變數
    console.log(`[AI訊息] 學生 ${studentId} 的課堂變數:`, result);
    console.log(`[AI訊息] 學生 ${studentId} 的 next_lesson_weekday:`, result.next_lesson_weekday);
    console.log(`[AI訊息] 學生 ${studentId} 的 next_lesson_date:`, result.next_lesson_date);
    
    return result;
  };

  // 載入模版
  useEffect(() => {
    if (isOpen) {
      console.log('[AI訊息] 開始載入資料，學生數量:', students.length);
      loadTemplates();
      loadStudentLessons();
      setSelectedStudentIds(students.map(s => s.id));
      setShowStudentDetails(Object.fromEntries(students.map(s => [s.id, false])));
      setPreviewStudentIndex(0);
      // 初始化每個學生的自訂訊息
      const initialMessages: Record<string, string> = {};
      students.forEach(student => {
        initialMessages[student.id] = '';
      });
      setCustomMessages(initialMessages);
      // 重置變數展開狀態
      setShowAllVariables(false);
      setShowStudentVariables(false);
      setShowLessonVariables(false);

    }
  }, [isOpen, students]);

  // 載入學生課堂資料
  const loadStudentLessons = async () => {
    if (students.length === 0) {
      console.log('[AI訊息] 沒有學生資料，跳過課堂載入');
      return;
    }
    
    console.log('[AI訊息] 開始載入課堂資料，學生數量:', students.length);
    setLessonsLoading(true);
    try {
      const lessonsData: Record<string, any[]> = {};
      
      for (const student of students) {
        console.log(`[AI訊息] 載入學生 ${student.full_name} (ID: ${student.id}) 的課堂資料`);
        
        // 查詢學生的課堂資料
        let { data, error } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .eq('student_id', student.id)
          .order('lesson_date', { ascending: true });
        
        // 如果是試堂學生且沒有課堂資料，嘗試從試堂學生表查詢
        if ((!data || data.length === 0) && student.student_type === '試堂') {
          console.log(`[AI訊息] 試堂學生 ${student.full_name} 在 hanami_student_lesson 中沒有資料，嘗試從 hanami_trial_students 查詢`);
          
          const { data: trialData, error: trialError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .eq('id', student.id)
            .order('lesson_date', { ascending: true });
          
          if (trialError) {
            console.error(`載入試堂學生 ${student.full_name} 資料失敗:`, trialError);
          } else {
            console.log(`載入試堂學生 ${student.full_name} 資料成功:`, trialData?.length || 0, '筆');
            // 將試堂學生資料轉換為課堂格式
            data = trialData?.map(trial => {
              console.log(`[AI訊息] 試堂學生資料轉換:`, trial);
              return {
                id: trial.id,
                student_id: trial.id,
                lesson_date: trial.lesson_date || '',
                actual_timeslot: trial.actual_timeslot,
                course_type: trial.course_type,
                lesson_teacher: trial.student_teacher,
                lesson_status: trial.trial_status,
                lesson_activities: '',
                progress_notes: '',
                next_target: '',
                notes: '',
                remarks: trial.trial_remarks,
                video_url: '',
                package_id: null,
                lesson_duration: trial.lesson_duration || '',
                student_oid: trial.student_oid || '',
                regular_timeslot: trial.regular_timeslot,
                regular_weekday: trial.regular_weekday,
                full_name: trial.full_name,
                status: trial.trial_status,
                access_role: trial.access_role,
                created_at: trial.created_at || '',
                updated_at: trial.updated_at
              };
            }) || [];
            console.log(`[AI訊息] 轉換後的課堂資料:`, data);
            error = null;
          }
        }
        
        if (error) {
          console.error(`載入學生 ${student.full_name} 課堂資料失敗:`, error);
          lessonsData[student.id] = [];
        } else {
          lessonsData[student.id] = data || [];
          console.log(`載入學生 ${student.full_name} 課堂資料成功:`, data?.length || 0, '堂');
          if (data && data.length > 0) {
            console.log('課堂資料範例:', data[0]);
          }
        }
      }
      
      console.log('[AI訊息] 所有課堂資料載入完成:', lessonsData);
      setStudentLessons(lessonsData);
    } catch (error) {
      console.error('載入課堂資料失敗:', error);
    } finally {
      setLessonsLoading(false);
    }
  };

  // 載入範本函數
  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('hanami_ai_message_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');
    
    if (error) {
      console.error('載入模版失敗:', error);
    } else {
      console.log('載入的模版:', data);
      setTemplates(data || []);
    }
  };

  // 切換學生選取
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(ids =>
      ids.includes(id) ? ids.filter(sid => sid !== id) : [...ids, id]
    );
  };

  // 當選擇範本時，自動填入範本內容到所有選中的學生
  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    // 為所有選中的學生填入範本內容
    const updatedMessages = { ...customMessages };
    selectedStudentIds.forEach(studentId => {
      updatedMessages[studentId] = template.template_content;
    });
    setCustomMessages(updatedMessages);
  };

  // 切換學生詳細資料展開
  const toggleStudentDetails = (id: string) => {
    setShowStudentDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 產生訊息內容，支援所有欄位與格式化與多組別名與動態 key map
  // 提取模板中使用的變數
  const extractUsedVariables = (template: string) => {
    const usedVars = new Set<string>();
    
    // 匹配 {variable} 和 {{variable}} 格式
    const regex = /\{\{?\s*([^}\s]+)\s*\}\}?/g;
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      usedVars.add(match[1]);
    }
    
    return Array.from(usedVars);
  };

  // 獲取學生變數（只處理需要的變數）
  const getStudentVariables = (student: any, usedVars: string[]) => {
    const keyMap: Record<string, any> = {};
    Object.keys(student).forEach(k => {
      const stdKey = k.toLowerCase().replace(/[_\s]/g, '');
      keyMap[stdKey] = student[k];
    });

    const result: Record<string, string> = {};
    
    // 只處理模板中使用的系統變數
    systemVariables.forEach(v => {
      if (!usedVars.includes(v.key)) return;
      
      const stdKey = v.key.toLowerCase().replace(/[_\s]/g, '');
      let rawValue = keyMap[stdKey];
      let value = '';
      
      // 特殊欄位格式化
      if (stdKey === 'studentage') {
        value = rawValue ? `${Math.floor(Number(rawValue) / 12)} 歲` : '';
      } else if ([
        'studentdob', 'lessondate', 'starteddate'
      ].includes(stdKey)) {
        value = rawValue ? new Date(rawValue).toLocaleDateString('zh-TW') : '';
      } else if (stdKey === 'gender') {
        value = rawValue === 'female' ? '女' : rawValue === 'male' ? '男' : '';
      } else if (stdKey === 'custommessage') {
        const currentStudentId = selectedStudentIds[previewStudentIndex];
        value = customMessages[currentStudentId] || '';
      } else if (stdKey === 'durationmonths') {
        value = rawValue ? `${rawValue}個月` : '';
      } else if ([
        'remaininglessons', 'ongoinglessons', 'upcominglessons'
      ].includes(stdKey)) {
        value = rawValue !== undefined && rawValue !== null ? `${rawValue}堂` : '';
      } else if ([
        'lessonduration', 'actualtimeslot', 'regulartimeslot'
      ].includes(stdKey)) {
        value = rawValue ? String(rawValue) : '';
      } else {
        value = rawValue ?? '';
      }
      
      result[v.key] = value;
    });
    
    return result;
  };

  // 獲取課堂變數（只處理需要的變數）
  const getLessonVariablesForTemplate = (studentId: string, usedVars: string[]) => {
    const cacheKeyStr = `${studentId}_${usedVars.sort().join('_')}_${cacheKey}`;
    
    if (variablesCache[cacheKeyStr]) {
      return variablesCache[cacheKeyStr];
    }
    
    const allLessonVars = getLessonVariables(studentId);
    const result: Record<string, string> = {};
    
    // 只處理模板中使用的課堂變數
    usedVars.forEach(varName => {
      if (varName.startsWith('selected_content')) {
        // 處理選中課堂內容
        if (selectedLesson && selectedLesson.lessons && selectedLesson.lessons.length > 0) {
          console.log('[AI訊息] 處理選中課堂變數:', varName, selectedLesson);
          
          let content = '';
          
          // 格式化單個課堂的函數
          const formatLesson = (lesson: any, type: string) => {
            const parts: string[] = [];
            
            switch (type) {
              case 'full':
                if (lesson.course_type) parts.push(`🎼 ${lesson.course_type}`);
                if (lesson.lesson_date) {
                  const date = new Date(lesson.lesson_date);
                  const dateStr = date.toLocaleDateString('zh-TW');
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekday = weekdays[date.getDay()];
                  parts.push(`📆 ${dateStr} (星期${weekday})`);
                }
                if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                if (lesson.lesson_teacher) parts.push(`👨‍🏫 老師：${lesson.lesson_teacher}`);
                if (lesson.lesson_status) parts.push(`✅ 出席：${lesson.lesson_status}`);
                break;
                
              case 'basic':
                if (lesson.course_type) parts.push(`🎼 ${lesson.course_type}`);
                if (lesson.lesson_date) {
                  const date = new Date(lesson.lesson_date);
                  const dateStr = date.toLocaleDateString('zh-TW');
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekday = weekdays[date.getDay()];
                  parts.push(`📆 ${dateStr} (星期${weekday})`);
                }
                if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                break;
                
              case 'date':
                if (lesson.course_type) parts.push(`🎼 ${lesson.course_type}`);
                if (lesson.lesson_date) {
                  const date = new Date(lesson.lesson_date);
                  const dateStr = date.toLocaleDateString('zh-TW');
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekday = weekdays[date.getDay()];
                  parts.push(`📆 ${dateStr} (星期${weekday})`);
                }
                break;
                
              case 'teacher':
                if (lesson.course_type) parts.push(`🎼 ${lesson.course_type}`);
                if (lesson.lesson_date) {
                  const date = new Date(lesson.lesson_date);
                  const dateStr = date.toLocaleDateString('zh-TW');
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekday = weekdays[date.getDay()];
                  parts.push(`📆 ${dateStr} (星期${weekday})`);
                }
                if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                if (lesson.lesson_teacher) parts.push(`👨‍🏫 老師：${lesson.lesson_teacher}`);
                break;
                
              case 'status':
                if (lesson.course_type) parts.push(`🎼 ${lesson.course_type}`);
                if (lesson.lesson_date) {
                  const date = new Date(lesson.lesson_date);
                  const dateStr = date.toLocaleDateString('zh-TW');
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekday = weekdays[date.getDay()];
                  parts.push(`📆 ${dateStr} (星期${weekday})`);
                }
                if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                if (lesson.lesson_status) parts.push(`✅ 出席：${lesson.lesson_status}`);
                break;
            }
            
            return parts.join('\n');
          };
          
          switch (varName) {
            case 'selected_content':
              // 完整內容：所有選中課堂的完整資訊
              if (selectedLesson.count > 1) {
                // 檢查是否所有課堂都是相同課程類型
                const allSameCourseType = selectedLesson.lessons.every(lesson => 
                  lesson.course_type === selectedLesson.lessons[0].course_type
                );
                
                if (allSameCourseType) {
                  // 相同課程類型，只顯示一次課程類型
                  const courseType = selectedLesson.lessons[0].course_type;
                  const lessonDetails = selectedLesson.lessons.map((lesson, index) => {
                    const parts: string[] = [];
                    if (lesson.lesson_date) {
                      const date = new Date(lesson.lesson_date);
                      const dateStr = date.toLocaleDateString('zh-TW');
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      const weekday = weekdays[date.getDay()];
                      parts.push(`📆 ${dateStr} (星期${weekday})`);
                    }
                    if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                    if (lesson.lesson_teacher) parts.push(`👨‍🏫 老師：${lesson.lesson_teacher}`);
                    if (lesson.lesson_status) parts.push(`✅ 出席：${lesson.lesson_status}`);
                    return `【第${index + 1}堂】\n${parts.join('\n')}`;
                  });
                  content = `🎼 ${courseType}\n\n${lessonDetails.join('\n\n')}`;
                } else {
                  // 不同課程類型，顯示完整資訊
                  const fullContents = selectedLesson.lessons.map((lesson, index) => {
                    const lessonContent = formatLesson(lesson, 'full');
                    return `【第${index + 1}堂】\n${lessonContent}`;
                  });
                  content = fullContents.join('\n\n');
                }
              } else {
                // 單一堂課，使用原有格式
                content = formatLesson(selectedLesson.lessons[0], 'full');
              }
              break;
              
            case 'selected_content_basic':
              // 基本內容：所有選中課堂的基本資訊
              if (selectedLesson.count > 1) {
                // 檢查是否所有課堂都是相同課程類型
                const allSameCourseType = selectedLesson.lessons.every(lesson => 
                  lesson.course_type === selectedLesson.lessons[0].course_type
                );
                
                if (allSameCourseType) {
                  // 相同課程類型，只顯示一次課程類型
                  const courseType = selectedLesson.lessons[0].course_type;
                  const lessonDetails = selectedLesson.lessons.map((lesson, index) => {
                    const parts: string[] = [];
                    if (lesson.lesson_date) {
                      const date = new Date(lesson.lesson_date);
                      const dateStr = date.toLocaleDateString('zh-TW');
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      const weekday = weekdays[date.getDay()];
                      parts.push(`📆 ${dateStr} (星期${weekday})`);
                    }
                    if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                    return `【第${index + 1}堂】\n${parts.join('\n')}`;
                  });
                  content = `🎼 ${courseType}\n\n${lessonDetails.join('\n\n')}`;
                } else {
                  // 不同課程類型，顯示完整資訊
                  const basicContents = selectedLesson.lessons.map((lesson, index) => {
                    const lessonContent = formatLesson(lesson, 'basic');
                    return `【第${index + 1}堂】\n${lessonContent}`;
                  });
                  content = basicContents.join('\n\n');
                }
              } else {
                // 單一堂課，使用原有格式
                content = formatLesson(selectedLesson.lessons[0], 'basic');
              }
              break;
              
            case 'selected_content_date':
              // 日期內容：所有選中課堂的日期資訊
              if (selectedLesson.count > 1) {
                // 檢查是否所有課堂都是相同課程類型
                const allSameCourseType = selectedLesson.lessons.every(lesson => 
                  lesson.course_type === selectedLesson.lessons[0].course_type
                );
                
                if (allSameCourseType) {
                  // 相同課程類型，只顯示一次課程類型
                  const courseType = selectedLesson.lessons[0].course_type;
                  const lessonDetails = selectedLesson.lessons.map((lesson, index) => {
                    if (lesson.lesson_date) {
                      const date = new Date(lesson.lesson_date);
                      const dateStr = date.toLocaleDateString('zh-TW');
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      const weekday = weekdays[date.getDay()];
                      return `【第${index + 1}堂】\n📆 ${dateStr} (星期${weekday})`;
                    }
                    return `【第${index + 1}堂】`;
                  });
                  content = `🎼 ${courseType}\n\n${lessonDetails.join('\n\n')}`;
                } else {
                  // 不同課程類型，顯示完整資訊
                  const dateContents = selectedLesson.lessons.map((lesson, index) => {
                    const lessonContent = formatLesson(lesson, 'date');
                    return `【第${index + 1}堂】\n${lessonContent}`;
                  });
                  content = dateContents.join('\n\n');
                }
              } else {
                // 單一堂課，使用原有格式
                content = formatLesson(selectedLesson.lessons[0], 'date');
              }
              break;
              
            case 'selected_content_teacher':
              // 老師內容：所有選中課堂的老師資訊
              if (selectedLesson.count > 1) {
                // 檢查是否所有課堂都是相同課程類型
                const allSameCourseType = selectedLesson.lessons.every(lesson => 
                  lesson.course_type === selectedLesson.lessons[0].course_type
                );
                
                if (allSameCourseType) {
                  // 相同課程類型，只顯示一次課程類型
                  const courseType = selectedLesson.lessons[0].course_type;
                  const lessonDetails = selectedLesson.lessons.map((lesson, index) => {
                    const parts: string[] = [];
                    if (lesson.lesson_date) {
                      const date = new Date(lesson.lesson_date);
                      const dateStr = date.toLocaleDateString('zh-TW');
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      const weekday = weekdays[date.getDay()];
                      parts.push(`📆 ${dateStr} (星期${weekday})`);
                    }
                    if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                    if (lesson.lesson_teacher) parts.push(`👨‍🏫 老師：${lesson.lesson_teacher}`);
                    return `【第${index + 1}堂】\n${parts.join('\n')}`;
                  });
                  content = `🎼 ${courseType}\n\n${lessonDetails.join('\n\n')}`;
                } else {
                  // 不同課程類型，顯示完整資訊
                  const teacherContents = selectedLesson.lessons.map((lesson, index) => {
                    const lessonContent = formatLesson(lesson, 'teacher');
                    return `【第${index + 1}堂】\n${lessonContent}`;
                  });
                  content = teacherContents.join('\n\n');
                }
              } else {
                // 單一堂課，使用原有格式
                content = formatLesson(selectedLesson.lessons[0], 'teacher');
              }
              break;
              
            case 'selected_content_status':
              // 出席內容：所有選中課堂的出席資訊
              if (selectedLesson.count > 1) {
                // 檢查是否所有課堂都是相同課程類型
                const allSameCourseType = selectedLesson.lessons.every(lesson => 
                  lesson.course_type === selectedLesson.lessons[0].course_type
                );
                
                if (allSameCourseType) {
                  // 相同課程類型，只顯示一次課程類型
                  const courseType = selectedLesson.lessons[0].course_type;
                  const lessonDetails = selectedLesson.lessons.map((lesson, index) => {
                    const parts: string[] = [];
                    if (lesson.lesson_date) {
                      const date = new Date(lesson.lesson_date);
                      const dateStr = date.toLocaleDateString('zh-TW');
                      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      const weekday = weekdays[date.getDay()];
                      parts.push(`📆 ${dateStr} (星期${weekday})`);
                    }
                    if (lesson.actual_timeslot) parts.push(`⏰ ${lesson.actual_timeslot}`);
                    if (lesson.lesson_status) parts.push(`✅ 出席：${lesson.lesson_status}`);
                    return `【第${index + 1}堂】\n${parts.join('\n')}`;
                  });
                  content = `🎼 ${courseType}\n\n${lessonDetails.join('\n\n')}`;
                } else {
                  // 不同課程類型，顯示完整資訊
                  const statusContents = selectedLesson.lessons.map((lesson, index) => {
                    const lessonContent = formatLesson(lesson, 'status');
                    return `【第${index + 1}堂】\n${lessonContent}`;
                  });
                  content = statusContents.join('\n\n');
                }
              } else {
                // 單一堂課，使用原有格式
                content = formatLesson(selectedLesson.lessons[0], 'status');
              }
              break;
          }
          
          console.log('[AI訊息] 生成的選中課堂內容:', varName, content);
          result[varName] = content;
        } else {
          console.log('[AI訊息] 沒有選中的課堂資料');
          result[varName] = '';
        }
      } else if ((allLessonVars as any)[varName] !== undefined) {
        result[varName] = (allLessonVars as any)[varName];
      }
    });
    
    // 快取結果
    setVariablesCache(prev => ({
      ...prev,
      [cacheKeyStr]: result
    }));
    
    return result;
  };

  const generateMessage = (template: string, student: any) => {
    if (!template || !student) return '請選擇模版與學生';
    let msg = template;
    
    // 提取模板中使用的變數
    const usedVars = extractUsedVariables(template);
    
    // 只處理需要的變數
    const studentVars = getStudentVariables(student, usedVars);
    const lessonVars = getLessonVariablesForTemplate(student.id, usedVars);
    
    // 合併所有變數
    const allVars = { ...studentVars, ...lessonVars };
    
    // 替換變數
    Object.keys(allVars).forEach(key => {
      const value = allVars[key] || '';
      // 支援 {key}、{{key}}，允許前後空白
      const regex1 = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      const regex2 = new RegExp(`{\\s*${key}\\s*}`, 'gi');
      msg = msg.replace(regex1, value);
      msg = msg.replace(regex2, value);
    });
    
    return msg;
  };

  // 獲取當前預覽學生的自訂訊息
  const getCurrentStudentMessage = () => {
    const currentStudentId = selectedStudentIds[previewStudentIndex];
    return customMessages[currentStudentId] || '';
  };

  // 更新當前預覽學生的自訂訊息
  const updateCurrentStudentMessage = (message: string) => {
    const currentStudentId = selectedStudentIds[previewStudentIndex];
    setCustomMessages(prev => ({
      ...prev,
      [currentStudentId]: message
    }));
  };

  // 刷新變數快取
  const refreshVariables = () => {
    setCacheKey(prev => prev + 1);
    setVariablesCache({});
    toast.success('變數已刷新');
  };

  // 顯示確認對話框
  const handleSendClick = () => {
    if (!selectedTemplate) return;
    setShowConfirmDialog(true);
  };

  // 確認發送訊息
  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setSendProgress(0);
    setErrorMessage('');
    let hasError = false;
    
    // 檢查是否有可發送的內容
    const hasContent = selectedTemplate || selectedStudentIds.some(id => customMessages[id]);
    if (!hasContent) {
      setErrorMessage('請先選擇範本或輸入自訂訊息');
      setIsSending(false);
      return;
    }
    
    for (let i = 0; i < selectedStudentIds.length; i++) {
      const student = students.find(s => s.id === selectedStudentIds[i]);
      if (!student) continue;
      
      // 優先使用該學生的自訂訊息，如果沒有則使用範本內容
      let messageContent: string;
      if (customMessages[student.id]) {
        messageContent = generateMessage(customMessages[student.id], student);
      } else if (selectedTemplate) {
        messageContent = generateMessage(selectedTemplate.template_content, student);
      } else {
        continue; // 跳過沒有內容的學生
      }
      
      try {
        const res = await fetch('/api/ai-message/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            studentName: student.full_name,
            studentPhone: student.contact_number,
            templateId: selectedTemplate?.id || null,
            templateName: selectedTemplate?.template_name || '自訂訊息',
            messageContent,
          }),
        });
        if (res.ok) {
          toast.success(`已成功發送給 ${student.full_name}`);
        } else {
          hasError = true;
          toast.error(`發送給 ${student.full_name} 失敗`);
        }
      } catch (e) {
        hasError = true;
        toast.error(`發送給 ${student.full_name} 失敗`);
      }
      setSendProgress(i + 1);
    }
    setIsSending(false);
    if (hasError) {
      toast.error('部分或全部訊息發送失敗，請檢查網路或稍後再試！');
    } else {
      toast.success('所有訊息已成功發送！');
    }
  };

  // 在組件內部新增複製功能
  const handleCopyMessage = () => {
    if (!previewStudent) return;
    
    let text: string;
    if (getCurrentStudentMessage()) {
      text = generateMessage(getCurrentStudentMessage(), previewStudent);
    } else if (selectedTemplate) {
      text = generateMessage(selectedTemplate.template_content, previewStudent);
    } else {
      toast.error('沒有可複製的訊息內容');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('訊息已複製到剪貼簿');
    }, () => {
      toast.error('複製失敗');
    });
  };

  // 範本管理功能
  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name || !newTemplate.template_content) return;
    
    const { data, error } = await supabase
      .from('hanami_ai_message_templates')
      .insert([{
        ...newTemplate,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('創建範本失敗:', error);
      return;
    }
    
    setTemplates(prev => [...prev, data]);
    setNewTemplate({
      template_name: '',
      template_content: '',
      template_type: 'general'
    });
    setShowTemplateManager(false);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    const { error } = await supabase
      .from('hanami_ai_message_templates')
      .update({
        template_name: editingTemplate.template_name,
        template_content: editingTemplate.template_content,
        template_type: editingTemplate.template_type
      })
      .eq('id', editingTemplate.id);
    
    if (error) {
      console.error('更新範本失敗:', error);
      return;
    }
    
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    // 獲取範本名稱用於確認對話框
    const template = templates.find(t => t.id === templateId);
    const templateName = template?.template_name || '此範本';
    
    // 顯示確認對話框
    if (!confirm(`確定要刪除範本「${templateName}」嗎？\n\n如果此範本已被使用過，將會被停用而不是刪除，以保留歷史記錄。`)) {
      return;
    }
    
    // 檢查是否有相關的訊息記錄
    const { data: messageLogs, error: checkError } = await supabase
      .from('hanami_ai_message_logs')
      .select('id')
      .eq('template_id', templateId)
      .limit(1);
    
    if (checkError) {
      console.error('檢查範本使用情況失敗:', checkError);
      toast.error('檢查範本使用情況失敗');
      return;
    }
    
    if (messageLogs && messageLogs.length > 0) {
      // 有相關記錄，使用軟刪除
      const { error: softDeleteError } = await supabase
        .from('hanami_ai_message_templates')
        .update({ is_active: false })
        .eq('id', templateId);
      
      if (softDeleteError) {
        console.error('軟刪除範本失敗:', softDeleteError);
        toast.error('刪除範本失敗');
        return;
      }
      
      toast.success(`範本「${templateName}」已停用（有相關訊息記錄）`);
    } else {
      // 沒有相關記錄，可以安全刪除
      const { error: deleteError } = await supabase
        .from('hanami_ai_message_templates')
        .delete()
        .eq('id', templateId);
      
      if (deleteError) {
        console.error('刪除範本失敗:', deleteError);
        toast.error('刪除範本失敗');
        return;
      }
      
      toast.success(`範本「${templateName}」刪除成功`);
    }
    
    // 重新載入範本列表
    await loadTemplates();
    
    // 如果當前選中的範本被刪除，清空選擇
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
  };

  if (!isOpen) return null;

  // 響應式：手機分頁切換，桌面同時顯示
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const previewStudentId = selectedStudentIds[previewStudentIndex] || students[0]?.id;
  const previewStudent = students.find(s => s.id === previewStudentId);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col border-2 border-[#EADBC8]/50 overflow-hidden">
          {/* 分頁切換（手機） */}
          <div className="sm:hidden flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-b-2 border-[#EADBC8]/30">
            <button className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 ${mobileTab==='students' ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] scale-105 shadow-md' : 'bg-white/80 text-[#4B4036]'}`} onClick={() => setMobileTab('students')}>學生</button>
            <button className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 ${mobileTab==='templates' ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] scale-105 shadow-md' : 'bg-white/80 text-[#4B4036]'}`} onClick={() => setMobileTab('templates')}>模版</button>
          </div>
          {/* 標題欄 */}
          <div className="hidden sm:flex items-center justify-between p-6 border-b-2 border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                <MessageSquare className="w-4 h-4 text-[#4B4036]" />
              </div>
              <h2 className="text-xl font-bold text-[#2B3A3B]">AI 訊息發送</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:rotate-12"><X className="w-5 h-5 text-[#4B4036]" /></button>
          </div>
          {/* 手機版標題欄（含關閉） */}
          <div className="sm:hidden flex items-center justify-between p-4 border-b-2 border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                <MessageSquare className="w-4 h-4 text-[#4B4036]" />
              </div>
              <h2 className="text-lg font-bold text-[#2B3A3B]">AI 訊息發送</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:rotate-12"><X className="w-5 h-5 text-[#4B4036]" /></button>
          </div>
          {/* 內容區域 */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-y-auto">
            {/* 學生區塊 */}
            <div className={`w-full sm:w-1/2 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFFDF8]/80 border-b-2 sm:border-b-0 sm:border-r-2 border-[#EADBC8]/30 transition-all duration-300 flex flex-col ${mobileTab==='students' ? '' : 'hidden sm:flex'}`}>
              <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setShowStudents(v => !v)}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center"><span className="text-xs font-bold text-[#4B4036]">{selectedStudentIds.length}</span></div>
                  <h3 className="font-bold text-[#2B3A3B] text-sm">已選學生</h3>
                </div>
                <button className="p-2" title={showStudents ? '收起' : '展開'}>{showStudents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
              </div>
              <div className={`transition-all duration-300 flex-1 ${showStudents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'}`}>
                <div className="flex flex-col gap-3 px-4 pb-4 overflow-y-auto h-full">
                  {students.filter(s => selectedStudentIds.includes(s.id)).map((student, idx) => (
                    <div key={student.id} className={`bg-white/90 rounded-2xl border-2 transition-all duration-300 ${previewStudentId===student.id ? 'border-[#FFD59A] shadow-lg' : 'border-[#EADBC8]/50'}`}>
                      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setPreviewStudentIndex(selectedStudentIds.indexOf(student.id))}>
                        <div>
                          <div className="font-bold text-[#2B3A3B] text-sm">{student.full_name}</div>
                          <div className="text-xs text-[#4B4036] opacity-75">{student.contact_number}</div>
                          <div className="text-xs text-[#4B4036] opacity-75">{student.course_type}</div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button className="p-1.5 rounded-full bg-[#FFD59A] text-[#2B3A3B] hover:scale-110" onClick={e => { e.stopPropagation(); toggleStudent(student.id); }} title="取消選取"><UserX className="w-3 h-3" /></button>
                          <button className="p-1.5 text-[#4B4036] hover:bg-[#EADBC8] rounded-full hover:scale-110" onClick={e => { e.stopPropagation(); toggleStudentDetails(student.id); }} title="展開/收起詳細資料">{showStudentDetails[student.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                        </div>
                      </div>
                      {showStudentDetails[student.id] && (
                        <div className="px-3 pb-3 border-t-2 border-[#EADBC8]/30 bg-gradient-to-br from-[#FFFDF8]/80 to-[#FFF9F2]/80 text-xs">
                          <div>年齡：{student.student_age ? `${Math.floor(Number(student.student_age) / 12)} 歲` : '—'}</div>
                          <div>性別：{student.gender === 'female' ? '女' : student.gender === 'male' ? '男' : '—'}</div>
                          <div>學校：{student.school || '—'}</div>
                          <div>老師：{student.student_teacher || '—'}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedStudentIds.length === 0 && <div className="text-[#4B4036] opacity-60 text-sm">請選擇學生</div>}
                </div>
              </div>
            </div>
            {/* 模版區塊 */}
            <div className={`w-full sm:w-1/2 flex flex-col overflow-y-auto ${mobileTab==='templates' ? '' : 'hidden sm:flex'}`}>
              <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setShowTemplates(v => !v)}>
                <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-[#4B4036]" /><h3 className="font-bold text-[#2B3A3B] text-sm">選擇模版</h3></div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] hover:scale-110 transition-all duration-300 shadow-md" 
                    onClick={(e) => { e.stopPropagation(); setShowTemplateManager(true); }}
                    title="管理範本"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="p-2" title={showTemplates ? '收起' : '展開'}>{showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className={`transition-all duration-300 flex-1 ${showTemplates ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'}`}>
                <div className="flex flex-col gap-3 px-4 pb-4 overflow-y-auto h-full">
                  {templates.map(template => (
                    <div key={template.id} className={`bg-white/90 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedTemplate?.id===template.id ? 'border-[#FFD59A] shadow-lg' : 'border-[#EADBC8]/50'}`} onClick={() => handleTemplateSelect(template)}>
                      <div className="p-4">
                        <div className="font-bold text-[#2B3A3B] text-sm">{template.template_name}</div>
                        <div className="text-xs text-[#4B4036] opacity-75 mt-1">{template.template_type}</div>
                        <div className="text-xs text-[#4B4036] opacity-60 mt-2 line-clamp-2">{template.template_content}</div>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && <div className="text-[#4B4036] opacity-60 text-sm">尚無可用模版</div>}
                </div>
              </div>
              {/* 訊息預覽與發送 */}
              <div className="p-4 border-t-2 border-[#EADBC8]/30 bg-gradient-to-br from-[#FFF9F2]/50 to-[#FFFDF8]/50 flex flex-col gap-3 flex-shrink-0">
                <div className="mb-2">
                  <span className="text-xs font-bold text-[#4B4036]">預覽學生：</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selectedStudentIds.map((id, idx) => {
                      const stu = students.find(s => s.id === id);
                      if (!stu) return null;
                      return (
                        <button key={id} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-300 hover:scale-105 ${idx===previewStudentIndex ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] border-[#FFD59A]' : 'bg-white/80 text-[#4B4036] border-[#EADBC8]/50'}`} onClick={() => setPreviewStudentIndex(idx)}>{stu.full_name}</button>
                      );
                    })}
                  </div>
                </div>
                {/* 自訂訊息欄位 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#4B4036]">自訂訊息內容：</label>
                      <button 
                        onClick={refreshVariables}
                        className="p-1 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] hover:scale-110 transition-all duration-300 shadow-sm"
                        title="刷新變數"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="p-1 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] text-[#2B3A3B] hover:scale-110 transition-all duration-300 shadow-sm"
                        title="調試選中課堂"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs text-[#4B4036] opacity-75">{previewStudent?.full_name}</span>
                  </div>
                  <textarea 
                    className="w-full p-3 border-2 border-[#EADBC8]/50 rounded-xl resize-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] text-sm bg-white/90 backdrop-blur-sm transition-all duration-300" 
                    rows={4} 
                    placeholder="自訂訊息內容（可選）" 
                    value={getCurrentStudentMessage()} 
                    onChange={e => updateCurrentStudentMessage(e.target.value)} 
                  />
                  
                  {/* 調試信息 */}
                  {showDebug && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-xs">
                      <div className="font-bold text-yellow-800 mb-2">調試信息：</div>
                      <div className="space-y-1 text-yellow-700">
                        <div>選中課堂資料：{selectedLesson ? '有' : '無'}</div>
                        {selectedLesson && (
                          <>
                            <div>課堂數量：{selectedLesson.count || 0}</div>
                            {selectedLesson.lessons && selectedLesson.lessons.map((lesson, index) => (
                              <div key={index} className="border-t border-yellow-200 pt-2 mt-2">
                                <div className="font-semibold">第{index + 1}堂：</div>
                                <div>課程類型：{lesson.course_type || '無'}</div>
                                <div>課堂日期：{lesson.lesson_date || '無'}</div>
                                <div>上課時間：{lesson.actual_timeslot || '無'}</div>
                                <div>負責老師：{lesson.lesson_teacher || '無'}</div>
                                <div>出席狀況：{lesson.lesson_status || '無'}</div>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="mt-2">
                          <div className="font-bold">可用的選中課堂變數：</div>
                          <div className="grid grid-cols-1 gap-1 mt-1">
                            <div className="font-mono text-yellow-600">{'{selected_content}'} - 完整內容</div>
                            <div className="font-mono text-yellow-600">{'{selected_content_basic}'} - 基本內容（課程+日期+時間）</div>
                            <div className="font-mono text-yellow-600">{'{selected_content_date}'} - 日期內容（課程+日期）</div>
                            <div className="font-mono text-yellow-600">{'{selected_content_teacher}'} - 老師內容（課程+日期+時間+老師）</div>
                            <div className="font-mono text-yellow-600">{'{selected_content_status}'} - 出席內容（課程+日期+時間+出席）</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* 訊息預覽 */}
                <div className="bg-white/90 p-4 rounded-2xl border-2 border-[#EADBC8]/50 min-h-[80px] max-h-[160px] overflow-y-auto mb-2 shadow-inner text-[#4B4036] text-sm whitespace-pre-wrap">
                  {previewStudent ? (
                    getCurrentStudentMessage() ? 
                      generateMessage(getCurrentStudentMessage(), previewStudent) : 
                      selectedTemplate ? 
                        generateMessage(selectedTemplate.template_content, previewStudent) : 
                        '請輸入自訂訊息內容或選擇模版'
                  ) : '請選擇學生'}
                </div>
                {/* 發送按鈕 */}
                <div className="flex items-center gap-2 w-full">
                  <button onClick={handleCopyMessage} className="p-3 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md hover:scale-110 transition-all duration-300" title="複製目前學生訊息">
                    <Copy className="w-5 h-5" />
                  </button>
                  <button onClick={handleSendClick} disabled={selectedStudentIds.length===0 || isSending || (!selectedTemplate && !getCurrentStudentMessage())} className="flex-1 py-3 px-6 rounded-full font-bold text-base transition-all duration-300 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                    {isSending ? (<><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4B4036]"></span>發送中...</>) : (<><Send className="w-5 h-5" />發送訊息給 {selectedStudentIds.length} 位學生</>)}
                  </button>
                </div>
                {isSending && <div className="text-xs text-[#4B4036] mt-2">發送進度：{sendProgress}/{selectedStudentIds.length}</div>}
                {errorMessage && <div className="text-xs text-red-500 mt-2">{errorMessage}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 範本管理模態框 */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-[#EADBC8]/50">
            {/* 標題欄 */}
            <div className="flex items-center justify-between p-6 border-b-2 border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                  <Settings className="w-4 h-4 text-[#4B4036]" />
                </div>
                <h2 className="text-xl font-bold text-[#2B3A3B]">範本管理</h2>
              </div>
              <button onClick={() => setShowTemplateManager(false)} className="p-2 hover:rotate-12"><X className="w-5 h-5 text-[#4B4036]" /></button>
            </div>
            
            {/* 內容區域 */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* 範本列表 */}
              <div className="w-full lg:w-1/2 p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#EADBC8]/30 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2B3A3B]">現有範本</h3>
                  <button 
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-full font-bold text-sm hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    新增範本
                  </button>
                </div>
                
                <div className="space-y-3">
                  {templates.map(template => (
                    <div key={template.id} className="bg-white/90 rounded-2xl border-2 border-[#EADBC8]/50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-[#2B3A3B] text-sm">{template.template_name}</div>
                          <div className="text-xs text-[#4B4036] opacity-75 mt-1">{template.template_type}</div>
                          <div className="text-xs text-[#4B4036] opacity-60 mt-2 line-clamp-2">{template.template_content}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button 
                            onClick={() => setEditingTemplate(template)}
                            className="p-2 rounded-full bg-[#FFD59A] text-[#2B3A3B] hover:scale-110 transition-all duration-300"
                            title="編輯"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:scale-110 transition-all duration-300"
                            title="刪除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 編輯區域 */}
              <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
                <h3 className="font-bold text-[#2B3A3B] mb-4">
                  {editingTemplate ? '編輯範本' : '新增範本'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#2B3A3B] mb-2">範本名稱</label>
                    <input
                      type="text"
                      value={editingTemplate ? editingTemplate.template_name : newTemplate.template_name}
                      onChange={(e) => {
                        if (editingTemplate) {
                          setEditingTemplate(prev => prev ? { ...prev, template_name: e.target.value } : null);
                        } else {
                          setNewTemplate(prev => ({ ...prev, template_name: e.target.value }));
                        }
                      }}
                      className="w-full p-3 border-2 border-[#EADBC8]/50 rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] text-sm bg-white/90"
                      placeholder="輸入範本名稱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#2B3A3B] mb-2">範本類型</label>
                    <select
                      value={editingTemplate ? editingTemplate.template_type : newTemplate.template_type}
                      onChange={(e) => {
                        if (editingTemplate) {
                          setEditingTemplate(prev => prev ? { ...prev, template_type: e.target.value } : null);
                        } else {
                          setNewTemplate(prev => ({ ...prev, template_type: e.target.value }));
                        }
                      }}
                      className="w-full p-3 border-2 border-[#EADBC8]/50 rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] text-sm bg-white/90"
                    >
                      <option value="general">一般通知</option>
                      <option value="reminder">課程提醒</option>
                      <option value="welcome">歡迎訊息</option>
                      <option value="progress">進度報告</option>
                      <option value="custom">自訂</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#4B4036] mb-2">範本內容</label>
                    <textarea
                      value={editingTemplate ? editingTemplate.template_content : newTemplate.template_content}
                      onChange={(e) => {
                        if (editingTemplate) {
                          setEditingTemplate(prev => prev ? { ...prev, template_content: e.target.value } : null);
                        } else {
                          setNewTemplate(prev => ({ ...prev, template_content: e.target.value }));
                        }
                      }}
                      rows={8}
                      className="w-full p-3 border-2 border-[#EADBC8]/50 rounded-xl resize-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] text-sm bg-white/90"
                      placeholder="輸入範本內容，可使用變數如 {full_name}、{contact_number} 等"
                    />
                  </div>
                  
                  {/* 可用變數提示 */}
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-2xl border-2 border-[#EADBC8]/30 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#2B3A3B] text-sm">可用變數</h4>
                      <button 
                        onClick={() => setShowAllVariables(!showAllVariables)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD59A] text-[#2B3A3B] text-xs font-bold hover:scale-105 transition-all duration-300"
                      >
                        {showAllVariables ? '收起' : '展開'}
                        {showAllVariables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    {showAllVariables && (
                      <>
                        {/* 學生基本資料變數 */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-[#2B3A3B] text-xs">學生基本資料</h5>
                            <button 
                              onClick={() => setShowStudentVariables(!showStudentVariables)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD59A] text-[#2B3A3B] text-xs font-bold hover:scale-105 transition-all duration-300"
                            >
                              {showStudentVariables ? '收起' : '展開'}
                              {showStudentVariables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                          {showStudentVariables && (
                            <div className="grid grid-cols-1 gap-1 text-xs max-h-32 overflow-y-auto">
                              {systemVariables.map(v => (
                                <div key={v.key} className="text-[#4B4036] opacity-75 py-0.5">
                                  <span className="font-mono text-[#2B3A3B]">{`{${v.key}}`}</span> - {v.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* 課堂相關變數 */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-[#2B3A3B] text-xs">課堂相關變數</h5>
                            <button 
                              onClick={() => setShowLessonVariables(!showLessonVariables)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD59A] text-[#2B3A3B] text-xs font-bold hover:scale-105 transition-all duration-300"
                            >
                              {showLessonVariables ? '收起' : '展開'}
                              {showLessonVariables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                          {showLessonVariables && (
                            <div className="grid grid-cols-1 gap-1 text-xs max-h-40 overflow-y-auto">
                              {lessonVariables.map(v => (
                                <div key={v.key} className="text-[#4B4036] opacity-75 py-0.5">
                                  <span className="font-mono text-[#2B3A3B]">{`{${v.key}}`}</span> - {v.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                                            {/* 動態變數說明 */}
                    <div className="mb-3 p-3 bg-white/50 rounded-lg border border-[#EADBC8]/30">
                      <h5 className="font-bold text-[#2B3A3B] text-xs mb-2">動態變數說明</h5>
                      <div className="space-y-2">
                        <div className="text-xs text-[#4B4036] opacity-75">
                          使用格式：{`{custom_past_X_lesson_date}`} 或 {`{custom_future_X_lesson_date}`}，X為1-20的數字
                        </div>
                        <div className="text-xs text-[#4B4036] opacity-75">
                          加上 _timeslot 可顯示時間：{`{custom_past_X_lesson_date_timeslot}`}
                        </div>
                        <div className="text-xs text-[#4B4036] opacity-75">
                          加上 _weekday 可顯示星期：{`{custom_past_X_lesson_weekday}`}
                        </div>
                        <div className="text-xs text-[#4B4036] opacity-75">
                          範例：{`{custom_future_1_lesson_date}`} 只顯示日期，{`{custom_future_1_lesson_date_timeslot}`} 顯示日期+時間，{`{custom_future_1_lesson_weekday}`} 顯示星期
                        </div>
                        <div className="text-xs text-[#4B4036] opacity-75">
                          支援所有課堂欄位：ID、課程包、進度備註、影片連結、下個目標、備註、建立時間等
                        </div>
                      </div>
                    </div>
                    
                    {/* 變數使用說明 */}
                    <div className="text-xs text-[#4B4036] opacity-60 mt-2 p-2 bg-white/50 rounded-lg">
                      <div className="font-bold mb-1">使用說明：</div>
                      <div className="space-y-0.5">
                        <div>• 支援 {`{變數名}`} 和 {`{{變數名}}`} 兩種格式</div>
                        <div>• 日期會自動格式化為中文格式</div>
                        <div>• 數量會自動加上單位（堂、個月等）</div>
                        <div>• 如果資料不存在會顯示為空字串</div>
                        <div>• 動態課堂變數：{`{custom_past_X_lesson_date}`} 或 {`{custom_future_X_lesson_date}`}</div>
                        <div>• 加上 _timeslot 顯示時間：{`{custom_past_X_lesson_date_timeslot}`}</div>
                        <div>• 加上 _weekday 顯示星期：{`{custom_past_X_lesson_weekday}`}</div>
                        <div>• X為1-20的數字，代表第幾堂課</div>
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                  {/* 操作按鈕 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                      className="flex-1 py-3 px-6 rounded-full font-bold text-base transition-all duration-300 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md hover:scale-105"
                    >
                      {editingTemplate ? '更新範本' : '創建範本'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        setNewTemplate({
                          template_name: '',
                          template_content: '',
                          template_type: 'general'
                        });
                      }}
                      className="px-6 py-3 rounded-full font-bold text-base transition-all duration-300 bg-white/80 text-[#4B4036] border-2 border-[#EADBC8]/50 hover:bg-[#EADBC8]/30"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認發送對話框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="relative">
            {/* 左上角兔子圖 */}
            <img src="/icons/bunnysmall-v2.PNG" alt="兔子" className="absolute -top-7 -left-7 w-14 h-14 drop-shadow-lg select-none pointer-events-none z-10" />
            {/* 右上角熊臉圖 */}
            <img src="/icons/bear-face.PNG" alt="熊" className="absolute -top-7 -right-7 w-14 h-14 drop-shadow-lg select-none pointer-events-none z-10" />
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md border-2 border-[#EADBC8]/50 animate-in zoom-in-95 duration-200 overflow-hidden">
              {/* 標題欄 */}
              <div className="flex items-center justify-center p-6 border-b-2 border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                    <Send className="w-5 h-5 text-[#4B4036]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2B3A3B]">確認發送訊息</h2>
                </div>
              </div>
              
              {/* 內容區域 */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#2B3A3B] mb-2">
                    確定要發送訊息嗎？🥰
                  </div>
                  <div className="text-sm text-[#4B4036] opacity-75">
                    此操作無法撤銷，請確認後再發送
                  </div>
                </div>
                
                {/* 發送資訊 */}
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-2xl border-2 border-[#EADBC8]/30">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[#2B3A3B]">{selectedStudentIds.length}</span>
                      </div>
                      <span className="text-sm font-bold text-[#2B3A3B]">發送對象</span>
                    </div>
                    <div className="text-sm text-[#4B4036] ml-8 max-h-32 overflow-y-auto pr-2">
                      {students.filter(s => selectedStudentIds.includes(s.id)).map(s => s.full_name).join('、')}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <FileText className="w-3 h-3 text-[#2B3A3B]" />
                      </div>
                      <span className="text-sm font-bold text-[#2B3A3B]">使用範本</span>
                    </div>
                    <div className="text-sm text-[#4B4036] ml-8">
                      {selectedTemplate?.template_name}
                    </div>
                  </div>
                </div>
                
                {/* 按鈕區域 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1 py-3 px-6 rounded-full font-bold text-base transition-all duration-300 bg-white/80 text-[#4B4036] border-2 border-[#EADBC8]/50 hover:bg-[#EADBC8]/30 hover:scale-105"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmSend}
                    className="flex-1 py-3 px-6 rounded-full font-bold text-base transition-all duration-300 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    確認發送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}