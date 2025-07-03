'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PopupSelect } from '@/components/ui/PopupSelect'
import { Teacher } from '@/types'
import BackButton from '@/components/ui/BackButton'

function translateRole(role: string): string {
  switch (role) {
    case 'full_time':
      return '全職'
    case 'part_time':
      return '兼職'
    case 'admin':
      return '行政'
    case 'teacher':
      return '導師'
    default:
      return role
  }
}

function normalizeTeacher(data: any): Teacher {
  return {
    id: data.id,
    teacher_fullname: data.teacher_fullname ?? '',
    teacher_nickname: data.teacher_nickname ?? '',
    teacher_role: data.teacher_role ?? null,
    teacher_status: data.teacher_status ?? null,
    teacher_email: data.teacher_email ?? null,
    teacher_phone: data.teacher_phone ?? null,
    teacher_address: data.teacher_address ?? null,
    teacher_gender: data.teacher_gender ?? null,
    teacher_dob: data.teacher_dob ?? null,
    teacher_hsalary: typeof data.teacher_hsalary === 'number' ? data.teacher_hsalary : null,
    teacher_msalary: typeof data.teacher_msalary === 'number' ? data.teacher_msalary : null,
    teacher_background: data.teacher_background ?? null,
    teacher_bankid: data.teacher_bankid ?? null,
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null,
  };
}

