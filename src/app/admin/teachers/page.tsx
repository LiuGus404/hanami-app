'use client'

import { useState, useEffect } from 'react'
import PopupSelect from '@/components/ui/PopupSelect'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TeacherCard from '@/components/ui/TeacherCard'
import { LayoutGrid, List } from 'lucide-react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [tempRole, setTempRole] = useState(filterRole)
  const [filterStatus, setFilterStatus] = useState('')
  const [tempStatus, setTempStatus] = useState(filterStatus)
  const [loading, setLoading] = useState(true)
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('*')
      if (!error) setTeachers(data || [])
      setLoading(false)
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('teacher_role', { distinct: true })
        .not('teacher_role', 'is', null)
      if (!error && data) {
        const roleMap = new Map<string, string>()
        data.forEach(r => {
          const raw = r.teacher_role
          const normalized = raw?.trim().toLowerCase()
          if (normalized && !roleMap.has(normalized)) {
            roleMap.set(normalized, raw.trim())
          }
        })
        setRoleOptions(Array.from(roleMap.values()))
      }
    }

    fetchTeachers()
    fetchRoles()
  }, [])

  const filteredTeachers = teachers.filter((teacher) => {
    const nameMatch = teacher.teacher_fullname?.includes(searchTerm.trim()) || teacher.teacher_nickname?.includes(searchTerm.trim())
    const roleMatch = filterRole
      ? teacher.teacher_role?.trim().toLowerCase() === filterRole.trim().toLowerCase()
      : true
    const statusMatch = filterStatus
      ? teacher.teacher_status?.trim().toLowerCase() === filterStatus.trim().toLowerCase()
      : true
    return nameMatch && roleMatch && statusMatch
  })

  // 取得所有狀態選項
  const statusOptions = Array.from(new Set(teachers.map(t => t.teacher_status).filter(Boolean)))

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">老師資料管理</h1>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
              className={`px-4 py-2 rounded-full border bg-white text-[#2B3A3B] border-[#EADBC8]`}
            >
              {displayMode === 'grid' ? (
                <>
                  <List className="w-4 h-4 inline mr-1" /> 列表
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4 inline mr-1" /> 圖卡
                </>
              )}
            </button>
            <div className="flex items-center">
              <button
                onClick={() => {
                  setTempRole(filterRole)
                  setRoleDropdownOpen(true)
                }}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
              >
                選擇職位
              </button>
              {roleDropdownOpen && (
                <PopupSelect
                  title="篩選職位"
                  options={[
                    { label: '全部', value: '' },
                    ...roleOptions.map(role => ({ label: role, value: role })),
                  ]}
                  selected={tempRole}
                  onChange={(value) => setTempRole(value)}
                  onConfirm={() => {
                    setFilterRole(tempRole)
                    setRoleDropdownOpen(false)
                  }}
                  onCancel={() => {
                    setRoleDropdownOpen(false)
                  }}
                  mode="single"
                />
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  setTempStatus(filterStatus)
                  setStatusDropdownOpen(true)
                }}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
              >
                選擇狀態
              </button>
              {statusDropdownOpen && (
                <PopupSelect
                  title="篩選狀態"
                  options={[
                    { label: '全部', value: '' },
                    { label: '全職', value: 'full time' },
                    { label: '兼職', value: 'part time' },
                  ]}
                  selected={tempStatus}
                  onChange={(value) => setTempStatus(value)}
                  onConfirm={() => {
                    setFilterStatus(tempStatus)
                    setStatusDropdownOpen(false)
                  }}
                  onCancel={() => {
                    setStatusDropdownOpen(false)
                  }}
                  mode="single"
                />
              )}
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => router.push('/admin/teachers/teacher-schedule')}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[#EADBC8] bg-white text-[#2B3A3B] shadow-sm hover:bg-[#FFFAF0]"
            >
              <img src="/icons/calendar-schedule.png" alt="排班圖示" className="w-4 h-4" />
              排班管理
            </button>
            <input
              type="text"
              placeholder="搜尋老師姓名或暱稱"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full max-w-xs border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]"
            />
          </div>
        </div>
        {(filterRole || filterStatus) && (
          <div className="text-sm text-[#2B3A3B] mt-2 ml-1 flex items-center gap-4">
            <span>
              已篩選：
              {filterRole && `職位：${filterRole}`} 
              {filterRole && filterStatus && '，'} 
              {filterStatus && `狀態：${filterStatus === 'full time' ? '全職' : '兼職'}`}
            </span>
            <button
              onClick={() => {
                setFilterRole('')
                setTempRole('')
                setFilterStatus('')
                setTempStatus('')
              }}
              className="ml-2 text-[#A68A64] underline hover:text-[#2B3A3B]"
            >
              清除條件
            </button>
          </div>
        )}
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => (
              <motion.div key={teacher.id} className="relative" onClick={() => toggleTeacher(teacher.id)}>
                <TeacherCard
                  name={teacher.teacher_fullname || '—'}
                  nickname={teacher.teacher_nickname || '—'}
                  role={teacher.teacher_role || '—'}
                  status={teacher.teacher_status || '—'}
                  phone={teacher.teacher_phone || '—'}
                  email={teacher.teacher_email || '—'}
                  msalary={teacher.teacher_msalary}
                  onToggle={() => router.push(`/admin/teachers/${teacher.id}`)}
                />
                {selectedTeachers.includes(teacher.id) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-2 right-2"
                  >
                    <img src="/icons/leaf-sprout.png" alt="選取" className="w-12 h-12" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EADBC8] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFFCEB] border-b border-[#EADBC8]">
                  <th className="w-12 p-3 text-left text-sm font-medium text-[#2B3A3B]">
                    <Checkbox
                      checked={selectedTeachers.length === filteredTeachers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeachers(filteredTeachers.map(t => t.id))
                        } else {
                          setSelectedTeachers([])
                        }
                      }}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">姓名</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">暱稱</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">職位</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">狀態</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">電話</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">Email</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">月薪</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">時薪</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center p-6">載入中...</td></tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr><td colSpan={10} className="text-center p-6">沒有符合條件的老師</td></tr>
                ) : filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="border-b border-[#EADBC8] hover:bg-[#FFFCEB] cursor-pointer">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeachers([...selectedTeachers, teacher.id])
                          } else {
                            setSelectedTeachers(selectedTeachers.filter(id => id !== teacher.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_fullname || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_nickname || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_role || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_status || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_phone || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_email || '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_msalary ?? '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">{teacher.teacher_hsalary ?? '—'}</td>
                    <td className="p-3 text-sm text-[#2B3A3B]">
                      <button
                        className="text-[#A68A64] underline hover:text-[#2B3A3B]"
                        onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                      >
                        查看/編輯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}