import { v4 as uuidv4 } from 'uuid'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { format } from 'date-fns'
import LessonEditorModal from '@/components/ui/LessonEditorModal'
import Image from 'next/image'
import { PopupSelect } from '@/components/ui/PopupSelect'
import { Lesson, CourseType } from '@/types'
import { toast } from 'react-hot-toast'

interface StudentLessonPanelProps {
  studentId: string;
}

interface LessonData {
  id: string;
  student_id: string;
  course_type: string | CourseType | null;
  lesson_count: number;
  remaining_lessons: number | null;
  is_trial: boolean;
  lesson_duration: string | null;
  regular_weekday: number | null;
  lesson_teacher: string | null;
  regular_timeslot: string | null;
  student_oid: string | null;
  lesson_date: string;
  actual_timeslot: string | null;
  lesson_status: string | null;
  full_name: string;
  student_age: number | null;
  package_id: string | null;
  status: string | null;
  notes: string | null;
  next_target: string | null;
  progress_notes: string | null;
  video_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  access_role: string | null;
  remarks: string | null;
}

export default function StudentLessonPanel({ studentId }: StudentLessonPanelProps) {
  const supabase = getSupabaseClient()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState<number>(5)
  const [visibleCountSelectOpen, setVisibleCountSelectOpen] = useState(false)
  const [tempVisibleCount, setTempVisibleCount] = useState<string>('5')
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all'])
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string[]>(['all'])
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null)
  const [tempStatus, setTempStatus] = useState<string>('')
  const [form, setForm] = useState<Partial<Lesson>>({})
  const [showCourseTypeSelect, setShowCourseTypeSelect] = useState(false)
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [courseTypeOptions, setCourseTypeOptions] = useState<{ label: string; value: string }[]>([])
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLessons()
  }, [studentId])

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false });
      if (error) throw error;
      // Ensure all required fields for Lesson
      setLessons((data || []).map((item: Record<string, unknown>) => ({
        lesson_count: typeof item.lesson_count === 'number' ? item.lesson_count : 1,
        remaining_lessons: typeof item.remaining_lessons === 'number' ? item.remaining_lessons : 0,
        is_trial: typeof item.is_trial === 'boolean' ? item.is_trial : false,
        ...item
      }) as Lesson));
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error:', err.message);
        alert('載入課堂資料失敗：' + err.message);
      } else {
        console.error('Unknown error:', err);
        alert('載入課堂資料失敗：未知錯誤');
      }
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('hanami_student_lesson')
        .delete()
        .in('id', selected);

      if (error) {
        console.error('刪除課堂記錄失敗：', error);
        toast.error('刪除課堂記錄失敗，請稍後再試');
        return;
      }

      toast.success('課堂記錄已成功刪除');
      setSelected([]);
      await fetchLessons();
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('刪除課堂記錄時發生錯誤：', err);
      toast.error('刪除課堂記錄失敗，請稍後再試');
    }
  };

  const handleEdit = (lesson: Lesson) => {
    handleStatusPopupClose();
    setEditingLesson(lesson);
    setIsModalOpen(true);
  }

  const handleVisibleCountConfirm = () => {
    let parsed: number
    if (tempVisibleCount === 'all') {
      parsed = lessons.length
    } else {
      parsed = parseInt(tempVisibleCount)
      if (isNaN(parsed) || parsed < 1) {
        parsed = 5
      }
    }
    setVisibleCount(parsed)
    setVisibleCountSelectOpen(false)
  }

  const handleVisibleCountCancel = () => {
    setTempVisibleCount(visibleCount >= lessons.length ? 'all' : String(visibleCount))
    setVisibleCountSelectOpen(false)
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filteredLessons = lessons.filter((lesson) => {
    if (categoryFilter.includes('all')) return true

    const lessonDateStr = format(new Date(lesson.lesson_date), 'yyyy-MM-dd')
    const dateMatches =
      (categoryFilter.includes('upcoming') && lessonDateStr >= todayStr) ||
      (categoryFilter.includes('past') && lessonDateStr < todayStr) ||
      (categoryFilter.includes('today') && lessonDateStr === todayStr)

    const statusMatches =
      (categoryFilter.includes('sick') && lesson.lesson_status === '請假') ||
      (categoryFilter.includes('makeup') && lesson.lesson_status === '補課') ||
      (categoryFilter.includes('absent') && lesson.lesson_status === '缺席')

    return dateMatches || statusMatches
  })

  // 欄位整理工具，僅保留允許的欄位
  const filterLessonData = (data: Partial<Lesson>): Lesson => {
    const allowedKeys = [
      'id',
      'student_id',
      'package_id',
      'lesson_date',
      'regular_timeslot',
      'actual_timeslot',
      'lesson_status',
      'status',
      'course_type',
      'lesson_duration',
      'regular_weekday',
      'full_name',
      'lesson_teacher',
      'notes',
      'progress_notes',
      'next_target',
      'video_url',
      'remarks',
      'created_at',
      'updated_at',
      'access_role',
      'student_oid',
      'lesson_count',
      'remaining_lessons',
      'is_trial'
    ];
    const filtered: any = {};
    allowedKeys.forEach((key) => {
      filtered[key] = (data as any)[key] ?? (key === 'student_id' || key === 'course_type' ? '' : null);
    });
    return filtered as Lesson;
  };

  // 新增/更新課堂處理函式
  const handleAddLesson = async (newLesson: Lesson) => {
    // 1. 從 Supabase 取得學生資料
    let studentData = null;
    try {
      const { data } = await supabase
        .from('Hanami_Students')
        .select('student_oid, regular_weekday, full_name')
        .eq('id', newLesson.student_id)
        .single();
      studentData = data;
    } catch (e) {
      // 可視情況處理錯誤
      studentData = null;
    }

    const lessonId = editingLesson ? editingLesson.id : uuidv4();
    const resolvedCourseType =
      typeof newLesson.course_type === 'object' && newLesson.course_type
        ? newLesson.course_type.name
        : newLesson.course_type || '';

    // 自動設置 lesson_duration
    const autoLessonDuration =
      resolvedCourseType === '鋼琴'
        ? '00:45:00'
        : resolvedCourseType === '音樂專注力'
        ? '01:00:00'
        : null;

    // 只在 newLesson 沒有提供時才用 studentData/自動推算
    const dbLessonData = {
      id: lessonId,
      student_id: newLesson.student_id,
      package_id: newLesson.package_id || null,
      lesson_date: newLesson.lesson_date,
      regular_timeslot: newLesson.regular_timeslot ?? '',
      actual_timeslot: newLesson.actual_timeslot || null,
      lesson_status: newLesson.lesson_status || null,
      status: (newLesson.status && ['attended','absent','makeup','cancelled','sick_leave','personal_leave'].includes(newLesson.status)
        ? newLesson.status 
        : null) as ('attended' | 'absent' | 'makeup' | 'cancelled' | 'sick_leave' | 'personal_leave' | null),
      course_type: resolvedCourseType,
      lesson_duration: newLesson.lesson_duration || autoLessonDuration,
      regular_weekday: newLesson.regular_weekday !== null && newLesson.regular_weekday !== undefined ? String(newLesson.regular_weekday) : (studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null),
      full_name: newLesson.full_name || studentData?.full_name || '未設定',
      lesson_teacher: newLesson.lesson_teacher || null,
      notes: newLesson.notes || '',
      progress_notes: newLesson.progress_notes || null,
      next_target: newLesson.next_target || '',
      video_url: newLesson.video_url || null,
      created_at: editingLesson?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      access_role: 'admin',
      student_oid: newLesson.student_oid || studentData?.student_oid || studentId,
      lesson_count: newLesson.lesson_count ?? 0,
      remaining_lessons: newLesson.remaining_lessons ?? null,
      is_trial: newLesson.is_trial ?? false
    };

    const requiredFields = ['student_id', 'lesson_date', 'course_type', 'regular_timeslot', 'regular_weekday', 'lesson_teacher'] as const;
    const missingFields = requiredFields.filter(field => !(field in dbLessonData) || !dbLessonData[field]);

    if (missingFields.length > 0) {
      toast.error(`請填寫必填欄位：${missingFields.join(', ')}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hanami_student_lesson')
        .upsert([dbLessonData], { onConflict: 'id' });

    if (error) {
        console.error('Error saving lesson:', error);
        toast.error('儲存失敗');
        return;
      }

      if (data) {
        toast.success('儲存成功');
      await fetchLessons();
      setIsModalOpen(false);
      setEditingLesson(null);
    }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('儲存失敗');
    }
  }

  // Add a function to handle status button click
  const handleStatusClick = (lessonId: string, currentStatus: string | null) => {
    if (isModalOpen) return; // Don't show status popup if modal is open
    setTempStatus(currentStatus || '');
    setStatusPopupOpen(lessonId);
  }

  // Add a function to handle status popup close
  const handleStatusPopupClose = () => {
    setStatusPopupOpen(null);
    setTempStatus('');
  }

  const handleStatusChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setTempStatus(value);
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      handleStatusPopupClose();
    }
  }, [isModalOpen]);

  return (
    <div className="w-full px-4">
      <div className="bg-[#FFFDF8] p-6 rounded-xl shadow-inner max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#4B4036]">課堂情況</h2>
          <div className="flex items-center gap-3">
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => {
                fetchLessons();
                alert('刷新成功');
              }}
            >
              刷新
            </button>
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => setCategorySelectOpen(true)}
            >
              類別
            </button>
            {categorySelectOpen && (
              <PopupSelect
                title="類別"
                options={[
                  { label: '全部', value: 'all' },
                  { label: '未上課堂', value: 'upcoming' },
                  { label: '過往課堂', value: 'past' },
                  { label: '今日課堂', value: 'today' },
                  { label: '請假', value: 'sick' },
                  { label: '補課', value: 'makeup' },
                  { label: '缺席', value: 'absent' }
                ]}
                selected={tempCategoryFilter}
                onChange={(selected) => {
                  if (selected.length === 0 || selected.includes('all')) {
                    setTempCategoryFilter(['all'])
                  } else {
                    setTempCategoryFilter(selected as string[])
                  }
                }}
                onCancel={() => {
                  setTempCategoryFilter(categoryFilter)
                  setCategorySelectOpen(false)
                }}
                onConfirm={() => {
                  setCategoryFilter(tempCategoryFilter)
                  setCategorySelectOpen(false)
                }}
                mode="multi"
              />
            )}
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => setVisibleCountSelectOpen(true)}
            >
              顯示筆數：{visibleCount === lessons.length ? '全部' : visibleCount}
            </button>
            {visibleCountSelectOpen && (
              <PopupSelect
                title="顯示筆數"
                options={[
                  { label: '5 筆', value: '5' },
                  { label: '10 筆', value: '10' },
                  { label: '15 筆', value: '15' },
                  { label: '20 筆', value: '20' },
                  { label: '全部', value: 'all' },
                ]}
                selected={tempVisibleCount}
                onChange={(selected) => {
                  if (typeof selected === 'string') {
                    setTempVisibleCount(selected)
                  } else if (Array.isArray(selected) && selected.length > 0) {
                    setTempVisibleCount(String(selected[0]))
                  }
                }}
                onCancel={handleVisibleCountCancel}
                onConfirm={handleVisibleCountConfirm}
                mode="multi"
              />
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[#4B4036]">
            <thead>
              <tr className="border-b border-[#E9E2D6]">
                <th>
                  <input
                    type="checkbox"
                    className="form-checkbox w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(filteredLessons.slice(0, visibleCount).map(l => l.id))
                      else setSelected([])
                    }}
                  />
                </th>
                <th className="text-[15px] font-medium px-2 py-2 text-left">日期</th>
                <th className="text-[15px] font-medium px-2 py-2 text-left">課堂</th>
                <th className="text-[15px] font-medium px-2 py-2 text-left">上課時間</th>
                <th className="text-[15px] font-medium px-2 py-2 text-left">負責老師</th>
                <th className="text-[15px] font-medium px-2 py-2 text-left">出席狀況</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.slice(0, visibleCount).map((lesson) => (
                <tr key={lesson.id} className="border-b border-[#F3EAD9] hover:bg-[#FFF8E6]">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      className="form-checkbox w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                      checked={selected.includes(lesson.id)}
                      onChange={() => toggleSelect(lesson.id)}
                    />
                  </td>
                  <td className="text-[15px] font-medium px-2 py-2">{format(new Date(lesson.lesson_date), 'yyyy/MM/dd')}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{typeof lesson.course_type === 'string' ? lesson.course_type : ''}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{lesson.actual_timeslot || lesson.regular_timeslot}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{lesson.lesson_teacher}</td>
                  <td className="text-[15px] font-medium px-2 py-2">
                    {format(new Date(lesson.lesson_date), 'yyyy-MM-dd') === todayStr ? (
                      <>
                        <button
                          className="underline text-sm"
                          onClick={() => handleStatusClick(lesson.id, lesson.lesson_status)}
                        >
                          {lesson.lesson_status || '-'}
                        </button>
                        {statusPopupOpen === lesson.id && !isModalOpen && (
                          <PopupSelect
                            title="選擇出席狀況"
                            options={[
                              { label: '出席', value: '出席' },
                              { label: '缺席', value: '缺席' },
                              { label: '病假', value: '病假' },
                              { label: '事假', value: '事假' }
                            ]}
                            selected={tempStatus}
                            onChange={handleStatusChange}
                            onCancel={handleStatusPopupClose}
                            onConfirm={async () => {
                              await supabase
                                .from('hanami_student_lesson')
                                .update({ lesson_status: tempStatus })
                                .eq('id', lesson.id);
                              await fetchLessons();
                              handleStatusPopupClose();
                            }}
                            mode="multi"
                          />
                        )}
                      </>
                    ) : format(new Date(lesson.lesson_date), 'yyyy-MM-dd') > todayStr ? (
                      '-'
                    ) : (
                      lesson.lesson_status || '-'
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => handleEdit(lesson)}
                      className="text-[#4B4036] underline underline-offset-2 hover:text-[#7A6A52] text-sm"
                    >
                      編輯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              setEditingLesson(null);
              setIsModalOpen(true);
            }}
            className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
          >
            新增課堂
          </button>
          {selected.length > 0 && (
            <>
              <button
                onClick={() => {
                  setSelected([])
                  const checkbox = document.querySelector<HTMLInputElement>('th input[type="checkbox"]')
                  if (checkbox) checkbox.checked = false
                }}
                className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
              >
                清除選擇
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
              >
                刪除
              </button>
            </>
          )}
        </div>
        <LessonEditorModal
          open={isModalOpen}
          onClose={() => {
            setStatusPopupOpen(null);
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          lesson={editingLesson}
          studentId={studentId}
          onSaved={() => {
            fetchLessons()
          }}
          mode={editingLesson ? 'edit' : 'add'}
        />
        {isDeleteConfirmOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-white/80 z-50"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <div
              className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[#4B4036] text-base mb-4">確定要刪除選取的課堂記錄嗎？</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 text-sm rounded-full bg-[#F0ECE1] text-[#4B4036] hover:ring-1 hover:ring-[#CBBFA4]"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setIsDeleteConfirmOpen(false);
                    await confirmDelete();
                  }}
                  className="px-4 py-2 text-sm rounded-full bg-[#FBEAE5] text-[#4B4036] hover:ring-1 hover:ring-[#CBBFA4]"
                >
                  確定刪除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
