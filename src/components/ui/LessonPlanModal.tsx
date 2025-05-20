import { useState, useEffect } from 'react';
import { useLessonPlans, LessonPlan } from '@/hooks/useLessonPlans';
import PopupSelect from '@/components/ui/PopupSelect';

type LessonPlanModalProps = {
  open: boolean;
  onClose: () => void;
  lessonDate: Date;
  timeslot: string;
  courseType: string;
  existingPlan?: LessonPlan;
  onSaved?: () => void;
  teachers: { id: string; name: string }[];
};

const LessonPlanModal = ({
  open,
  onClose,
  lessonDate,
  timeslot,
  courseType,
  existingPlan,
  onSaved,
  teachers,
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
  const { upsertPlan } = useLessonPlans();

  useEffect(() => {
    if (existingPlan) {
      setTopic(existingPlan.topic || '');
      setObjectives(existingPlan.objectives?.length > 0 ? existingPlan.objectives : ['']);
      setMaterials(existingPlan.materials?.length > 0 ? existingPlan.materials : ['']);
      setRemarks(existingPlan.remarks || '');
      setSelectedTeacher1(existingPlan.teacher_ids_1 || []);
      setSelectedTeacher2(existingPlan.teacher_ids_2 || []);
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
    try {
      await upsertPlan({
        ...(existingPlan ? { id: existingPlan.id } : {}),
        lesson_date: lessonDate.toISOString().split('T')[0],
        timeslot,
        course_type: courseType,
        topic,
        objectives: objectives.filter(Boolean),
        materials: materials.filter(Boolean),
        teacher_ids_1: selectedTeacher1,
        teacher_ids_2: selectedTeacher2,
        remarks,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      alert('儲存教案時發生錯誤');
    }
  };

  const addField = (type: 'objectives' | 'materials') => {
    if (type === 'objectives') {
      setObjectives([...objectives, '']);
    } else {
      setMaterials([...materials, '']);
    }
  };

  const removeField = (type: 'objectives' | 'materials', index: number) => {
    if (type === 'objectives') {
      setObjectives(objectives.filter((_, i) => i !== index));
    } else {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border pointer-events-auto"
        style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translate(-50%, 0)' }}
      >
        <h2 className="text-xl font-bold mb-4">編輯教案</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">教學主題</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">教學目標</label>
            {objectives.map((value, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const updated = [...objectives];
                    updated[index] = e.target.value;
                    setObjectives(updated);
                  }}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => removeField('objectives', index)}
                  className="px-2 py-1 text-red-500 hover:text-red-700"
                  disabled={objectives.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField('objectives')}
              className="text-sm text-[#4B4036] underline"
            >
              ➕ 新增一欄
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">教學活動</label>
            {materials.map((value, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const updated = [...materials];
                    updated[index] = e.target.value;
                    setMaterials(updated);
                  }}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => removeField('materials', index)}
                  className="px-2 py-1 text-red-500 hover:text-red-700"
                  disabled={materials.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField('materials')}
              className="text-sm text-[#4B4036] underline"
            >
              ➕ 新增一欄
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">老師</label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <span className="mr-2">老師(1)：</span>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded"
                    onClick={() => {
                      setTempSelectedTeacher1(selectedTeacher1);
                      setShowPopup('main');
                    }}
                  >
                    {selectedTeacher1.length > 0
                      ? teachers.filter(t => selectedTeacher1.includes(t.id)).map(t => t.name).join('、')
                      : '請選擇'}
                  </button>
                </div>
                <div>
                  <span className="mr-2">老師(2)：</span>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded"
                    onClick={() => {
                      setTempSelectedTeacher2(selectedTeacher2);
                      setShowPopup('assist');
                    }}
                  >
                    {selectedTeacher2.length > 0
                      ? teachers.filter(t => selectedTeacher2.includes(t.id)).map(t => t.name).join('、')
                      : '請選擇'}
                  </button>
                </div>
              </div>
              {teachers.length === 0 && (
                <div className="text-sm text-red-500 mt-1">
                  無法載入老師資料，請稍後再試
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">備註</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2 border rounded h-24"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#EBC9A4] text-[#4B4036] hover:bg-[#d0ab7d] transition font-semibold"
            >
              儲存
            </button>
          </div>
        </form>
        {/* PopupSelect 彈窗 */}
        {showPopup === 'main' && (
          <PopupSelect
            title="選擇主老師"
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
            selected={tempSelectedTeacher1}
            onChange={(val) => setTempSelectedTeacher1(Array.isArray(val) ? val : [val])}
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
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
            selected={tempSelectedTeacher2}
            onChange={(val) => setTempSelectedTeacher2(Array.isArray(val) ? val : [val])}
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