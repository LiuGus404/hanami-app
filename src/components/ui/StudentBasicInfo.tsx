import { useState, useEffect, useRef } from 'react';

import { PopupSelect } from './PopupSelect';
import StudentIDCard from './StudentIDCard';

import { supabase } from '@/lib/supabase';
import { calculateRemainingLessons } from '@/lib/utils';
import { Student, Teacher } from '@/types';
import { QrCode, MessageCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBatchContactDays } from '@/hooks/useBatchContactDays';
import { ContactChatDialog } from './ContactChatDialog';

const weekdays = [
  { label: '星期日', value: 0 },
  { label: '星期一', value: 1 },
  { label: '星期二', value: 2 },
  { label: '星期三', value: 3 },
  { label: '星期四', value: 4 },
  { label: '星期五', value: 5 },
  { label: '星期六', value: 6 },
];

// 全局快取
let courseOptionsCache: string[] | null = null;
let teacherOptionsCache: { label: string, value: string }[] | null = null;
let courseOptionsLoading = false;
let teacherOptionsLoading = false;

const PREMIUM_AI_ORG_ID = 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';

interface StudentFormData {
  id: string;
  student_oid: string | null;
  full_name: string;
  nick_name: string | null;
  gender: string | null;
  contact_number: string;
  student_dob: string | null;
  student_age: number | null;
  parent_email: string | null;
  health_notes: string | null;
  student_remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  address: string | null;
  course_type: string | null;
  duration_months: number | null;
  regular_timeslot: string | null;
  regular_weekday: number | null;
  school: string | null;
  started_date: string | null;
  student_email: string | null;
  student_password: string | null;
  student_preference: string | null;
  student_teacher: string | null;
  student_type: string | null;
  lesson_date: string | null;
  actual_timeslot: string | null;
  weekday: number | null;
  non_approved_lesson: number | null;
  approved_lesson_nonscheduled: number | null;
  care_alert: boolean | null;
}

interface FormField {
  name: keyof StudentFormData;
  label: string;
  type: string;
  required: boolean;
}

type Props = {
  student: Student;
  onUpdate: (newData: Student) => void;
  visibleFields?: string[];
  isInactive?: boolean;
  hideTeacherInfo?: boolean; // 是否隱藏負責老師資訊
  hideSensitiveInfo?: boolean; // 是否隱藏敏感資訊（備註、Email、密碼、時間戳）
  readonlyFields?: string[]; // 只讀欄位列表（即使編輯模式也不可編輯）
  hideContactDays?: boolean; // 是否隱藏聯繫天數顯示
  organizationName?: string;
  organizationEnglishName?: string;
  orgId?: string;
}

