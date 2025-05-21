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
        .select(`
          *,
          Hanami_CourseTypes(*)
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      const formattedLessons: Lesson[] = (data as any[] || [])
        .filter(lesson => lesson && typeof lesson === 'object' && 'id' in lesson && 'lesson_date' in lesson)
        .map(lesson => ({
          id: lesson.id,
          student_id: lesson.student_id || '',
          student_oid: lesson.student_oid ?? null,
          lesson_date: lesson.lesson_date,
          regular_timeslot: lesson.regular_timeslot ?? '',
          actual_timeslot: lesson.actual_timeslot ?? null,
          lesson_status: lesson.lesson_status ?? null,
          course_type: typeof lesson.course_type === 'object' && lesson.course_type ? lesson.course_type.name : (lesson.course_type ?? ''),
          lesson_duration: lesson.lesson_duration ?? null,
          regular_weekday: lesson.regular_weekday !== null && lesson.regular_weekday !== undefined ? Number(lesson.regular_weekday) : null,
          lesson_count: lesson.lesson_count ?? 0,
          remaining_lessons: lesson.remaining_lessons ?? null,
          is_trial: lesson.is_trial ?? false,
          lesson_teacher: lesson.lesson_teacher ?? null,
          package_id: lesson.package_id ?? null,
          status: (['attended','absent','makeup','cancelled','sick_leave','personal_leave'].includes(lesson.status) ? lesson.status : null) as ('attended' | 'absent' | 'makeup' | 'cancelled' | 'sick_leave' | 'personal_leave' | null),
          notes: lesson.notes ?? null,
          next_target: lesson.next_target ?? null,
          progress_notes: lesson.progress_notes ?? null,
          video_url: lesson.video_url ?? null,
          full_name: lesson.full_name ?? '',
          created_at: lesson.created_at ?? null,
          updated_at: lesson.updated_at ?? null,
          access_role: lesson.access_role ?? null,
          remarks: lesson.remarks ?? null,
          lesson_activities: lesson.lesson_activities ?? null
        }));

      setLessons(formattedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('無法載入課堂資料');
    } finally {
      setLoading(false);
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
    setEditingLesson(lesson)
    setIsModalOpen(true)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <PopupSelect
            title="選擇顯示數量"
            options={[
              { label: '5', value: '5' },
              { label: '10', value: '10' },
              { label: '20', value: '20' },
              { label: '全部', value: 'all' }
            ]}
            selected={tempVisibleCount}
            onChange={(value) => {
              if (typeof value === 'string') {
                setTempVisibleCount(value)
              }
            }}
            onConfirm={handleVisibleCountConfirm}
            onCancel={handleVisibleCountCancel}
          />
          <PopupSelect
            title="選擇類別"
            options={[
              { label: '全部', value: 'all' },
              { label: '即將到來', value: 'upcoming' },
              { label: '已過期', value: 'past' },
              { label: '今天', value: 'today' },
              { label: '請假', value: 'sick' },
              { label: '補課', value: 'makeup' },
              { label: '缺席', value: 'absent' }
            ]}
            selected={tempCategoryFilter}
            onChange={(value) => {
              if (Array.isArray(value)) {
                setTempCategoryFilter(value)
              }
            }}
            onConfirm={() => {
              setCategoryFilter(tempCategoryFilter)
              setCategorySelectOpen(false)
            }}
            onCancel={() => {
              setTempCategoryFilter(categoryFilter)
              setCategorySelectOpen(false)
            }}
            mode="multi"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            新增課堂
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              刪除所選
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                選擇
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                課程類別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                老師
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLessons.slice(0, visibleCount).map((lesson) => (
              <tr key={lesson.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selected.includes(lesson.id)}
                    onChange={() => toggleSelect(lesson.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(lesson.lesson_date), 'yyyy-MM-dd')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lesson.actual_timeslot || lesson.regular_timeslot}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {typeof lesson.course_type === 'string' ? lesson.course_type : lesson.course_type?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PopupSelect
                    title="選擇狀態"
                    options={[
                      { label: '已完成', value: 'completed' },
                      { label: '未完成', value: 'pending' },
                      { label: '取消', value: 'cancelled' }
                    ]}
                    selected={lesson.lesson_status || ''}
                    onChange={(value) => {
                      if (typeof value === 'string') {
                        setTempStatus(value)
                      }
                    }}
                    onConfirm={() => setStatusPopupOpen(null)}
                    onCancel={() => setStatusPopupOpen(null)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lesson.lesson_teacher}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(lesson)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <LessonEditorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingLesson(null)
          }}
          lesson={editingLesson}
          onSaved={handleAddLesson}
          teachers={teacherOptions}
        />
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">確認刪除</h3>
            <p className="mb-4">確定要刪除所選的課堂記錄嗎？此操作無法復原。</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
