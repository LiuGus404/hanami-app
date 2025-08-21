import { useState, useEffect } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import StudentActivitiesPanel from '@/components/ui/StudentActivitiesPanel';
import { useTeachers } from '@/hooks/useLessonPlans';
import { getSupabaseClient } from '@/lib/supabase';

interface LessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  lessonDate: Date;
  timeslot: string;
  courseType: string;
  existingPlan?: any;
  onSaved?: () => void;
  students?: Array<{
    id: string;
    name: string;
  }>;
}

interface ClassStudent {
  id: string;
  name: string;
  isTrial: boolean;
  age: number | null;
  nickName: string | null;
}

const LessonPlanModal = ({
  open,
  onClose,
  lessonDate,
  timeslot,
  courseType,
  existingPlan,
  onSaved,
  students = [],
}: LessonPlanModalProps) => {
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [materials, setMaterials] = useState<string[]>(['']);
  const [remarks, setRemarks] = useState('');
  const [selectedTeacher1, setSelectedTeacher1] = useState<string[]>([]);
  const [selectedTeacher2, setSelectedTeacher2] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<'main' | 'assist' | null>(null);
  const [tempSelectedTeacher1, setTempSelectedTeacher1] = useState<string[]>([]);
  const [tempSelectedTeacher2, setTempSelectedTeacher2] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const supabase = getSupabaseClient();
  const { teachers, loading } = useTeachers();

  // 獲取課堂學生資料
  const fetchClassStudents = async () => {
    if (!open || !lessonDate || !timeslot || !courseType) return;
    
    setLoadingStudents(true);
    try {
      // 確保日期格式一致，使用香港時區
      const hkDate = new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      console.log('Fetching students for:', { lessonDateStr, timeslot, courseType });
      const response = await fetch(
        `/api/class-students?lessonDate=${lessonDateStr}&timeslot=${timeslot}&courseType=${courseType}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClassStudents(result.data);
          console.log('Fetched class students:', result.data);
        } else {
          console.error('Failed to fetch class students:', result.error);
          setClassStudents([]);
        }
      } else {
        console.error('API error:', response.status);
        setClassStudents([]);
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchClassStudents();
    }
  }, [open, lessonDate, timeslot, courseType]);

  useEffect(() => {
    console.log('existingPlan:', existingPlan);
    if (existingPlan) {
      setTopic(existingPlan.topic || '');
      setObjectives(
        Array.isArray(existingPlan.objectives)
          ? existingPlan.objectives
          : existingPlan.objectives
            ? JSON.parse(existingPlan.objectives)
            : [''],
      );
      setMaterials(
        Array.isArray(existingPlan.materials)
          ? existingPlan.materials
          : existingPlan.materials
            ? JSON.parse(existingPlan.materials)
            : [''],
      );
      setRemarks(existingPlan.remarks || '');
      setSelectedTeacher1(existingPlan.teacher_ids_1 || []);
      setSelectedTeacher2(
        Array.isArray(existingPlan.teacher_ids_2)
          ? existingPlan.teacher_ids_2
          : existingPlan.teacher_ids_2
            ? JSON.parse(existingPlan.teacher_ids_2)
            : [],
      );
    } else {
      setTopic('');
      setObjectives(['']);
      setMaterials(['']);
      setRemarks('');
      setSelectedTeacher1([]);
      setSelectedTeacher2([]);
    }
  }, [existingPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const hkDate = new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      const planData = {
        lesson_date: lessonDateStr,
        timeslot,
        course_type: courseType,
        topic,
        objectives: objectives.filter(obj => obj.trim() !== ''),
        materials: materials.filter(mat => mat.trim() !== ''),
        notes: remarks,
        teacher_ids: selectedTeacher1,
        teacher_ids_1: selectedTeacher1,
        teacher_ids_2: selectedTeacher2,
        teacher_names: (selectedTeacher1 || []).map(id => teachers.find(t => t.id === id)?.name || ''),
        theme: '',
        created_at: new Date().toISOString(),
      };

      console.log('handleSubmit timeslot:', timeslot);
      console.log('planData:', planData);

      if (existingPlan?.id) {
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .update(planData)
          .eq('id', existingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .insert(planData);
        if (error) throw error;
      }

      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleTestFill = () => {
    setTopic('測試主題');
    setObjectives(['目標1', '目標2']);
    setMaterials(['活動1', '活動2']);
    setRemarks('測試備註');
  };

  const addField = (type: 'objectives' | 'materials') => {
    if (type === 'objectives') setObjectives([...objectives, '']);
    else setMaterials([...materials, '']);
  };

  const removeField = (type: 'objectives' | 'materials', index: number) => {
    if (type === 'objectives') setObjectives(objectives.filter((_, i) => i !== index));
    else setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!existingPlan?.id) return;
    if (!window.confirm('確定要刪除這份教案嗎？')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hanami_lesson_plan')
        .delete()
        .eq('id', existingPlan.id);
      if (error) throw error;
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  if (!open) return null;
  if (!lessonDate || !timeslot || !courseType) return;

  // 將老師資料轉換為 PopupSelect 需要的格式
  const teacherOptions = teachers.map(t => ({
    value: t.id,
    label: t.name,
  }));

  console.log('open modal with timeslot:', timeslot);

  const teacherNames1 = (selectedTeacher1 || []).map(id => teachers.find(t => t.id === id)?.name || '');
  const teacherNames2 = (selectedTeacher2 || []).map(id => teachers.find(t => t.id === id)?.name || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-[#FFFDF8] rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8] pointer-events-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#4B4036]">編輯教案</h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
              disabled={saving}
              type="button"
              onClick={handleTestFill}
            >
              測試填入
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EBC9A4] text-[#4B4036] hover:bg-[#f7f3ec]"
              title="刷新老師資料"
              type="button"
              onClick={(e) => {
                const btn = e.currentTarget.querySelector('img');
                if (btn) {
                  btn.classList.add('animate-spin');
                  setTimeout(() => btn.classList.remove('animate-spin'), 1000);
                }
                window.location.reload();
              }}
            >
              <img alt="Refresh" className="w-4 h-4" src="/refresh.png" />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center text-[#4B4036] py-8">老師資料載入中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學主題</label>
                <input
                  className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學目標</label>
                {objectives.map((value, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      className="flex-1 p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                      type="text"
                      value={value}
                      onChange={e => {
                        const updated = [...objectives];
                        updated[index] = e.target.value;
                        setObjectives(updated);
                      }}
                    />
                    <button
                      className="px-2 py-1 text-red-500 hover:text-red-700 rounded"
                      disabled={objectives.length === 1}
                      type="button"
                      onClick={() => removeField('objectives', index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="text-sm text-[#4B4036] underline"
                  type="button"
                  onClick={() => addField('objectives')}
                >
                  ➕ 新增一欄
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學活動</label>
                {materials.map((value, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      className="flex-1 p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                      type="text"
                      value={value}
                      onChange={e => {
                        const updated = [...materials];
                        updated[index] = e.target.value;
                        setMaterials(updated);
                      }}
                    />
                    <button
                      className="px-2 py-1 text-red-500 hover:text-red-700 rounded"
                      disabled={materials.length === 1}
                      type="button"
                      onClick={() => removeField('materials', index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="text-sm text-[#4B4036] underline"
                  type="button"
                  onClick={() => addField('materials')}
                >
                  ➕ 新增一欄
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">老師</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="mr-2">主老師：</span>
                      <button
                        className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                        type="button"
                        onClick={() => {
                          setTempSelectedTeacher1(selectedTeacher1);
                          setShowPopup('main');
                        }}
                      >
                        {selectedTeacher1.length > 0
                          ? teacherNames1.join('、')
                          : '請選擇'}
                      </button>
                    </div>
                    <div>
                      <span className="mr-2">副老師：</span>
                      <button
                        className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                        type="button"
                        onClick={() => {
                          setTempSelectedTeacher2(selectedTeacher2);
                          setShowPopup('assist');
                        }}
                      >
                        {selectedTeacher2.length > 0
                          ? teacherNames2.join('、')
                          : '請選擇'}
                      </button>
                    </div>
                  </div>
                  {teachers.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">無法載入老師資料，請稍後再試</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">備註</label>
                <textarea
                  className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] h-24"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                {existingPlan?.id && (
                  <button
                    className="px-4 py-2 rounded-full border border-red-300 bg-white text-red-600 hover:bg-red-100 transition"
                    disabled={saving}
                    type="button"
                    onClick={handleDelete}
                  >
                    刪除
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
                  disabled={saving}
                  type="button"
                  onClick={onClose}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-[#EBC9A4] text-[#4B4036] hover:bg-[#d0ab7d] transition font-semibold"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>

            {/* 學生活動面板 */}
            <div className="border-l border-[#EADBC8] pl-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#4B4036]">課堂學生活動</h3>
                  <span className="text-sm text-gray-500">
                    {loadingStudents ? '載入中...' : `共 ${classStudents.length} 位學生`}
                  </span>
                </div>
                
                {loadingStudents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
                    <p className="text-sm text-[#4B4036] mt-2">載入學生資料中...</p>
                  </div>
                ) : classStudents.length > 0 ? (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {classStudents.map(student => (
                      <div key={student.id} className="border border-[#EADBC8] rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFF3E0] to-[#FFFDF8] hover:from-[#FFE7C2] hover:to-[#FFF6EE] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-[#4B4036] text-sm font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-[#4B4036]">{student.name}</h4>
                              <p className="text-xs text-[#2B3A3B] opacity-70">
                                {student.isTrial ? '試堂學生' : '常規學生'}
                                {student.age !== null && student.age !== undefined ? ` • ${Math.floor(Number(student.age) / 12)}歲` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            className="px-3 py-1 text-sm rounded bg-[#EBC9A4] text-[#4B4036] hover:bg-[#DDBA90] transition-colors border border-[#EADBC8] shadow-sm"
                            onClick={() => toggleStudentExpanded(student.id)}
                          >
                            {expandedStudents.has(student.id) ? '隱藏活動' : '查看活動'}
                          </button>
                        </div>
                        
                        {expandedStudents.has(student.id) && (
                          <div className="p-4 bg-[#FFFDF8]">
                            <StudentActivitiesPanel
                              studentId={student.id}
                              lessonDate={new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              timeslot={timeslot}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] shadow-sm" />
                    <p className="text-sm text-[#4B4036]">暫無學生資料</p>
                    <p className="text-xs text-[#2B3A3B] opacity-70 mt-1">該時段沒有安排學生</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PopupSelect 彈窗 */}
        {showPopup === 'main' && (
          <PopupSelect
            mode="multi"
            options={teacherOptions}
            selected={tempSelectedTeacher1}
            title="選擇主老師"
            onCancel={() => setShowPopup(null)}
            onChange={val => setTempSelectedTeacher1(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher1(tempSelectedTeacher1);
              setShowPopup(null);
            }}
          />
        )}
        {showPopup === 'assist' && (
          <PopupSelect
            mode="multi"
            options={teacherOptions}
            selected={tempSelectedTeacher2}
            title="選擇副老師"
            onCancel={() => setShowPopup(null)}
            onChange={val => setTempSelectedTeacher2(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher2(tempSelectedTeacher2);
              setShowPopup(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LessonPlanModal; 