export default function StudentBasicInfo({ student, onUpdate, visibleFields = [], isInactive = false, hideTeacherInfo = false, hideSensitiveInfo = false, readonlyFields = [], hideContactDays = false, organizationName, organizationEnglishName, orgId }: Props) {
  const allowAiFeatures = orgId === PREMIUM_AI_ORG_ID;
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    id: student?.id || '',
    full_name: student?.full_name || '',
    student_age: student?.student_age || null,
    gender: student?.gender || null,
    course_type: student?.course_type || null,
    regular_weekday: student?.regular_weekday || null,
    regular_timeslot: student?.regular_timeslot || null,
    student_teacher: student?.student_teacher || null,
    created_at: student?.created_at || '',
    updated_at: student?.updated_at || '',
    student_oid: student?.student_oid || null,
    nick_name: student?.nick_name || null,
    contact_number: student?.contact_number || '',
    student_dob: student?.student_dob || null,
    parent_email: student?.parent_email || null,
    health_notes: student?.health_notes || null,
    student_remarks: student?.student_remarks || null,
    address: student?.address || null,
    duration_months: student?.duration_months || null,
    school: student?.school || null,
    non_approved_lesson: (student as any)?.non_approved_lesson || 0,
    approved_lesson_nonscheduled: (student as any)?.approved_lesson_nonscheduled || 0,
    care_alert: (student as any)?.care_alert || false,
    started_date: student?.started_date || null,
    student_email: student?.student_email || null,
    student_password: student?.student_password || null,
    student_preference: student?.student_preference || null,
    student_type: student?.student_type || null,
    lesson_date: student?.lesson_date || null,
    actual_timeslot: student?.actual_timeslot || null,
    weekday: null,
  });
  const [originalData, setOriginalData] = useState<Student>(student);
  const [courseOptions, setCourseOptions] = useState<string[] | null>(null);
  const [showGenderSelect, setShowGenderSelect] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [tempGender, setTempGender] = useState<string>('');
  const [tempCourse, setTempCourse] = useState<string>('');
  const [tempTeacher, setTempTeacher] = useState<string>('');

  const [teacherOptions, setTeacherOptions] = useState<{ label: string, value: string }[]>([]);
  const [calculatedRemainingLessons, setCalculatedRemainingLessons] = useState<number | null>(null);
  const [showStudentIDCard, setShowStudentIDCard] = useState(false);
  // 使用批量載入聯繫天數
  const phoneNumbers = student?.contact_number ? [student.contact_number] : [];
  const { results: batchContactResults, loading: loadingContactDays } = useBatchContactDays(phoneNumbers);
  
  const contactDaysData = student?.contact_number ? batchContactResults[student.contact_number] : null;
  const contactDays = contactDaysData?.daysSinceContact ?? null;
  const lastContactTime = contactDaysData?.lastContactTime ?? null;

  // 對話框狀態
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  
  // 添加防抖機制
  const courseOptionsFetchedRef = useRef(false);
  const teacherOptionsFetchedRef = useRef(false);

  // 聯繫天數現在通過 useBatchContactDays Hook 處理

  useEffect(() => {
    // 如果已經載入過老師選項，直接使用快取
    if (teacherOptionsCache) {
      setTeacherOptions(teacherOptionsCache);
      return;
    }

    // 防止重複載入
    if (teacherOptionsFetchedRef.current || teacherOptionsLoading) return;
    teacherOptionsFetchedRef.current = true;
    teacherOptionsLoading = true;

    const fetchTeacherOptions = async () => {
      try {
        const { data } = await supabase.from('hanami_employee').select('teacher_nickname');
        if (data) {
          const options = data.map((item: any) => ({
            label: item.teacher_nickname,
            value: item.teacher_nickname,
          }));
          setTeacherOptions(options);
          teacherOptionsCache = options; // 快取結果
        }
      } finally {
        teacherOptionsLoading = false;
      }
    };
    fetchTeacherOptions();
  }, []);

  useEffect(() => {
    setTempGender(formData.gender || '');
    setTempCourse(formData.course_type || '');
  }, [formData.gender, formData.course_type]);

  // 計算剩餘堂數
  useEffect(() => {
    const calculateRemaining = async () => {
      if (student && student.student_type === '常規') {
        try {
          const remaining = await calculateRemainingLessons(student.id, new Date());
          setCalculatedRemainingLessons(remaining);
        } catch (error) {
          console.error('Error calculating remaining lessons:', error);
          setCalculatedRemainingLessons(null);
        }
      } else {
        setCalculatedRemainingLessons(null);
      }
    };
    
    calculateRemaining();
  }, [student]);

  useEffect(() => {
    // 如果已經載入過課程選項，直接使用快取
    if (courseOptionsCache) {
      setCourseOptions(courseOptionsCache);
      return;
    }

    // 防止重複載入
    if (courseOptionsFetchedRef.current || courseOptionsLoading) return;
    courseOptionsFetchedRef.current = true;
    courseOptionsLoading = true;

    const fetchCourseOptions = async () => {
      setCourseOptions(null); // 標示正在載入中
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('name, status')
        .eq('status', true);

      console.log('📦 課程載入結果：', data, error);

      if (!error && data) {
        const options = data.map((c) => c.name).filter((name): name is string => name !== null);
        setCourseOptions(options);
        courseOptionsCache = options; // 快取結果
      } else {
        setCourseOptions([]); // 若出錯則設為空陣列避免卡住
      }
      courseOptionsLoading = false;
    };

    fetchCourseOptions();
  }, []);

  const isVisible = (field: string) => visibleFields.length === 0 || visibleFields.includes(field);

  const isEditable = (field: string) => {
    // 停用學生不可編輯
    if (isInactive) {
      return false;
    }
    
    // 檢查是否在只讀欄位列表中
    if (readonlyFields.includes(field)) {
      return false;
    }
    
    if (formData.student_type === '試堂') {
      const editableFields = [
        'full_name',
        'gender',
        'student_dob',
        'course_type',
        'school',
        'address',
        'student_teacher',
        'student_preference',
        'contact_number',
        'parent_email',
        'health_notes',
        'lesson_date',
        'actual_timeslot',
      ];
      return editableFields.includes(field);
    }
    return true;
  };

  const handleChange = (field: keyof StudentFormData, value: string | number | null) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // 試堂學生：當 actual_timeslot 改變時，同步到 regular_timeslot
      if (field === 'actual_timeslot' && prev.student_type === '試堂' && value) {
        newData.regular_timeslot = value as string;
      }
      
      // 試堂學生：當 lesson_date 改變時，自動計算並更新星期
      if (field === 'lesson_date' && prev.student_type === '試堂' && value) {
        const date = new Date(value as string);
        const weekday = date.getDay(); // 0-6 (日-六)
        newData.regular_weekday = weekday;
        // 同時更新 weekday 欄位以保持資料一致性
        newData.weekday = weekday;
      }
      
      return newData;
    });
  };

  function studentToFormData(student: Student): StudentFormData {
    return {
      id: student.id,
      student_oid: student.student_oid ?? null,
      full_name: student.full_name,
      nick_name: student.nick_name ?? null,
      gender: student.gender ?? null,
      contact_number: student.contact_number ?? '',
      student_dob: student.student_dob ?? null,
      student_age: student.student_age ?? null,
      parent_email: student.parent_email ?? null,
      health_notes: student.health_notes ?? null,
      student_remarks: student.student_remarks ?? null,
      created_at: student.created_at ?? null,
      updated_at: student.updated_at ?? null,
      address: student.address ?? null,
      course_type: student.course_type ?? null,
      duration_months: student.duration_months ?? null,
      regular_timeslot: student.regular_timeslot ?? null,
      regular_weekday: student.regular_weekday ?? null,
      school: student.school ?? null,
      started_date: student.started_date ?? null,
      student_email: student.student_email ?? null,
      student_password: student.student_password ?? null,
      student_preference: student.student_preference ?? null,
      student_teacher: student.student_teacher ?? null,
      student_type: student.student_type ?? null,
      lesson_date: student.lesson_date ?? null,
      actual_timeslot: student.actual_timeslot ?? null,
      weekday: (student as any).weekday ?? null,
      non_approved_lesson: (student as any)?.non_approved_lesson ?? 0,
      approved_lesson_nonscheduled: (student as any)?.approved_lesson_nonscheduled ?? 0,
      care_alert: (student as any)?.care_alert ?? false,
    };
  }

  const handleCancel = () => {
    setFormData(studentToFormData(originalData));
    setEditMode(false);
  };

  const handleUndo = () => {
    setFormData(studentToFormData(originalData));
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;
    return totalMonths;
  };

  const formatAgeDisplay = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} 歲${remainingMonths > 0 ? ` ${remainingMonths} 個月` : ''}`;
  };

  const handleSave = async () => {
    // 停用學生不可編輯
    if (isInactive) {
      alert('停用學生不可編輯');
      return;
    }

    const missingFields: (keyof StudentFormData)[] = [];
    const requiredFields: (keyof StudentFormData)[] = ['full_name', 'gender', 'course_type', 'student_type'];
    requiredFields.forEach(field => {
      if (!formData[field]) missingFields.push(field);
    });
    if (formData.student_type === '常規') {
      if (!formData.regular_weekday) missingFields.push('regular_weekday');
      if (!formData.regular_timeslot) missingFields.push('regular_timeslot');
    }
    if (formData.student_type === '試堂') {
      if (!formData.lesson_date) missingFields.push('lesson_date');
      if (!formData.actual_timeslot) missingFields.push('actual_timeslot');
    }
    const fieldLabels: Record<keyof StudentFormData, string> = {
      id: 'ID',
      student_oid: '學生編號',
      full_name: '姓名',
      nick_name: '暱稱',
      gender: '性別',
      contact_number: '聯絡電話',
      student_dob: '生日',
      student_age: '年齡',
      parent_email: '家長Email',
      health_notes: '健康/過敏',
      student_remarks: '備註',
      created_at: '建立時間',
      updated_at: '更新時間',
      address: '地址',
      course_type: '課程',
      duration_months: '報讀時長',
      regular_timeslot: '固定上課時段',
      regular_weekday: '固定上課星期數',
      school: '學校',
      started_date: '入學日期',
      student_email: '學生Email',
      student_password: '學生密碼',
      student_preference: '偏好',
      student_teacher: '負責老師',
      student_type: '類別',
      lesson_date: '試堂日期',
      actual_timeslot: '試堂時間',
      weekday: '星期',
      non_approved_lesson: '待確認堂數',
      approved_lesson_nonscheduled: '待安排堂數',
      care_alert: '需要特別照顧',
    };
    if (missingFields.length > 0) {
      alert(`請填寫以下欄位：${missingFields.map(f => fieldLabels[f] || f).join(', ')}`);
      return;
    }

    // 如果是試堂學生，清空固定上課時間
    if (formData.student_type === '試堂') {
      formData.regular_weekday = null;
      formData.regular_timeslot = '';
    }

    // 如果有生日，計算並更新月齡
    if (formData.student_dob) {
      formData.student_age = calculateAge(formData.student_dob);
    }

    let error;
    if (formData.student_type === '試堂') {
      // 試堂學生：同步 actual_timeslot 到 regular_timeslot
      if (formData.actual_timeslot) {
        formData.regular_timeslot = formData.actual_timeslot;
      }
      
      // 試堂學生：根據 lesson_date 計算星期
      if (formData.lesson_date) {
        const date = new Date(formData.lesson_date);
        const weekday = date.getDay();
        formData.regular_weekday = weekday;
        formData.weekday = weekday;
      }
      
      // 只傳 hanami_trial_students 有的欄位
      const trialStudentFields: (keyof StudentFormData)[] = [
        'id', 'student_oid', 'full_name', 'nick_name', 'gender', 'contact_number', 'student_dob', 'student_age',
        'parent_email', 'health_notes', 'created_at', 'updated_at', 'address', 'course_type',
        'duration_months', 'regular_timeslot', 'regular_weekday', 'school', 'student_email',
        'student_password', 'student_preference', 'student_teacher', 'student_type', 'lesson_date', 'actual_timeslot', 'weekday',
      ];
      const trialPayload: Record<string, any> = {};
      trialStudentFields.forEach((key) => {
        if (key === 'duration_months') {
          trialPayload[key] = formData[key] !== undefined && formData[key] !== null ? String(formData[key]) : null;
        } else if (key === 'regular_weekday') {
          trialPayload[key] = formData[key] !== undefined && formData[key] !== null ? String(formData[key]) : null;
        } else {
          trialPayload[key] = formData[key] === null ? null : formData[key];
        }
      });
      const { error: trialError } = await supabase
        .from('hanami_trial_students')
        .update(trialPayload)
        .eq('id', formData.id);
      error = trialError;
    } else {
      // 只傳 Hanami_Students 有的欄位
      const hanamiStudentFields: (keyof StudentFormData)[] = [
        'id', 'student_oid', 'full_name', 'nick_name', 'gender', 'contact_number', 'student_dob', 'student_age',
        'parent_email', 'health_notes', 'student_remarks', 'created_at', 'updated_at', 'address', 'course_type',
        'duration_months', 'regular_timeslot', 'regular_weekday', 'school', 'started_date',
        'student_email', 'student_password', 'student_preference', 'student_teacher', 'student_type',
        'non_approved_lesson', 'approved_lesson_nonscheduled', 'care_alert',
      ];
      const studentPayload: Record<string, any> = {};
      hanamiStudentFields.forEach((key) => {
        if (key === 'duration_months') {
          studentPayload[key] = formData[key] ?? null;
        } else if (key === 'regular_weekday') {
          studentPayload[key] = formData[key] ?? null;
        } else if (key === 'non_approved_lesson' || key === 'approved_lesson_nonscheduled') {
          studentPayload[key] = formData[key] ?? 0;
        } else if (key === 'care_alert') {
          studentPayload[key] = formData[key] ?? false;
        } else {
          studentPayload[key] = formData[key] === null ? null : formData[key];
        }
      });
      const { error: studentError } = await supabase
        .from('Hanami_Students')
        .update(studentPayload)
        .eq('id', formData.id);
      error = studentError;
    }

    if (error) {
      alert(`更新失敗：${error.message}`);
    } else {
      alert('更新成功');
      onUpdate(formData);
      setOriginalData(formData);
      setEditMode(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-2xl p-6 w-full max-w-md mx-auto text-[#4B4B4B]">
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          alt="頭像"
          className="w-24 h-24 rounded-full"
          src={formData.gender === 'female' || formData.gender === '女' ? '/girl.png' : '/boy.png'}
        />
        <div className="text-xl font-semibold">
          {formData.full_name || '未命名'}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">基本資料</h2>
        <div className="flex items-center gap-2">
          {/* 聯繫天數顯示 */}
          {!hideContactDays && !loadingContactDays && contactDays !== null && (
            allowAiFeatures ? (
              <button
                onClick={() => setChatDialogOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full text-xs font-medium text-[#2B3A3B] shadow-sm hover:shadow-md transition-all cursor-pointer"
                title="點擊聯繫家長"
              >
                <MessageCircle className="w-3 h-3" />
                <span>
                  {contactDays === 0 ? '今天有聯繫' : 
                   contactDays === 1 ? '1天未聯繫' : 
                   `${contactDays}天未聯繫`}
                </span>
              </button>
            ) : (
              <button
                onClick={() => toast('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com')}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-600 cursor-not-allowed"
                type="button"
              >
                <MessageCircle className="w-3 h-3" />
                <span>
                  {contactDays === 0 ? '今天有聯繫' : 
                   contactDays === 1 ? '1天未聯繫' : 
                   `${contactDays}天未聯繫`}
                </span>
              </button>
            )
          )}
          {!hideContactDays && !loadingContactDays && contactDays === null && (
            allowAiFeatures ? (
              <button
                onClick={() => setChatDialogOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                title="點擊聯繫家長"
              >
                <MessageCircle className="w-3 h-3" />
                <span>無聯繫記錄</span>
              </button>
            ) : (
              <button
                onClick={() => toast('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com')}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-600 cursor-not-allowed"
                type="button"
              >
                <MessageCircle className="w-3 h-3" />
                <span>無聯繫記錄</span>
              </button>
            )
          )}
          {!hideContactDays && loadingContactDays && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
              <span>載入中</span>
            </div>
          )}
          {/* QR碼按鈕 */}
          <button
            className="text-sm text-[#A68A64] hover:underline flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
            onClick={() => setShowStudentIDCard(true)}
            title="查看學生證"
          >
            <QrCode className="w-4 h-4" />
            QR碼
          </button>
          {!editMode && !isInactive && (
            <button
              className="text-sm text-[#A68A64] hover:underline flex items-center gap-1"
              onClick={() => setEditMode(true)}
            >
              <img alt="編輯" className="w-4 h-4" src="/icons/edit-pencil.png" /> 編輯
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 text-sm">
        {isVisible('student_oid') && (
          <>
            <div className="font-medium">學生編號：</div>
            <div>{student.id || '—'}</div>
          </>
        )}

        {isVisible('full_name') && (
          <>
            <div className="font-medium">姓名：</div>
            <div>
              {editMode && isEditable('full_name') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  placeholder="請輸入學生姓名"
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              ) : (
                formData.full_name || '—'
              )}
            </div>
          </>
        )}

        {isVisible('gender') && (
          <>
            <div className="font-medium">性別：</div>
            <div>
              {editMode && isEditable('gender') ? (
                <>
                  <button
                    className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    onClick={() => setShowGenderSelect(true)}
                  >
                    {tempGender === 'female' || tempGender === '女' ? '女' : tempGender === 'male' || tempGender === '男' ? '男' : '請選擇'}
                  </button>
                  {showGenderSelect && (
                    <PopupSelect
                      mode="single"
                      options={[
                        { label: '男', value: '男' },
                        { label: '女', value: '女' },
                      ]}
                      selected={tempGender || ''}
                      title="選擇性別"
                      onCancel={() => {
                        setTempGender(formData.gender || '');
                        setShowGenderSelect(false);
                      }}
                      onChange={(value) => setTempGender(value as string)}
                      onConfirm={() => {
                        handleChange('gender', tempGender);
                        setShowGenderSelect(false);
                      }}
                    />
                  )}
                </>
              ) : (
                formData.gender === 'female' || formData.gender === '女' ? '女' : formData.gender === 'male' || formData.gender === '男' ? '男' : '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_dob') && (
          <>
            <div className="font-medium">年齡：</div>
            <div>
              {editMode && isEditable('student_dob') ? (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-24 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    type="text"
                    value={formData.student_age ? formatAgeDisplay(formData.student_age) : ''}
                  />
                  <button
                    className="px-3 py-1 bg-[#A68A64] text-white rounded hover:bg-[#91765a] text-sm"
                    onClick={() => {
                      if (formData.student_dob) {
                        const months = calculateAge(formData.student_dob);
                        handleChange('student_age', months);
                        alert('計算成功');
                      } else {
                        alert('請先輸入生日再計算年齡');
                      }
                    }}
                  >
                    計算
                  </button>
                </div>
              ) : (
                formData.student_age ? formatAgeDisplay(formData.student_age) : (formData.student_dob ? formatAgeDisplay(calculateAge(formData.student_dob)) : '—')
              )}
            </div>
          </>
        )}

        {isVisible('student_dob') && (
          <>
            <div className="font-medium">生日：</div>
            <div>
              {editMode && isEditable('student_dob') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="date"
                  value={formData.student_dob || ''}
                  onChange={(e) => handleChange('student_dob', e.target.value)}
                />
              ) : (
                formData.student_dob || '—'
              )}
            </div>
          </>
        )}

        {isVisible('course_type') && (
          <>
            <div className="font-medium">課程：</div>
            <div>
              {editMode && isEditable('course_type') ? (
                courseOptions === null ? (
                  <div className="text-gray-400">載入中...</div>
                ) : courseOptions.length === 0 ? (
                  <div className="text-gray-400">無可用課程</div>
                ) : (
                  <>
                    <button
                      className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                      onClick={() => setShowCourseSelect(true)}
                    >
                      {tempCourse || '請選擇'}
                    </button>
                    {showCourseSelect && (
                      <PopupSelect
                        mode="single"
                        options={courseOptions.map(c => ({ label: c, value: c }))}
                        selected={tempCourse || ''}
                        title="選擇課程"
                        onCancel={() => {
                          setTempCourse(formData.course_type || '');
                          setShowCourseSelect(false);
                        }}
                        onChange={(value) => setTempCourse(value as string)}
                        onConfirm={() => {
                          handleChange('course_type', tempCourse);
                          setShowCourseSelect(false);
                        }}
                      />
                    )}
                  </>
                )
              ) : (
                formData.course_type || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_type') && (
          <>
            <div className="font-medium">類別：</div>
            <div>{formData.student_type || '—'}</div>
          </>
        )}

        {formData.student_type === '試堂' && (
          <>
            <div className="font-medium">試堂日期：</div>
            <div>
              {editMode && isEditable('lesson_date') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="date"
                  value={formData.lesson_date || ''}
                  onChange={(e) => handleChange('lesson_date', e.target.value)}
                />
              ) : (
                formData.lesson_date ? new Date(formData.lesson_date).toLocaleDateString('zh-HK') : '—'
              )}
            </div>
            <div className="font-medium">試堂時間：</div>
            <div>
              {editMode && isEditable('actual_timeslot') ? (
                <div>
                  <input
                    className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    type="time"
                    value={formData.actual_timeslot || ''}
                    onChange={(e) => handleChange('actual_timeslot', e.target.value)}
                  />
                  <div className="text-xs text-[#A68A64] mt-1">
                    💡 試堂時間會自動同步到課堂情況中
                  </div>
                </div>
              ) : (
                formData.actual_timeslot || '—'
              )}
            </div>
          </>
        )}

        {isVisible('school') && (
          <>
            <div className="font-medium">學校：</div>
            <div>
              {editMode && isEditable('school') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.school || ''}
                  onChange={(e) => handleChange('school', e.target.value)}
                />
              ) : (
                formData.school || '—'
              )}
            </div>
          </>
        )}

        {isVisible('address') && (
          <>
            <div className="font-medium">地址：</div>
            <div>
              {editMode && isEditable('address') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              ) : (
                formData.address || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_teacher') && !hideTeacherInfo && (
          <>
            <div className="font-medium">負責老師：</div>
            <div>
              {editMode && isEditable('student_teacher') ? (
                <>
                  <button
                    className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    onClick={() => setShowTeacherSelect(true)}
                  >
                    {tempTeacher || formData.student_teacher || '請選擇'}
                  </button>
                  {showTeacherSelect && (
                    <PopupSelect
                      mode="single"
                      options={teacherOptions}
                      selected={tempTeacher || formData.student_teacher || ''}
                      title="選擇負責老師"
                      onCancel={() => {
                        setTempTeacher(formData.student_teacher || '');
                        setShowTeacherSelect(false);
                      }}
                      onChange={(value) => setTempTeacher(value as string)}
                      onConfirm={() => {
                        handleChange('student_teacher', tempTeacher);
                        setShowTeacherSelect(false);
                      }}
                    />
                  )}
                </>
              ) : (
                formData.student_teacher || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_preference') && (
          <>
            <div className="font-medium">偏好：</div>
            <div>
              {editMode && isEditable('student_preference') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.student_preference || ''}
                  onChange={(e) => handleChange('student_preference', e.target.value)}
                />
              ) : (
                formData.student_preference || '—'
              )}
            </div>
          </>
        )}

        {isVisible('regular_weekday') && (
          <>
            <div className="font-medium">星期：</div>
            <div>
              {editMode && isEditable('regular_weekday') ? (
                <select
                  className="appearance-none border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  value={formData.regular_weekday ?? ''}
                  onChange={(e) => handleChange('regular_weekday', e.target.value)}
                >
                  <option value="">請選擇</option>
                  {weekdays.map(({ label, value }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                formData.regular_weekday !== undefined && formData.regular_weekday !== null
                  ? Array.isArray(formData.regular_weekday)
                    ? formData.regular_weekday
                      .map((d: number | string) => weekdays.find((w) => w.value === Number(d))?.label)
                      .filter(Boolean)
                      .join(', ')
                    : ['日', '一', '二', '三', '四', '五', '六'][Number(formData.regular_weekday)] || '—'
                  : '—'
              )}
            </div>
          </>
        )}

        {isVisible('regular_timeslot') && (
          <>
            <div className="font-medium">時段：</div>
            <div>
              {editMode && isEditable('regular_timeslot') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.regular_timeslot || ''}
                  onChange={(e) => handleChange('regular_timeslot', e.target.value)}
                />
              ) : (
                formData.regular_timeslot || '—'
              )}
            </div>
          </>
        )}

        {formData.student_type === '常規' && calculatedRemainingLessons !== null && (
          <>
            <div className="font-medium">剩餘堂數：</div>
            <div>{calculatedRemainingLessons !== null ? `${calculatedRemainingLessons} 堂` : '—'}</div>
          </>
        )}

        {isVisible('started_date') && (
          <>
            <div className="font-medium">入學日期：</div>
            <div>
              {formData.student_type === '試堂' ? (
                formData.lesson_date ? new Date(formData.lesson_date).toLocaleDateString('zh-HK') : '—'
              ) : (
                editMode && isEditable('started_date') ? (
                  <input
                    className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    type="date"
                    value={formData.started_date || ''}
                    onChange={(e) => handleChange('started_date', e.target.value)}
                  />
                ) : (
                  formData.started_date || '—'
                )
              )}
            </div>
          </>
        )}

        {isVisible('duration_months') && (
          <>
            <div className="font-medium">報讀時長：</div>
            <div>{formData.duration_months != null ? `${formData.duration_months} 個月` : '—'}</div>
          </>
        )}

        {isVisible('contact_number') && (
          <>
            <div className="font-medium">聯絡電話：</div>
            <div>
              {editMode && isEditable('contact_number') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.contact_number || ''}
                  onChange={(e) => handleChange('contact_number', e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span>{formData.contact_number || '—'}</span>
                  {formData.contact_number && (
                    <>
                      {/* 撥打電話按鈕 */}
                      <button
                        className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        title="撥打電話"
                        onClick={() => {
                          // 處理電話號碼格式（移除所有非數字字符）
                          const cleanPhoneNumber = formData.contact_number.replace(/\D/g, '');
                          
                          // 如果是香港電話號碼（8位數），加上852區號
                          const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber;
                          
                          const telUrl = `tel:${formattedPhoneNumber}`;
                          window.open(telUrl, '_blank');
                        }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </button>
                      
                      {/* WhatsApp按鈕 */}
                      <button
                        className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        title="開啟WhatsApp"
                        onClick={() => {
                          // 處理電話號碼格式（移除所有非數字字符）
                          const cleanPhoneNumber = formData.contact_number.replace(/\D/g, '');
                          
                          // 如果是香港電話號碼（8位數），加上852區號
                          const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber;
                          
                          const whatsappUrl = `https://wa.me/${formattedPhoneNumber}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {isVisible('parent_email') && (
          <>
            <div className="font-medium">家長 Email：</div>
            <div>
              {editMode && isEditable('parent_email') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="email"
                  value={formData.parent_email || ''}
                  onChange={(e) => handleChange('parent_email', e.target.value)}
                />
              ) : (
                formData.parent_email || '—'
              )}
            </div>
          </>
        )}

        {isVisible('health_notes') && (
          <>
            <div className="font-medium">健康/過敏情況：</div>
            <div>
              {editMode && isEditable('health_notes') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.health_notes || ''}
                  onChange={(e) => handleChange('health_notes', e.target.value)}
                />
              ) : (
                formData.health_notes || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_remarks') && !hideSensitiveInfo && (
          <>
            <div className="font-medium">備註：</div>
            <div>
              {editMode && isEditable('student_remarks') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="text"
                  value={formData.student_remarks || ''}
                  onChange={(e) => handleChange('student_remarks', e.target.value)}
                />
              ) : (
                formData.student_remarks || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_email') && !hideSensitiveInfo && (
          <>
            <div className="font-medium">學生 Email：</div>
            <div>
              {editMode && isEditable('student_email') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="email"
                  value={formData.student_email || ''}
                  onChange={(e) => handleChange('student_email', e.target.value)}
                />
              ) : (
                formData.student_email || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_password') && !hideSensitiveInfo && (
          <>
            <div className="font-medium">學生密碼：</div>
            <div>
              {editMode && isEditable('student_password') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="password"
                  value={formData.student_password || ''}
                  onChange={(e) => handleChange('student_password', e.target.value)}
                />
              ) : (
                formData.student_password ? '••••••••' : '—'
              )}
            </div>
          </>
        )}

        {isVisible('created_at') && !hideSensitiveInfo && (
          <>
            <div className="font-medium">建立時間：</div>
            <div>{formData.created_at || '—'}</div>
          </>
        )}

        {isVisible('updated_at') && !hideSensitiveInfo && (
          <>
            <div className="font-medium">更新時間：</div>
            <div>{formData.updated_at || '—'}</div>
          </>
        )}

        {/* 新增的三個欄位 */}
        {isVisible('non_approved_lesson') && (
          <>
            <div className="font-medium">待確認堂數：</div>
            <div>
              {editMode && isEditable('non_approved_lesson') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="number"
                  min="0"
                  value={formData.non_approved_lesson || 0}
                  onChange={(e) => handleChange('non_approved_lesson', parseInt(e.target.value) || 0)}
                />
              ) : (
                <span className={`font-semibold ${(formData.non_approved_lesson || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {formData.non_approved_lesson || 0}
                </span>
              )}
            </div>
          </>
        )}

        {isVisible('approved_lesson_nonscheduled') && (
          <>
            <div className="font-medium">待安排堂數：</div>
            <div>
              {editMode && isEditable('approved_lesson_nonscheduled') ? (
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  type="number"
                  min="0"
                  value={formData.approved_lesson_nonscheduled || 0}
                  onChange={(e) => handleChange('approved_lesson_nonscheduled', parseInt(e.target.value) || 0)}
                />
              ) : (
                <span className={`font-semibold ${(formData.approved_lesson_nonscheduled || 0) > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                  {formData.approved_lesson_nonscheduled || 0}
                </span>
              )}
            </div>
          </>
        )}

        {isVisible('care_alert') && (
          <>
            <div className="font-medium">需要特別照顧：</div>
            <div>
              {editMode && isEditable('care_alert') ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="care_alert"
                    checked={formData.care_alert || false}
                    onChange={(e) => handleChange('care_alert', e.target.checked.toString())}
                    className="w-4 h-4 text-[#A68A64] bg-[#FFFCF5] border-[#E4D5BC] rounded focus:ring-[#A68A64] focus:ring-2"
                  />
                  <label htmlFor="care_alert" className="text-sm text-[#2B3A3B]">
                    {formData.care_alert ? '是' : '否'}
                  </label>
                </div>
              ) : (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  formData.care_alert 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {formData.care_alert ? '需要特別照顧' : '一般照顧'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {editMode && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-[#A68A64] text-white rounded-full px-5 py-2 text-sm shadow hover:bg-[#91765a] transition"
            onClick={handleSave}
          >
            儲存
          </button>
          <button
            className="bg-[#F5F2EC] text-[#A68A64] border border-[#D8CDBF] rounded-full px-5 py-2 text-sm shadow hover:bg-[#E6DFD2] transition"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            className="bg-[#FFF7EE] text-[#A68A64] border border-[#EADBC8] rounded-full px-5 py-2 text-sm shadow hover:bg-[#F2E8DB] transition"
            onClick={handleUndo}
          >
            ↩ Undo
          </button>
        </div>
      )}

      {/* 學生證彈窗 */}
      <StudentIDCard
        student={formData}
        isOpen={showStudentIDCard}
        onClose={() => setShowStudentIDCard(false)}
        organizationName={organizationName}
        organizationEnglishName={organizationEnglishName}
      />

      {/* 聯繫對話框 */}
      <ContactChatDialog
        isOpen={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        phoneNumber={student?.contact_number || ''}
        contactDays={contactDays}
      />
    </div>
  );
}
