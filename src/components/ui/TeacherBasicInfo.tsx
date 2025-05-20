import { useState, useEffect } from 'react'
import PopupSelect from '@/components/ui/PopupSelect'
import { supabase } from '@/lib/supabase'

interface Teacher {
  id: string;
  teacher_fullname: string;
  teacher_nickname?: string;
  teacher_gender?: 'male' | 'female';
  teacher_role?: string;
  teacher_status?: string;
  teacher_phone?: string;
  teacher_email?: string;
  teacher_msalary?: number;
  teacher_hsalary?: number;
  [key: string]: any;
}

type Props = {
  teacher: Teacher;
  onUpdate: (newData: Teacher) => void;
}

export default function TeacherBasicInfo({ teacher, onUpdate }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Teacher>(teacher)
  const [originalData, setOriginalData] = useState<Teacher>(teacher)
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [showStatusSelect, setShowStatusSelect] = useState(false)

  const handleChange = (field: keyof Teacher, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('hanami_employee')
      .update(formData)
      .eq('id', formData.id)

    if (error) {
      alert('儲存失敗：' + error.message)
    } else {
      alert('已成功儲存')
      setEditMode(false)
      onUpdate(formData)
      setOriginalData(formData)
    }
  }

  const handleCancel = () => {
    setFormData(originalData)
    setEditMode(false)
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-2xl p-6 w-full max-w-md mx-auto text-[#4B4B4B]">
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          src={formData.teacher_gender === 'female' ? '/girl.png' : '/teacher.png'}
          alt="頭像"
          className="w-24 h-24 rounded-full"
        />
        <div className="text-xl font-semibold">
          {formData.teacher_fullname || '未命名'}
        </div>
        <div className="text-[#A68A64]">{formData.teacher_nickname || '—'}</div>
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
        <div className="font-medium">職位：</div>
        <div>
          {editMode ? (
            <>
              <button
                onClick={() => setShowRoleSelect(true)}
                className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2"
              >
                {formData.teacher_role || '請選擇'}
              </button>
              {showRoleSelect && (
                <PopupSelect
                  title="選擇職位"
                  options={[
                    { label: '主任', value: '主任' },
                    { label: '導師', value: '導師' },
                    { label: '助教', value: '助教' },
                  ]}
                  selected={formData.teacher_role || ''}
                  onChange={(value) => handleChange('teacher_role', value)}
                  onConfirm={() => setShowRoleSelect(false)}
                  onCancel={() => setShowRoleSelect(false)}
                  mode="single"
                />
              )}
            </>
          ) : (
            formData.teacher_role || '—'
          )}
        </div>

        <div className="font-medium">狀態：</div>
        <div>
          {editMode ? (
            <>
              <button
                onClick={() => setShowStatusSelect(true)}
                className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2"
              >
                {formData.teacher_status || '請選擇'}
              </button>
              {showStatusSelect && (
                <PopupSelect
                  title="選擇狀態"
                  options={[
                    { label: '在職', value: '在職' },
                    { label: '離職', value: '離職' }
                  ]}
                  selected={formData.teacher_status || ''}
                  onChange={(value) => handleChange('teacher_status', value)}
                  onConfirm={() => setShowStatusSelect(false)}
                  onCancel={() => setShowStatusSelect(false)}
                  mode="single"
                />
              )}
            </>
          ) : (
            formData.teacher_status || '—'
          )}
        </div>

        <div className="font-medium">電話：</div>
        <div>
          {editMode ? (
            <input
              type="text"
              value={formData.teacher_phone || ''}
              onChange={(e) => handleChange('teacher_phone', e.target.value)}
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full"
            />
          ) : (
            formData.teacher_phone || '—'
          )}
        </div>

        <div className="font-medium">Email：</div>
        <div>
          {editMode ? (
            <input
              type="email"
              value={formData.teacher_email || ''}
              onChange={(e) => handleChange('teacher_email', e.target.value)}
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full"
            />
          ) : (
            formData.teacher_email || '—'
          )}
        </div>

        <div className="font-medium">月薪：</div>
        <div>
          {editMode ? (
            <input
              type="number"
              value={formData.teacher_msalary ?? ''}
              onChange={(e) => handleChange('teacher_msalary', e.target.value ? Number(e.target.value) : null)}
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full"
            />
          ) : (
            formData.teacher_msalary != null ? `$${formData.teacher_msalary}` : '—'
          )}
        </div>

        <div className="font-medium">時薪：</div>
        <div>
          {editMode ? (
            <input
              type="number"
              value={formData.teacher_hsalary ?? ''}
              onChange={(e) => handleChange('teacher_hsalary', e.target.value ? Number(e.target.value) : null)}
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full"
            />
          ) : (
            formData.teacher_hsalary != null ? `$${formData.teacher_hsalary}` : '—'
          )}
        </div>
      </div>

      {editMode && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleSave}
            className="bg-[#A68A64] text-white rounded-full px-5 py-2 text-sm shadow hover:bg-[#91765a]"
          >
            儲存
          </button>
          <button
            onClick={handleCancel}
            className="bg-[#F5F2EC] text-[#A68A64] border border-[#D8CDBF] rounded-full px-5 py-2 text-sm shadow hover:bg-[#E6DFD2]"
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
