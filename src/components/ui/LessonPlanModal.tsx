import { useState, useEffect } from 'react';
import { PopupSelect } from '@/components/ui/PopupSelect';
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
}

const LessonPlanModal = ({
  open,
  onClose,
  lessonDate,
  timeslot,
  courseType,
  existingPlan,
  onSaved,
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

  const supabase = getSupabaseClient();
  const { teachers, loading } = useTeachers();

  useEffect(() => {
    console.log('existingPlan:', existingPlan);
    if (existingPlan) {
      setTopic(existingPlan.topic || '');
      setObjectives(
        Array.isArray(existingPlan.objectives)
          ? existingPlan.objectives
          : existingPlan.objectives
            ? JSON.parse(existingPlan.objectives)
            : ['']
      );
      setMaterials(
        Array.isArray(existingPlan.materials)
          ? existingPlan.materials
          : existingPlan.materials
            ? JSON.parse(existingPlan.materials)
            : ['']
      );
      setRemarks(existingPlan.remarks || '');
      setSelectedTeacher1(existingPlan.teacher_ids_1 || []);
      setSelectedTeacher2(
        Array.isArray(existingPlan.teacher_ids_2)
          ? existingPlan.teacher_ids_2
          : existingPlan.teacher_ids_2
            ? JSON.parse(existingPlan.teacher_ids_2)
            : []
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
        timeslot: timeslot,
        course_type: courseType,
        topic: topic,
        objectives: objectives.filter(obj => obj.trim() !== ''),
        materials: materials.filter(mat => mat.trim() !== ''),
        notes: remarks,
        teacher_ids: selectedTeacher1,
        teacher_names: (selectedTeacher1 || []).map(id => teachers.find(t => t.id === id)?.name || ''),
        theme: '',
        created_at: new Date().toISOString()
      };

      console.log('handleSubmit timeslot:', timeslot);
      console.log('planData:', planData);

      if (existingPlan?.id) {
        // Update existing plan
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .update({
            ...planData,
            teacher_ids_1: selectedTeacher1,
            teacher_ids_2: selectedTeacher2,
            remarks: remarks
          })
          .eq('id', existingPlan.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .insert([{
            ...planData,
            teacher_ids_1: selectedTeacher1,
            teacher_ids_2: selectedTeacher2,
            remarks: remarks
          }]);

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
    setObjectives(['測試目標1', '測試目標2']);
    setMaterials(['測試材料1', '測試材料2']);
    setRemarks('測試備註');
    setSelectedTeacher1([]); // 你可以改成預設老師 id 陣列
    setSelectedTeacher2([]); // 你可以改成預設老師 id 陣列
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

  if (!open) return null;
  if (!lessonDate || !timeslot || !courseType) return;

  // 將老師資料轉換為 PopupSelect 需要的格式
  const teacherOptions = teachers.map(t => ({
    value: t.id,
    label: t.name
  }));

  console.log('open modal with timeslot:', timeslot);

  const teacherNames1 = (selectedTeacher1 || []).map(id => teachers.find(t => t.id === id)?.name || '');
  const teacherNames2 = (selectedTeacher2 || []).map(id => teachers.find(t => t.id === id)?.name || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-[#FFFDF8] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8] pointer-events-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#4B4036]">編輯教案</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestFill}
              className="px-3 py-1 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
              disabled={saving}
            >
              測試填入
            </button>
            <button
              type="button"
              onClick={(e) => {
                const btn = e.currentTarget.querySelector('img');
                if (btn) {
                  btn.classList.add('animate-spin');
                  setTimeout(() => btn.classList.remove('animate-spin'), 1000);
                }
                window.location.reload();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EBC9A4] text-[#4B4036] hover:bg-[#f7f3ec]"
              title="刷新老師資料"
            >
              <img src="/refresh.png" alt="Refresh" className="w-4 h-4" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-[#4B4036] py-8">老師資料載入中...</div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學主題</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學目標</label>
            {objectives.map((value, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={value}
                  onChange={e => {
                    const updated = [...objectives];
                    updated[index] = e.target.value;
                    setObjectives(updated);
                  }}
                  className="flex-1 p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                />
                <button
                  type="button"
                  onClick={() => removeField('objectives', index)}
                  className="px-2 py-1 text-red-500 hover:text-red-700 rounded"
                  disabled={objectives.length === 1}
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField('objectives')}
              className="text-sm text-[#4B4036] underline"
            >➕ 新增一欄</button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學活動</label>
            {materials.map((value, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={value}
                  onChange={e => {
                    const updated = [...materials];
                    updated[index] = e.target.value;
                    setMaterials(updated);
                  }}
                  className="flex-1 p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                />
                <button
                  type="button"
                  onClick={() => removeField('materials', index)}
                  className="px-2 py-1 text-red-500 hover:text-red-700 rounded"
                  disabled={materials.length === 1}
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField('materials')}
              className="text-sm text-[#4B4036] underline"
            >➕ 新增一欄</button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#4B4036]">老師</label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <span className="mr-2">主老師：</span>
                  <button
                    type="button"
                    className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
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
                    type="button"
                    className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
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
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] h-24"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {existingPlan?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-full border border-red-300 bg-white text-red-600 hover:bg-red-100 transition"
                disabled={saving}
              >
                刪除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
              disabled={saving}
            >取消</button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#EBC9A4] text-[#4B4036] hover:bg-[#d0ab7d] transition font-semibold"
              disabled={saving}
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
        )}
        {/* PopupSelect 彈窗 */}
        {showPopup === 'main' && (
          <PopupSelect
            title="選擇主老師"
            options={teacherOptions}
            selected={tempSelectedTeacher1}
            onChange={val => setTempSelectedTeacher1(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher1(tempSelectedTeacher1);
              setShowPopup(null);
            }}
            onCancel={() => setShowPopup(null)}
            mode="multi"
          />
        )}
        {showPopup === 'assist' && (
          <PopupSelect
            title="選擇副老師"
            options={teacherOptions}
            selected={tempSelectedTeacher2}
            onChange={val => setTempSelectedTeacher2(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher2(tempSelectedTeacher2);
              setShowPopup(null);
            }}
            onCancel={() => setShowPopup(null)}
            mode="multi"
          />
        )}
      </div>
    </div>
  );
};

export default LessonPlanModal; 