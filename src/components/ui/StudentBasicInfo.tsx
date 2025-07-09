import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PopupSelect } from './PopupSelect'
import { calculateRemainingLessons } from '@/lib/utils'
import { Student, Teacher } from '@/types'

const weekdays = [
  { label: '星期日', value: 0 },
  { label: '星期一', value: 1 },
  { label: '星期二', value: 2 },
  { label: '星期三', value: 3 },
  { label: '星期四', value: 4 },
  { label: '星期五', value: 5 },
  { label: '星期六', value: 6 },
]

// 全局快取
let courseOptionsCache: string[] | null = null
let teacherOptionsCache: { label: string, value: string }[] | null = null
let courseOptionsLoading = false
let teacherOptionsLoading = false

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
}

export default function StudentBasicInfo({ student, onUpdate, visibleFields = [], isInactive = false }: Props) {
  const [editMode, setEditMode] = useState(false)
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
    started_date: student?.started_date || null,
    student_email: student?.student_email || null,
    student_password: student?.student_password || null,
    student_preference: student?.student_preference || null,
    lesson_date: student?.lesson_date || null,
    actual_timeslot: student?.actual_timeslot || null,
    student_type: student?.student_type || null,
  })
  const [originalData, setOriginalData] = useState<Student>(student)
  const [courseOptions, setCourseOptions] = useState<string[] | null>(null)
  const [showGenderSelect, setShowGenderSelect] = useState(false)
  const [showCourseSelect, setShowCourseSelect] = useState(false)
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [tempGender, setTempGender] = useState<string>('')
  const [tempCourse, setTempCourse] = useState<string>('')
  const [tempTeacher, setTempTeacher] = useState<string>('')

  const [teacherOptions, setTeacherOptions] = useState<{ label: string, value: string }[]>([])
  const [calculatedRemainingLessons, setCalculatedRemainingLessons] = useState<number | null>(null)
  
  // 添加防抖機制
  const courseOptionsFetchedRef = useRef(false)
  const teacherOptionsFetchedRef = useRef(false)

  useEffect(() => {
    // 如果已經載入過老師選項，直接使用快取
    if (teacherOptionsCache) {
      setTeacherOptions(teacherOptionsCache)
      return
    }

    // 防止重複載入
    if (teacherOptionsFetchedRef.current || teacherOptionsLoading) return
    teacherOptionsFetchedRef.current = true
    teacherOptionsLoading = true

    const fetchTeacherOptions = async () => {
      try {
        const { data } = await supabase.from('hanami_employee').select('teacher_nickname')
        if (data) {
          const options = data.map((item: any) => ({
            label: item.teacher_nickname,
            value: item.teacher_nickname
          }))
          setTeacherOptions(options)
          teacherOptionsCache = options // 快取結果
        }
      } finally {
        teacherOptionsLoading = false
      }
    }
    fetchTeacherOptions()
  }, [])

  useEffect(() => {
    setTempGender(formData.gender || '')
    setTempCourse(formData.course_type || '')
  }, [formData.gender, formData.course_type])

  // 計算剩餘堂數
  useEffect(() => {
    const calculateRemaining = async () => {
      if (student && student.student_type === '常規') {
        try {
          const remaining = await calculateRemainingLessons(student.id, new Date())
          setCalculatedRemainingLessons(remaining)
        } catch (error) {
          console.error('Error calculating remaining lessons:', error)
          setCalculatedRemainingLessons(null)
        }
      } else {
        setCalculatedRemainingLessons(null)
      }
    }
    
    calculateRemaining()
  }, [student])

  useEffect(() => {
    // 如果已經載入過課程選項，直接使用快取
    if (courseOptionsCache) {
      setCourseOptions(courseOptionsCache)
      return
    }

    // 防止重複載入
    if (courseOptionsFetchedRef.current || courseOptionsLoading) return
    courseOptionsFetchedRef.current = true
    courseOptionsLoading = true

    const fetchCourseOptions = async () => {
      setCourseOptions(null) // 標示正在載入中
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('name, status')
        .eq('status', true)

      console.log('📦 課程載入結果：', data, error)

      if (!error && data) {
        const options = data.map((c) => c.name).filter((name): name is string => name !== null)
        setCourseOptions(options)
        courseOptionsCache = options // 快取結果
      } else {
        setCourseOptions([]) // 若出錯則設為空陣列避免卡住
      }
      courseOptionsLoading = false
    }

    fetchCourseOptions()
  }, [])

  const isVisible = (field: string) => visibleFields.length === 0 || visibleFields.includes(field)

  const isEditable = (field: string) => {
    // 停用學生不可編輯
    if (isInactive) {
      return false
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
        'actual_timeslot'
      ]
      return editableFields.includes(field)
    }
    return true
  }

  const handleChange = (field: keyof StudentFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

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
    }
  }

  const handleCancel = () => {
    setFormData(studentToFormData(originalData))
    setEditMode(false)
  }

  const handleUndo = () => {
    setFormData(studentToFormData(originalData))
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    const totalMonths = years * 12 + months
    return totalMonths
  }

  const formatAgeDisplay = (months: number) => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return `${years} 歲${remainingMonths > 0 ? ` ${remainingMonths} 個月` : ''}`
  }

  const handleSave = async () => {
    // 停用學生不可編輯
    if (isInactive) {
      alert('停用學生不可編輯')
      return
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
    };
    if (missingFields.length > 0) {
      alert(`請填寫以下欄位：${missingFields.map(f => fieldLabels[f] || f).join(', ')}`)
      return
    }

    // 如果是試堂學生，清空固定上課時間
    if (formData.student_type === '試堂') {
      formData.regular_weekday = null;
      formData.regular_timeslot = '';
    }

    // 如果有生日，計算並更新月齡
    if (formData.student_dob) {
      formData.student_age = calculateAge(formData.student_dob)
    }

    let error;
    if (formData.student_type === '試堂') {
      // 只傳 hanami_trial_students 有的欄位
      const trialStudentFields: (keyof StudentFormData)[] = [
        'id', 'student_oid', 'full_name', 'nick_name', 'gender', 'contact_number', 'student_dob', 'student_age',
        'parent_email', 'health_notes', 'created_at', 'updated_at', 'address', 'course_type',
        'duration_months', 'regular_timeslot', 'regular_weekday', 'school', 'student_email',
        'student_password', 'student_preference', 'student_teacher', 'student_type', 'lesson_date', 'actual_timeslot'
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
        .eq('id', formData.id)
      error = trialError;
    } else {
      // 只傳 Hanami_Students 有的欄位
      const hanamiStudentFields: (keyof StudentFormData)[] = [
        'id', 'student_oid', 'full_name', 'nick_name', 'gender', 'contact_number', 'student_dob', 'student_age',
        'parent_email', 'health_notes', 'student_remarks', 'created_at', 'updated_at', 'address', 'course_type',
        'duration_months', 'regular_timeslot', 'regular_weekday', 'school', 'started_date',
        'student_email', 'student_password', 'student_preference', 'student_teacher', 'student_type'
      ];
      const studentPayload: Record<string, any> = {};
      hanamiStudentFields.forEach((key) => {
        if (key === 'duration_months') {
          studentPayload[key] = formData[key] ?? null;
        } else if (key === 'regular_weekday') {
          studentPayload[key] = formData[key] ?? null;
        } else {
          studentPayload[key] = formData[key] === null ? null : formData[key];
        }
      });
      const { error: studentError } = await supabase
        .from('Hanami_Students')
        .update(studentPayload)
        .eq('id', formData.id)
      error = studentError;
    }

    if (error) {
      alert('更新失敗：' + error.message)
    } else {
      alert('更新成功')
      onUpdate(formData)
      setOriginalData(formData)
      setEditMode(false)
    }
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-2xl p-6 w-full max-w-md mx-auto text-[#4B4B4B]">
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          src={formData.gender === 'female' ? '/girl.png' : '/boy.png'}
          alt="頭像"
          className="w-24 h-24 rounded-full"
        />
        <div className="text-xl font-semibold">
          {formData.full_name || '未命名'}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">基本資料</h2>
        {!editMode && !isInactive && (
          <button
            onClick={() => setEditMode(true)}
            className="text-sm text-[#A68A64] hover:underline flex items-center gap-1"
          >
            <img src="/icons/edit-pencil.png" alt="編輯" className="w-4 h-4" /> 編輯
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-3 text-sm">
        {isVisible('student_oid') && (
          <>
            <div className="font-medium">學生編號：</div>
            <div>{student.student_oid || '—'}</div>
          </>
        )}

        {isVisible('full_name') && (
          <>
            <div className="font-medium">姓名：</div>
            <div>
              {editMode && isEditable('full_name') ? (
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  placeholder="請輸入學生姓名"
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
                    onClick={() => setShowGenderSelect(true)}
                    className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  >
                    {tempGender === 'female' ? '女' : tempGender === 'male' ? '男' : '請選擇'}
                  </button>
                  {showGenderSelect && (
                    <PopupSelect
                      title="選擇性別"
                      options={[
                        { label: '男', value: 'male' },
                        { label: '女', value: 'female' }
                      ]}
                      selected={tempGender || ''}
                      onChange={(value) => setTempGender(value as string)}
                      onConfirm={() => {
                        handleChange('gender', tempGender)
                        setShowGenderSelect(false)
                      }}
                      onCancel={() => {
                        setTempGender(formData.gender || '')
                        setShowGenderSelect(false)
                      }}
                      mode="single"
                    />
                  )}
                </>
              ) : (
                formData.gender === 'female' ? '女' : formData.gender === 'male' ? '男' : '—'
              )}
            </div>
          </>
        )}

        {isVisible('birthday') && (
          <>
            <div className="font-medium">年齡：</div>
            <div>
              {editMode && isEditable('student_dob') ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.student_age ? formatAgeDisplay(formData.student_age) : ''}
                    readOnly
                    className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-24 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  />
                  <button
                    onClick={() => {
                      if (formData.student_dob) {
                        const months = calculateAge(formData.student_dob)
                        handleChange('student_age', months)
                        alert('計算成功')
                      } else {
                        alert('請先輸入生日再計算年齡')
                      }
                    }}
                    className="px-3 py-1 bg-[#A68A64] text-white rounded hover:bg-[#91765a] text-sm"
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

        {isVisible('birthday') && (
          <>
            <div className="font-medium">生日：</div>
            <div>
              {editMode && isEditable('student_dob') ? (
                <input
                  type="date"
                  value={formData.student_dob || ''}
                  onChange={(e) => handleChange('student_dob', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                      onClick={() => setShowCourseSelect(true)}
                      className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                    >
                      {tempCourse || '請選擇'}
                    </button>
                    {showCourseSelect && (
                      <PopupSelect
                        title="選擇課程"
                        options={courseOptions.map(c => ({ label: c, value: c }))}
                        selected={tempCourse || ''}
                        onChange={(value) => setTempCourse(value as string)}
                        onConfirm={() => {
                          handleChange('course_type', tempCourse)
                          setShowCourseSelect(false)
                        }}
                        onCancel={() => {
                          setTempCourse(formData.course_type || '')
                          setShowCourseSelect(false)
                        }}
                        mode="single"
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

        {isVisible('type') && (
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
                  type="date"
                  value={formData.lesson_date || ''}
                  onChange={(e) => handleChange('lesson_date', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              ) : (
                formData.lesson_date ? new Date(formData.lesson_date).toLocaleDateString('zh-HK') : '—'
              )}
            </div>
            <div className="font-medium">試堂時間：</div>
            <div>
              {editMode && isEditable('actual_timeslot') ? (
                <input
                  type="time"
                  value={formData.actual_timeslot || ''}
                  onChange={(e) => handleChange('actual_timeslot', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
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
                  type="text"
                  value={formData.school || ''}
                  onChange={(e) => handleChange('school', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              ) : (
                formData.address || '—'
              )}
            </div>
          </>
        )}

        {isVisible('student_teacher') && (
          <>
            <div className="font-medium">負責老師：</div>
            <div>
              {editMode && isEditable('student_teacher') ? (
                <>
                  <button
                    onClick={() => setShowTeacherSelect(true)}
                    className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  >
                    {tempTeacher || formData.student_teacher || '請選擇'}
                  </button>
                  {showTeacherSelect && (
                    <PopupSelect
                      title="選擇負責老師"
                      options={teacherOptions}
                      selected={tempTeacher || formData.student_teacher || ''}
                      onChange={(value) => setTempTeacher(value as string)}
                      onConfirm={() => {
                        handleChange('student_teacher', tempTeacher)
                        setShowTeacherSelect(false)
                      }}
                      onCancel={() => {
                        setTempTeacher(formData.student_teacher || '')
                        setShowTeacherSelect(false)
                      }}
                      mode="single"
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
                  type="text"
                  value={formData.student_preference || ''}
                  onChange={(e) => handleChange('student_preference', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                  value={formData.regular_weekday ?? ''}
                  onChange={(e) => handleChange('regular_weekday', e.target.value)}
                  className="appearance-none border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                  type="text"
                  value={formData.regular_timeslot || ''}
                  onChange={(e) => handleChange('regular_timeslot', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              ) : (
                formData.regular_timeslot || '—'
              )}
            </div>
          </>
        )}

        {isVisible('remaining_lessons') && (
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
                    type="date"
                    value={formData.started_date || ''}
                    onChange={(e) => handleChange('started_date', e.target.value)}
                    className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                  type="text"
                  value={formData.contact_number || ''}
                  onChange={(e) => handleChange('contact_number', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span>{formData.contact_number || '—'}</span>
                  {formData.contact_number && (
                    <>
                      {/* 撥打電話按鈕 */}
                      <button
                        onClick={() => {
                          // 處理電話號碼格式（移除所有非數字字符）
                          const cleanPhoneNumber = formData.contact_number.replace(/\D/g, '')
                          
                          // 如果是香港電話號碼（8位數），加上852區號
                          const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber
                          
                          const telUrl = `tel:${formattedPhoneNumber}`
                          window.open(telUrl, '_blank')
                        }}
                        className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        title="撥打電話"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </button>
                      
                      {/* WhatsApp按鈕 */}
                      <button
                        onClick={() => {
                          // 處理電話號碼格式（移除所有非數字字符）
                          const cleanPhoneNumber = formData.contact_number.replace(/\D/g, '')
                          
                          // 如果是香港電話號碼（8位數），加上852區號
                          const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber
                          
                          const whatsappUrl = `https://wa.me/${formattedPhoneNumber}`
                          window.open(whatsappUrl, '_blank')
                        }}
                        className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        title="開啟WhatsApp"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
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
                  type="email"
                  value={formData.parent_email || ''}
                  onChange={(e) => handleChange('parent_email', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
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
                  type="text"
                  value={formData.health_notes || ''}
                  onChange={(e) => handleChange('health_notes', e.target.value)}
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              ) : (
                formData.health_notes || '—'
              )}
            </div>
          </>
        )}
      </div>

      {editMode && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleSave}
            className="bg-[#A68A64] text-white rounded-full px-5 py-2 text-sm shadow hover:bg-[#91765a] transition"
          >
            儲存
          </button>
          <button
            onClick={handleCancel}
            className="bg-[#F5F2EC] text-[#A68A64] border border-[#D8CDBF] rounded-full px-5 py-2 text-sm shadow hover:bg-[#E6DFD2] transition"
          >
            取消
          </button>
          <button
            onClick={handleUndo}
            className="bg-[#FFF7EE] text-[#A68A64] border border-[#EADBC8] rounded-full px-5 py-2 text-sm shadow hover:bg-[#F2E8DB] transition"
          >
            ↩ Undo
          </button>
        </div>
      )}
    </div>
  )
}