export default function TeacherDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editData, setEditData] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [showStatusSelect, setShowStatusSelect] = useState(false)
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([])
  const [tempRole, setTempRole] = useState('')
  const [tempStatus, setTempStatus] = useState('')

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('teacher_role')
      if (!error && data) {
        const uniqueRoles = Array.from(new Set(
          data.map((r) => r.teacher_role?.trim())
              .filter((r): r is string => !!r && !['', 'undefined'].includes(r))
        ))
        setRoleOptions(uniqueRoles.map((r) => ({ label: translateRole(r), value: r })))
      }
    }
    fetchRoles()
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetchTeacher = async () => {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('id', id as string)
        .single()
      if (error) {
        setError('找不到老師資料')
        setLoading(false)
        return
      }
      const normalized = normalizeTeacher(data);
      setTeacher(normalized);
      setEditData(normalized);
      setLoading(false)
    }
    fetchTeacher()
  }, [id])

  useEffect(() => {
    if (editMode) {
      setTempRole(editData?.teacher_role || '')
      setTempStatus(editData?.teacher_status || '')
    }
  }, [editMode])

  const handleChange = (field: keyof Teacher, value: string | number | null) => {
    if (!editData) return;
    const newData = { ...editData };
    (newData as any)[field] = value;
    setEditData(newData);
  }

  const handleSave = async () => {
    setSaving(true)
    if (!editData) return;
    const allowedFields = [
      'teacher_fullname',
      'teacher_nickname',
      'teacher_role',
      'teacher_status',
      'teacher_email',
      'teacher_phone',
      'teacher_address',
      'teacher_dob',
      'teacher_hsalary',
      'teacher_msalary',
      'teacher_background',
      'teacher_bankid',
    ];

    const updateData: any = {};
    allowedFields.forEach((key) => {
      let value = (editData as any)[key];
      if (typeof value === 'string' && value.trim() === '') value = null;
      if ((key === 'teacher_hsalary' || key === 'teacher_msalary') && value !== null && value !== undefined) {
        value = Number(value);
        if (isNaN(value)) value = null;
      }
      updateData[key] = value;
    });

    const { error } = await supabase
      .from('hanami_employee')
      .update(updateData)
      .eq('id', id as string)
    setSaving(false)
    if (error) {
      alert('儲存失敗')
    } else {
      alert('已儲存')
      setTeacher(editData)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
  }
  if (!teacher || !editData) {
    return <div className="flex items-center justify-center min-h-screen">找不到老師資料</div>
  }

  return (
    <div className="min-h-screen bg-[#FFFCF2] p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#EADBC8] p-8 shadow">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img
            src={editData.teacher_gender === 'female' ? '/girl.png' : '/teacher.png'}
            alt="頭像"
            className="w-24 h-24 rounded-full border border-[#EADBC8]"
          />
          <div className="text-xl font-semibold">{editData.teacher_fullname || '未命名'}</div>
          <div className="text-[#A68A64]">{editData.teacher_nickname || '—'}</div>
        </div>
        <div className="flex justify-between items-center mb-4">
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
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-1">
            <span>姓名</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" value={editData.teacher_fullname || ''} onChange={e => handleChange('teacher_fullname', e.target.value)} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_fullname || '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>暱稱</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" value={editData.teacher_nickname || ''} onChange={e => handleChange('teacher_nickname', e.target.value)} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_nickname || '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>職位</span>
            {editMode ? (
              <>
                <button
                  onClick={() => setShowRoleSelect(true)}
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                >
                  {editData.teacher_role || '請選擇'}
                </button>
                {showRoleSelect && (
                  <PopupSelect
                    title="選擇職位"
                    options={roleOptions}
                    selected={tempRole}
                    onChange={(value) => setTempRole(value as string)}
                    onConfirm={() => {
                      handleChange('teacher_role', tempRole);
                      setTimeout(() => setShowRoleSelect(false), 0);
                    }}
                    onCancel={() => {
                      setTempRole(editData.teacher_role || '');
                      setTimeout(() => setShowRoleSelect(false), 0);
                    }}
                    mode="single"
                  />
                )}
              </>
            ) : (
              <div className="px-3 py-2">
                {editData.teacher_role === 'full_time'
                  ? '全職'
                  : editData.teacher_role === 'part_time'
                  ? '兼職'
                  : translateRole(editData.teacher_role || '—')}
              </div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>狀態</span>
            {editMode ? (
              <>
                <button
                  onClick={() => setShowStatusSelect(true)}
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                >
                  {editData.teacher_status || '請選擇'}
                </button>
                {showStatusSelect && (
                  <PopupSelect
                    title="選擇狀態"
                    options={[
                      { label: '全職', value: 'full_time' },
                      { label: '兼職', value: 'part_time' },
                    ]}
                    selected={tempStatus}
                    onChange={(value) => setTempStatus(value as string)}
                    onConfirm={() => {
                      handleChange('teacher_status', tempStatus);
                      setTimeout(() => setShowStatusSelect(false), 0);
                    }}
                    onCancel={() => {
                      setTempStatus(editData.teacher_status || '');
                      setTimeout(() => setShowStatusSelect(false), 0);
                    }}
                    mode="single"
                  />
                )}
              </>
            ) : (
              <div className="px-3 py-2">{editData.teacher_status === 'full_time'
                ? '全職'
                : editData.teacher_status === 'part_time'
                ? '兼職'
                : '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>電話</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" value={editData.teacher_phone || ''} onChange={e => handleChange('teacher_phone', e.target.value)} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_phone || '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>Email</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" value={editData.teacher_email || ''} onChange={e => handleChange('teacher_email', e.target.value)} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_email || '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>月薪</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" type="number" value={editData.teacher_msalary != null ? String(editData.teacher_msalary) : ''} onChange={e => handleChange('teacher_msalary', e.target.value === '' ? null : Number(e.target.value))} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_msalary ?? '—'}</div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span>時薪</span>
            {editMode ? (
              <input className="border rounded px-3 py-2" type="number" value={editData.teacher_hsalary != null ? String(editData.teacher_hsalary) : ''} onChange={e => handleChange('teacher_hsalary', e.target.value === '' ? null : Number(e.target.value))} />
            ) : (
              <div className="px-3 py-2">{editData.teacher_hsalary ?? '—'}</div>
            )}
          </label>
        </div>
        <div className="mt-8 flex gap-4">
          {editMode ? (
            <>
              <button
                className="bg-[#FCD58B] text-[#2B3A3B] px-6 py-2 rounded-full font-bold hover:bg-[#ffe6a7]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
              <button
                className="bg-gray-200 text-[#2B3A3B] px-6 py-2 rounded-full font-bold hover:bg-gray-300"
                onClick={() => { setEditMode(false); setEditData(teacher) }}
              >
                取消
              </button>
            </>
          ) : (
            <button
              className="bg-gray-200 text-[#2B3A3B] px-6 py-2 rounded-full font-bold hover:bg-gray-300"
              onClick={() => router.push('/admin/teachers')}
            >
              返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}