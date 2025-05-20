import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PopupSelect from './PopupSelect'

const weekdays = [
  { label: '星期日', value: 0 },
  { label: '星期一', value: 1 },
  { label: '星期二', value: 2 },
  { label: '星期三', value: 3 },
  { label: '星期四', value: 4 },
  { label: '星期五', value: 5 },
  { label: '星期六', value: 6 },
]

interface Student {
  id: string;
  full_name: string;
  gender: string;
  course_type: string;
  student_type: string;
  regular_weekday?: string | null;
  regular_timeslot?: string;
  student_dob?: string;
  school?: string;
  address?: string;
  student_teacher?: string;
  student_preference?: string;
  remaining_lessons?: number;
  started_date?: string;
  duration_months?: number;
  contact_number?: string;
  parent_email?: string;
  health_notes?: string;
  student_oid?: string;
  trial_date?: string;
  trial_time?: string;
  lesson_date?: string;
  actual_timeslot?: string;
  student_age?: number;
  [key: string]: any; // 添加索引簽名
}

type Props = {
  student: Student;
  onUpdate: (newData: Student) => void;
  visibleFields?: string[];
}

export default function StudentBasicInfo({ student, onUpdate, visibleFields = [] }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Student>(student)
  const [originalData, setOriginalData] = useState<Student>(student)
  const [courseOptions, setCourseOptions] = useState<string[] | null>(null)
  const [showGenderSelect, setShowGenderSelect] = useState(false)
  const [showCourseSelect, setShowCourseSelect] = useState(false)
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [tempGender, setTempGender] = useState<string>('')
  const [tempCourse, setTempCourse] = useState<string>('')
  const [tempTeacher, setTempTeacher] = useState<string>('')

  const [teacherOptions, setTeacherOptions] = useState<{ label: string, value: string }[]>([])
  useEffect(() => {
    supabase.from('hanami_employee').select('teacher_nickname').then(({ data }) => {
      if (data) {
        setTeacherOptions(data.map((item: any) => ({
          label: item.teacher_nickname,
          value: item.teacher_nickname
        })))
      }
    })
  }, [])

  useEffect(() => {
    setTempGender(formData.gender || '')
    setTempCourse(formData.course_type || '')
  }, [formData.gender, formData.course_type])

  useEffect(() => {
    const fetchCourseOptions = async () => {
      setCourseOptions(null) // 標示正在載入中
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('name, status')
        .eq('status', true)

      console.log('📦 課程載入結果：', data, error)

      if (!error && data) {
        setCourseOptions(data.map((c) => c.name).filter((name): name is string => name !== null))
      } else {
        setCourseOptions([]) // 若出錯則設為空陣列避免卡住
      }
    }

    fetchCourseOptions()
  }, [])

  const isVisible = (field: string) => visibleFields.length === 0 || visibleFields.includes(field)

  const isEditable = (field: string) => {
    if (formData.student_type === '試堂') {
      const editableFields = [
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

  const handleChange = (field: keyof Student, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleCancel = () => {
    setFormData(originalData)
    setEditMode(false)
  }

  const handleUndo = () => {
    setFormData(originalData)
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
    const requiredFields = ['full_name', 'gender', 'course_type', 'student_type']
    const missingFields = requiredFields.filter(field => !formData[field])
    
    // 只有常規學生需要填寫固定上課時間
    if (formData.student_type === '常規') {
      if (!formData.regular_weekday) missingFields.push('固定上課星期數')
      if (!formData.regular_timeslot) missingFields.push('固定上課時段')
    }
    
    // 試堂學生需要檢查試堂時間
    if (formData.student_type === '試堂') {
      if (!formData.lesson_date) missingFields.push('試堂日期')
      if (!formData.actual_timeslot) missingFields.push('試堂時間')
    }

    if (missingFields.length > 0) {
      alert(`請填寫以下欄位：${missingFields.join(', ')}`)
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
      const { error: trialError } = await supabase
        .from('hanami_trial_students')
        .update(formData)
        .eq('id', formData.id)
      error = trialError;
    } else {
      const { error: studentError } = await supabase
        .from('Hanami_Students')
        .update(formData)
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
        {!editMode && (
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
            <div>{formData.student_oid || '—'}</div>
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
                      selected={tempGender}
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
                        selected={tempCourse}
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
            <div>{`${formData.remaining_lessons ?? '—'}`}</div>
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
                formData.contact_number || '—'
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
