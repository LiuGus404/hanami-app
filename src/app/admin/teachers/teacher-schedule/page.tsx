// /admin/teacher-schedule/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TeacherSchedulePanel from '@/components/admin/TeacherSchedulePanel'
import { PopupSelect } from '@/components/ui/PopupSelect'

export default function TeacherSchedulePage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('*')
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [tempTeacherId, setTempTeacherId] = useState<string>('*')

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data, error } = await supabase.from('hanami_employee').select('id, teacher_nickname')
        if (error) {
          console.warn('Warning fetching teachers:', error.message)
        } else if (data) {
          setTeachers(data)
        }
      } catch (error) {
        console.warn('Unexpected error fetching teachers:', error)
      }
    }
    fetchTeachers()
  }, [])

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-xl font-bold mb-4">教師排班管理</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">選擇老師：</label>
          <button
            onClick={() => setShowTeacherSelect(true)}
            className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
          >
            {selectedTeacherId === '*' ? '全部老師' : teachers.find(t => t.id === selectedTeacherId)?.teacher_nickname || '請選擇'}
          </button>
          {showTeacherSelect && (
            <PopupSelect
              title="選擇老師"
              options={[
                { label: '全部老師', value: '*' },
                ...teachers.map(t => ({ label: t.teacher_nickname, value: t.id }))
              ]}
              selected={tempTeacherId}
              onChange={(value) => setTempTeacherId(value as string)}
              onConfirm={() => {
                setSelectedTeacherId(tempTeacherId)
                setShowTeacherSelect(false)
              }}
              onCancel={() => {
                setTempTeacherId(selectedTeacherId)
                setShowTeacherSelect(false)
              }}
              mode="single"
            />
          )}
        </div>

        <div className="mt-6">
          <TeacherSchedulePanel
            teacherIds={
              selectedTeacherId === '*'
                ? teachers.map((t) => t.id)
                : [selectedTeacherId]
            }
          />
        </div>
      </div>
    </div>
  )
}
