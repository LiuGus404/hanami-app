import { v4 as uuidv4 } from 'uuid'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { format } from 'date-fns'
import LessonEditorModal from '@/components/ui/LessonEditorModal'
import Image from 'next/image'
import PopupSelect from '@/components/ui/PopupSelect'

export default function StudentLessonPanel({ studentId }: { studentId: string }) {
  const supabase = getSupabaseClient()
  const [lessons, setLessons] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [editingLesson, setEditingLesson] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState<number>(5)
  const [visibleCountSelectOpen, setVisibleCountSelectOpen] = useState(false)
  const [tempVisibleCount, setTempVisibleCount] = useState<string>('5')
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all'])
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string[]>(['all'])
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  // 新增 PopupSelect 狀態
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<string>('');

  useEffect(() => {
    fetchLessons()
  }, [studentId])

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('student_id', studentId)
      .order('lesson_date', { ascending: false });

    if (data) {
      setLessons(data);
      // alert('刷新成功'); // 移除
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
        alert('刪除課堂記錄失敗，請稍後再試');
        return;
      }

      alert('課堂記錄已成功刪除');
      setSelected([]);
      await fetchLessons();
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('刪除課堂記錄時發生錯誤：', err);
      alert('刪除課堂記錄失敗，請稍後再試');
    }
  };

  const handleEdit = (lesson: any) => {
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
  const filterLessonData = (data: any) => {
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
    ];
    const filtered: any = {};
    allowedKeys.forEach((key) => {
      if (key in data) {
        filtered[key] = data[key];
      }
    });
    return filtered;
  };

  // 新增/更新課堂處理函式
  const handleAddLesson = async (newLesson: any) => {
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
      typeof newLesson.course_type === 'object'
        ? newLesson.course_type.name
        : newLesson.course_type;

    // 自動設置 lesson_duration
    const autoLessonDuration =
      resolvedCourseType === '鋼琴'
        ? '00:45:00'
        : resolvedCourseType === '音樂專注力'
        ? '01:00:00'
        : null;

    // 只在 newLesson 沒有提供時才用 studentData/自動推算
    const lessonData = {
      id: lessonId,
      student_id: newLesson.student_id,
      package_id: newLesson.package_id || null,
      lesson_date: newLesson.lesson_date,
      regular_timeslot: newLesson.regular_timeslot,
      actual_timeslot: newLesson.actual_timeslot || null,
      lesson_status: newLesson.lesson_status || '未設定',
      status: newLesson.status || '',
      course_type: resolvedCourseType,
      lesson_duration:
        newLesson.lesson_duration ||
        autoLessonDuration,
      regular_weekday:
        newLesson.regular_weekday ||
        studentData?.regular_weekday ||
        '未設定',
      full_name:
        newLesson.full_name ||
        studentData?.full_name ||
        '未設定',
      lesson_teacher: newLesson.lesson_teacher || null,
      notes: newLesson.notes || '',
      progress_notes: newLesson.progress_notes || null,
      next_target: newLesson.next_target || '',
      video_url: newLesson.video_url || null,
      created_at: editingLesson?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      access_role: 'admin',
      student_oid:
        newLesson.student_oid ||
        studentData?.student_oid ||
        studentId,
    };

    const requiredFields = ['student_id', 'lesson_date', 'course_type', 'regular_timeslot', 'regular_weekday', 'lesson_teacher'];
    const missingFields = requiredFields.filter(field => !lessonData[field]);

    if (missingFields.length > 0) {
      alert('請填寫以下必填欄目：\n' + missingFields.join('、'));
      return;
    }

    // 確保只傳送存在於資料庫 schema 中的欄位
    const cleanLessonData = filterLessonData(lessonData);

    const { data, error } = await supabase.from('hanami_student_lesson').upsert([cleanLessonData], { onConflict: ['id'] });
    console.log('Supabase response:', data, error);
    if (error) {
      console.error('Supabase 新增/更新失敗：', error);
      if (error.code === '23505') {
        alert('新增課堂記錄失敗：已存在相同課堂，請勿重複輸入！');
      } else {
        alert(
          '新增課堂記錄失敗\n錯誤代碼：' +
            (error.code || '未知') +
            '\n訊息：' +
            (error.message || JSON.stringify(error))
        );
      }
    } else {
      // 如果 data 是陣列且有多筆，顯示所有成功新增/更新的堂數、日期與時間
      if (Array.isArray(data) && data.length > 0) {
        // 多筆時逐筆顯示成功訊息
        if (data.length > 1) {
          data.forEach(d => {
            alert(
              '課堂已成功新增或更新！\n' +
              '日期：' + d.lesson_date + '\n' +
              '時間：' + (d.actual_timeslot || d.regular_timeslot)
            );
          });
        } else {
          const d = data[0];
          alert(
            '課堂已成功新增或更新！\n' +
            '日期：' + d.lesson_date + '\n' +
            '時間：' + (d.actual_timeslot || d.regular_timeslot)
          );
        }
      }
      await fetchLessons();
      setIsModalOpen(false);
      setEditingLesson(null);
    }
  };

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
                  setTempCategoryFilter(selected)
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
              mode="multiple"
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
              mode="single"
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
                <td className="text-[15px] font-medium px-2 py-2">{lesson.course_type}</td>
                <td className="text-[15px] font-medium px-2 py-2">{lesson.actual_timeslot || lesson.regular_timeslot}</td>
                <td className="text-[15px] font-medium px-2 py-2">{lesson.lesson_teacher}</td>
                <td className="text-[15px] font-medium px-2 py-2">
                  {format(new Date(lesson.lesson_date), 'yyyy-MM-dd') === todayStr ? (
                    <>
                      <button
                        className="underline text-sm"
                        onClick={() => {
                          setTempStatus(lesson.lesson_status || '');
                          setStatusPopupOpen(lesson.id);
                        }}
                      >
                        {lesson.lesson_status || '-'}
                      </button>
                      {statusPopupOpen === lesson.id && (
                        <PopupSelect
                          title="選擇出席狀況"
                          options={[
                            { label: '出席', value: '出席' },
                            { label: '缺席', value: '缺席' },
                            { label: '病假', value: '病假' },
                            { label: '事假', value: '事假' }
                          ]}
                          selected={tempStatus}
                          onChange={setTempStatus}
                          onCancel={() => setStatusPopupOpen(null)}
                          onConfirm={async () => {
                            await supabase
                              .from('hanami_student_lesson')
                              .update({ lesson_status: tempStatus })
                              .eq('id', lesson.id);
                            await fetchLessons();
                            setStatusPopupOpen(null);
                          }}
                          mode="single"
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
          onClick={() => setIsModalOpen(true)}
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
      {/* <button
        onClick={() =>
          handleAddLesson({
            student_id: studentId,
            package_id: null,
            lesson_date: '2025-05-10',
            regular_timeslot: '14:00',
            actual_timeslot: '14:05',
            lesson_status: '出席',
            status: 'attended',
            course_type: '鋼琴',
            lesson_duration: '45',
            regular_weekday: 'Sat',
            full_name: '測試學生',
            lesson_teacher: '測試老師',
            notes: '這是測試用的課堂',
            progress_notes: '練習完成',
            next_target: '練習新曲目',
            video_url: '',
            student_oid: 'test1234',
          })
        }
        className="rounded-full px-6 py-2 bg-red-200 text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
      >
        測試新增課堂
      </button> */}

      <LessonEditorModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
        }}
        lesson={editingLesson}
        studentId={studentId}
        onSaved={async (updatedLesson) => {
          // 直接呼叫 handleAddLesson 並刷新列表
          if (updatedLesson) {
            // 支援多筆新增，逐筆顯示成功訊息
            if (Array.isArray(updatedLesson)) {
              for (const singleLesson of updatedLesson) {
                await handleAddLesson(singleLesson);
              }
            } else {
              await handleAddLesson(updatedLesson);
            }
            // fetchLessons() 會在 handleAddLesson 內呼叫
          }
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
