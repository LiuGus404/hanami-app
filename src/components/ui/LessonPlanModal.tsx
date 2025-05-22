import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { LessonPlan, Teacher } from '@/types';
import { PopupSelect } from '@/components/ui/PopupSelect';

interface LessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonDate: Date;
  timeslot: string;
  courseType: string;
  existingPlan?: LessonPlan;
  onSaved: () => Promise<void>;
  teachers: Teacher[];
}

export default function LessonPlanModal({
  isOpen,
  onClose,
  lessonDate,
  timeslot,
  courseType,
  existingPlan,
  onSaved,
  teachers,
}: LessonPlanModalProps) {
  const [selectedTeacher1, setSelectedTeacher1] = useState<string[]>([]);
  const [selectedTeacher2, setSelectedTeacher2] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (existingPlan) {
      setSelectedTeacher1(existingPlan.teacher_ids_1 || []);
      setSelectedTeacher2(existingPlan.teacher_ids_2 || []);
      setObjectives(Array.isArray(existingPlan.objectives) ? existingPlan.objectives : []);
      setMaterials(Array.isArray(existingPlan.materials) ? existingPlan.materials : []);
      setTheme(existingPlan.theme || '');
      setNotes(existingPlan.notes || '');
    }
  }, [existingPlan]);

  const handleSave = async () => {
    const plan: Omit<LessonPlan, 'id' | 'created_at'> = {
        lesson_date: lessonDate.toISOString().split('T')[0],
        timeslot,
        course_type: courseType,
      topic: '',
      objectives,
      materials,
      teacher_ids: [...selectedTeacher1, ...selectedTeacher2],
      teacher_names: [],
        teacher_ids_1: selectedTeacher1,
        teacher_ids_2: selectedTeacher2,
      teacherNames1: selectedTeacher1.map(id => teachers.find(t => t.id === id)?.teacher_nickname || ''),
      teacherNames2: selectedTeacher2.map(id => teachers.find(t => t.id === id)?.teacher_nickname || ''),
      theme,
      notes,
    };

    if (existingPlan?.id) {
      await supabase
        .from('hanami_lesson_plan')
        .update(plan)
        .eq('id', existingPlan.id);
    } else {
      await supabase
        .from('hanami_lesson_plan')
        .insert([plan]);
    }

    await onSaved();
    onClose();
  };

  const handleObjectivesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObjectives(e.target.value.split('\n').filter(Boolean));
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMaterials(e.target.value.split('\n').filter(Boolean));
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">課堂計劃</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* 老師選擇 */}
          <div>
              <label className="block text-sm font-medium text-gray-700">
                老師（1）
              </label>
              <PopupSelect
                title="老師（1）"
                options={teachers.map(t => ({ label: t.teacher_nickname, value: t.id }))}
                selected={selectedTeacher1}
                onChange={(val) => setSelectedTeacher1(Array.isArray(val) ? val : [val])}
                mode="multi"
              />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700">
                老師（2）
              </label>
              <PopupSelect
                title="老師（2）"
                options={teachers.map(t => ({ label: t.teacher_nickname, value: t.id }))}
                selected={selectedTeacher2}
                onChange={(val) => setSelectedTeacher2(Array.isArray(val) ? val : [val])}
                mode="multi"
              />
            </div>

            {/* 課堂主題 */}
                <div>
              <label className="block text-sm font-medium text-gray-700">
                課堂主題
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
                </div>

            {/* 課堂目標 */}
                <div>
              <label className="block text-sm font-medium text-gray-700">
                課堂目標
              </label>
              <textarea
                value={objectives.join('\n')}
                onChange={handleObjectivesChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* 課堂活動 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                課堂活動
              </label>
              <textarea
                value={materials.join('\n')}
                onChange={handleMaterialsChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
          </div>

            {/* 課堂備註 */}
          <div>
              <label className="block text-sm font-medium text-gray-700">
                課堂備註
              </label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
              onClick={handleSave}
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 