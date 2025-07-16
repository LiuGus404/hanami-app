'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, FileText, UserX, ChevronDown, ChevronUp, Settings, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// HanamiButton 可愛按鈕（如有可引入，否則用 button 取代）
// import { HanamiButton } from './HanamiButton';

interface AIMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
}

interface MessageTemplate {
  id: string;
  template_name: string;
  template_content: string;
  template_type: string;
  is_active: boolean;
}

export default function AIMessageModal({ isOpen, onClose, students }: AIMessageModalProps) {
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

  // 變數別名對應表，支援多組常見英文變數
  const variableAlias: Record<string, string[]> = {
    student_name: ['full_name', 'fullName'],
    student_nickname: ['nick_name', 'nickName'],
    teacher_name: ['student_teacher', 'teacher_name'],
    lesson_time: ['regular_timeslot', 'lesson_time'],
  };

  // 載入模版
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSelectedStudentIds(students.map(s => s.id));
      setShowStudentDetails(Object.fromEntries(students.map(s => [s.id, false])));
      setPreviewStudentIndex(0);
      // 初始化每個學生的自訂訊息
      const initialMessages: Record<string, string> = {};
      students.forEach(student => {
        initialMessages[student.id] = '';
      });
      setCustomMessages(initialMessages);
    }
  }, [isOpen, students]);

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
  const generateMessage = (template: string, student: any) => {
    if (!template || !student) return '請選擇模版與學生';
    let msg = template;
    // 建立 keyMap：所有 key 轉小寫、去底線、去空白
    const keyMap: Record<string, any> = {};
    Object.keys(student).forEach(k => {
      const stdKey = k.toLowerCase().replace(/[_\s]/g, '');
      keyMap[stdKey] = student[k];
    });
    // 除錯：顯示 keyMap
    console.log('[AI訊息] 學生 keyMap:', keyMap);
    systemVariables.forEach(v => {
      // 標準化 key
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
        // 這裡需要根據當前學生獲取自訂訊息
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
      // 支援 {key}、{{key}}，允許前後空白
      const regex1 = new RegExp(`{{\\s*${v.key}\\s*}}`, 'gi');
      const regex2 = new RegExp(`{\\s*${v.key}\\s*}`, 'gi');
      msg = msg.replace(regex1, value);
      msg = msg.replace(regex2, value);
      // 除錯輸出
      console.log(`[AI訊息] 變數 ${v.key} (標準化: ${stdKey}) →`, value);
    });
    console.log('[AI訊息] 最終訊息：', msg);
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
    
    if (!selectedTemplate) {
      setErrorMessage('請先選擇範本');
      setIsSending(false);
      return;
    }
    for (let i = 0; i < selectedStudentIds.length; i++) {
      const student = students.find(s => s.id === selectedStudentIds[i]);
      if (!student) continue;
      // 使用該學生的自訂訊息，如果沒有則使用範本內容
      const studentMessage = customMessages[student.id] || selectedTemplate.template_content;
      const messageContent = generateMessage(studentMessage, student);
      try {
        await fetch('/api/ai-message/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            studentName: student.full_name,
            studentPhone: student.contact_number,
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.template_name,
            messageContent,
          }),
        });
      } catch (e) {
        setErrorMessage('發送失敗');
      }
      setSendProgress(i + 1);
    }
    setIsSending(false);
  };

  // 在組件內部新增複製功能
  const handleCopyMessage = () => {
    if (!selectedTemplate || !previewStudent) return;
    const text = generateMessage(getCurrentStudentMessage() || selectedTemplate.template_content, previewStudent);
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
    const { error } = await supabase
      .from('hanami_ai_message_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('刪除範本失敗:', error);
      return;
    }
    
    setTemplates(prev => prev.filter(t => t.id !== templateId));
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
                    <label className="text-xs font-bold text-[#4B4036]">自訂訊息內容：</label>
                    <span className="text-xs text-[#4B4036] opacity-75">{previewStudent?.full_name}</span>
                  </div>
                  <textarea 
                    className="w-full p-3 border-2 border-[#EADBC8]/50 rounded-xl resize-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] text-sm bg-white/90 backdrop-blur-sm transition-all duration-300" 
                    rows={4} 
                    placeholder="自訂訊息內容（可選）" 
                    value={getCurrentStudentMessage()} 
                    onChange={e => updateCurrentStudentMessage(e.target.value)} 
                  />
                </div>
                {/* 訊息預覽 */}
                <div className="bg-white/90 p-4 rounded-2xl border-2 border-[#EADBC8]/50 min-h-[80px] max-h-[160px] overflow-y-auto mb-2 shadow-inner text-[#4B4036] text-sm whitespace-pre-wrap">
                  {selectedTemplate && previewStudent ? generateMessage(getCurrentStudentMessage() || selectedTemplate.template_content, previewStudent) : '請選擇模版與學生'}
                </div>
                {/* 發送按鈕 */}
                <div className="flex items-center gap-2 w-full">
                  <button onClick={handleCopyMessage} className="p-3 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md hover:scale-110 transition-all duration-300" title="複製目前學生訊息">
                    <Copy className="w-5 h-5" />
                  </button>
                  <button onClick={handleSendClick} disabled={!selectedTemplate || selectedStudentIds.length===0 || isSending} className="flex-1 py-3 px-6 rounded-full font-bold text-base transition-all duration-300 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
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
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-2xl border-2 border-[#EADBC8]/30">
                    <h4 className="font-bold text-[#2B3A3B] text-sm mb-2">可用變數</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {systemVariables.slice(0, 10).map(v => (
                        <div key={v.key} className="text-[#4B4036] opacity-75">
                          {`{${v.key}}`} - {v.label}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#4B4036] opacity-60 mt-2">
                      更多變數請參考系統變數列表
                    </div>
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