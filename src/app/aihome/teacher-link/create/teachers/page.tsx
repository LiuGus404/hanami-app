'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, User, Mail, Phone, DollarSign, Filter, X, Link2, RefreshCw, Unlink, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { PopupSelect } from '@/components/ui/PopupSelect';
import BackButton from '@/components/ui/BackButton';
import { supabase } from '@/lib/supabase';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import toast from 'react-hot-toast';
import TeacherManagementNavBar from '@/components/ui/TeacherManagementNavBar';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { useTeachersData } from '@/hooks/useTeachersData';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';

function TeachersContent() {
  const { orgId, organizationResolved } = useTeacherLinkOrganization();
  const { data: teachersData, isLoading, mutate } = useTeachersData(orgId);
  const { teachers, roles: roleOptions } = teachersData;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [tempRole, setTempRole] = useState(filterRole);
  const [filterStatus, setFilterStatus] = useState('');
  const [tempStatus, setTempStatus] = useState(filterStatus);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, any>>({});
  const [syncingTeachers, setSyncingTeachers] = useState<Set<string>>(new Set());
  const router = useRouter();

  // 載入每個老師的鏈接狀態（優化：並行加載）
  useEffect(() => {
    if (!orgId || !organizationResolved || teachers.length === 0) return;

    const loadLinkStatuses = async () => {
      // 並行加載所有老師的鏈接狀態
      const statusPromises = teachers.map(async (teacher) => {
        try {
          const response = await fetch(
            `/api/members/link-teacher?teacherId=${encodeURIComponent(teacher.id)}&orgId=${encodeURIComponent(orgId)}`
          );
          const result = await response.json();
          if (result.success && result.linked) {
            return { id: teacher.id, data: result.data };
          }
          return null;
        } catch (error) {
          console.error(`載入老師 ${teacher.id} 的鏈接狀態失敗:`, error);
          return null;
        }
      });

      const results = await Promise.all(statusPromises);
      const statuses: Record<string, any> = {};
      results.forEach((result) => {
        if (result) {
          statuses[result.id] = result.data;
        }
      });
      setLinkStatuses(statuses);
    };

    loadLinkStatuses();
  }, [teachers, orgId, organizationResolved]);

  // 同步老師資料
  const handleSyncTeacher = async (teacherId: string, direction: 'member_to_teacher' | 'teacher_to_member' | 'bidirectional' = 'bidirectional') => {
    if (!orgId) {
      toast.error('請先選擇機構');
      return;
    }

    setSyncingTeachers(prev => new Set(prev).add(teacherId));
    try {
      const response = await fetch('/api/members/sync-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          direction,
          orgId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || '同步成功');
        // 使用 SWR 的 mutate 重新載入老師資料
        await mutate();
        // 重新載入鏈接狀態
        const statusResponse = await fetch(
          `/api/members/link-teacher?teacherId=${encodeURIComponent(teacherId)}&orgId=${encodeURIComponent(orgId)}`
        );
        const statusResult = await statusResponse.json();
        if (statusResult.success && statusResult.linked) {
          setLinkStatuses(prev => ({
            ...prev,
            [teacherId]: statusResult.data,
          }));
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('同步失敗:', error);
      toast.error(error instanceof Error ? error.message : '同步失敗');
    } finally {
      setSyncingTeachers(prev => {
        const next = new Set(prev);
        next.delete(teacherId);
        return next;
      });
    }
  };

  // 使用 useMemo 优化过滤计算
  const filteredTeachers = useMemo(() => teachers.filter((teacher) => {
    const nameMatch = teacher.teacher_fullname?.includes(searchTerm.trim()) || teacher.teacher_nickname?.includes(searchTerm.trim());
    const roleMatch = filterRole
      ? teacher.teacher_role?.trim().toLowerCase() === filterRole.trim().toLowerCase()
      : true;
    const statusMatch = filterStatus
      ? teacher.teacher_status?.trim().toLowerCase() === filterStatus.trim().toLowerCase()
      : true;
    return nameMatch && roleMatch && statusMatch;
  }), [teachers, searchTerm, filterRole, filterStatus]);

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
        </motion.div>

        {/* 導航欄 */}
        <TeacherManagementNavBar orgId={orgId} />

        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <User className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">老師資料管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            管理機構內所有老師的資料、職位和排班資訊
          </p>
        </motion.div>

        {/* 工具欄 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#EADBC8] mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* 左側：視圖切換和篩選 */}
            <div className="flex flex-wrap gap-3 items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${displayMode === 'grid'
                    ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                    : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white'
                  }`}
              >
                {displayMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4 inline mr-2" /> 列表視圖
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4 inline mr-2" /> 圖卡視圖
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setTempRole(filterRole);
                  setRoleDropdownOpen(true);
                }}
                className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                職位 {filterRole && `: ${filterRole}`}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setTempStatus(filterStatus);
                  setStatusDropdownOpen(true);
                }}
                className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                狀態 {filterStatus && `: ${filterStatus === 'full time' ? '全職' : '兼職'}`}
              </motion.button>
            </div>

            {/* 右側：搜尋和新增按鈕 */}
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A68A64]" />
                <input
                  className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:bg-white transition-all"
                  placeholder="搜尋老師姓名或暱稱"
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/aihome/teacher-link/create/teachers/new')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增老師
              </motion.button>
            </div>
          </div>

          {/* 篩選標籤 */}
          {(filterRole || filterStatus) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap gap-2 items-center"
            >
              <span className="text-sm text-[#2B3A3B]">已篩選：</span>
              {filterRole && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FFD59A]/30 to-[#EBC9A4]/30 text-[#4B4036] rounded-full text-sm border border-[#EADBC8]"
                >
                  職位：{filterRole}
                  <button
                    onClick={() => {
                      setFilterRole('');
                      setTempRole('');
                    }}
                    className="hover:bg-[#FFB6C1]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}
              {filterStatus && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FFD59A]/30 to-[#EBC9A4]/30 text-[#4B4036] rounded-full text-sm border border-[#EADBC8]"
                >
                  狀態：{filterStatus === 'full time' ? '全職' : '兼職'}
                  <button
                    onClick={() => {
                      setFilterStatus('');
                      setTempStatus('');
                    }}
                    className="hover:bg-[#FFB6C1]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}
            </motion.div>
          )}

          {roleDropdownOpen && (
            <PopupSelect
              mode="single"
              options={[
                { label: '全部', value: '' },
                ...roleOptions.map(role => ({ label: role, value: role })),
              ]}
              selected={tempRole}
              title="篩選職位"
              onCancel={() => setRoleDropdownOpen(false)}
              onChange={(value: string | string[]) => setTempRole(Array.isArray(value) ? value[0] : value)}
              onConfirm={() => {
                setFilterRole(tempRole);
                setRoleDropdownOpen(false);
              }}
            />
          )}

          {statusDropdownOpen && (
            <PopupSelect
              mode="single"
              options={[
                { label: '全部', value: '' },
                { label: '全職', value: 'full time' },
                { label: '兼職', value: 'part time' },
              ]}
              selected={tempStatus}
              title="篩選狀態"
              onCancel={() => setStatusDropdownOpen(false)}
              onChange={(value: string | string[]) => setTempStatus(Array.isArray(value) ? value[0] : value)}
              onConfirm={() => {
                setFilterStatus(tempStatus);
                setStatusDropdownOpen(false);
              }}
            />
          )}
        </motion.div>

        {/* 老師列表 */}
        {isLoading ? (
          <CuteLoadingSpinner message="正在載入老師資料..." className="h-full min-h-[400px] p-8" />
        ) : displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTeachers.map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    type: "spring",
                    damping: 20,
                    stiffness: 300
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.03,
                    boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
                  }}
                  className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] cursor-pointer overflow-hidden group"
                  onClick={() => router.push(`/aihome/teacher-link/create/teachers/${teacher.id}`)}
                >
                  {/* 動態背景裝飾 */}
                  <motion.div
                    animate={{
                      background: [
                        "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                        "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                      ]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 rounded-3xl"
                  />

                  {/* 卡片內容 */}
                  <div className="relative z-10">
                    {/* 頭像和基本資訊 */}
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] p-1 shadow-lg">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <img
                              alt="頭像"
                              className="w-full h-full object-cover"
                              src={teacher.teacher_gender === 'female' ? '/girl.png' : '/teacher.png'}
                            />
                          </div>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-sm"
                        />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                          {teacher.teacher_fullname || '未命名'}
                        </h3>
                        <p className="text-[#A68A64] text-sm">{teacher.teacher_nickname || '—'}</p>
                      </div>
                    </div>

                    {/* 職位和狀態標籤 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {teacher.teacher_role && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1 bg-gradient-to-r from-[#FFD59A]/30 to-[#EBC9A4]/30 text-[#4B4036] rounded-full text-xs font-medium border border-[#EADBC8]"
                        >
                          {teacher.teacher_role}
                        </motion.span>
                      )}
                      {teacher.teacher_status && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${teacher.teacher_status === 'full time'
                              ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                              : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
                            }`}
                        >
                          {teacher.teacher_status === 'full time' ? '全職' : '兼職'}
                        </motion.span>
                      )}
                    </div>

                    {/* 聯絡資訊 */}
                    <div className="space-y-2 mb-4">
                      {teacher.teacher_phone && (
                        <div className="flex items-center gap-2 text-sm text-[#2B3A3B]">
                          <Phone className="w-4 h-4 text-[#FFB6C1]" />
                          <span>{teacher.teacher_phone}</span>
                        </div>
                      )}
                      {teacher.teacher_email && (
                        <div className="flex items-center gap-2 text-sm text-[#2B3A3B]">
                          <Mail className="w-4 h-4 text-[#FFD59A]" />
                          <span className="truncate">{teacher.teacher_email}</span>
                        </div>
                      )}
                      {teacher.teacher_msalary && (
                        <div className="flex items-center gap-2 text-sm text-[#2B3A3B]">
                          <DollarSign className="w-4 h-4 text-[#EBC9A4]" />
                          <span>月薪: ${teacher.teacher_msalary}</span>
                        </div>
                      )}
                    </div>

                    {/* 鏈接狀態 */}
                    {linkStatuses[teacher.id] && (
                      <div className="mb-3 p-2 bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 rounded-xl border border-[#FFB6C1]">
                        <div className="flex items-center gap-2 text-xs text-[#4B4036]">
                          <Link2 className="w-3 h-3 text-[#FFB6C1]" />
                          <span className="font-medium">已鏈接到成員</span>
                          {linkStatuses[teacher.id].last_synced_at && (
                            <span className="text-[#A68A64] ml-auto">
                              {new Date(linkStatuses[teacher.id].last_synced_at).toLocaleDateString('zh-TW')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                      {linkStatuses[teacher.id] && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncTeacher(teacher.id);
                          }}
                          disabled={syncingTeachers.has(teacher.id)}
                          className="flex-1 px-3 py-2 bg-white/70 border-2 border-[#FFB6C1] text-[#4B4036] rounded-xl font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {syncingTeachers.has(teacher.id) ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-[#FFB6C1] border-t-transparent rounded-full"
                              />
                              同步中
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              同步
                            </>
                          )}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/aihome/teacher-link/create/teachers/${teacher.id}`);
                        }}
                        className={`${linkStatuses[teacher.id] ? 'flex-1' : 'w-full'} px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all`}
                      >
                        查看詳情
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-b border-[#EADBC8]">
                    <th className="w-12 p-4 text-left">
                      <Checkbox
                        checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeachers(filteredTeachers.map(t => t.id));
                          } else {
                            setSelectedTeachers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">姓名</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">暱稱</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">職位</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">狀態</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">電話</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">Email</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">月薪</th>
                    <th className="p-4 text-left text-sm font-medium text-[#4B4036]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td className="text-center p-8 text-[#2B3A3B]" colSpan={10}>
                        沒有符合條件的老師
                      </td>
                    </tr>
                  ) : filteredTeachers.map((teacher, index) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-[#EADBC8] hover:bg-gradient-to-r hover:from-[#FFF9F2]/50 hover:to-[#FFFDF8]/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeachers([...selectedTeachers, teacher.id]);
                            } else {
                              setSelectedTeachers(selectedTeachers.filter(id => id !== teacher.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4 text-sm text-[#4B4036] font-medium">{teacher.teacher_fullname || '—'}</td>
                      <td className="p-4 text-sm text-[#2B3A3B]">{teacher.teacher_nickname || '—'}</td>
                      <td className="p-4 text-sm text-[#2B3A3B]">{teacher.teacher_role || '—'}</td>
                      <td className="p-4">
                        {teacher.teacher_status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.teacher_status === 'full time'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {teacher.teacher_status === 'full time' ? '全職' : '兼職'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[#2B3A3B]">{teacher.teacher_phone || '—'}</td>
                      <td className="p-4 text-sm text-[#2B3A3B]">{teacher.teacher_email || '—'}</td>
                      <td className="p-4 text-sm text-[#2B3A3B]">{teacher.teacher_msalary ?? '—'}</td>
                      <td className="p-4">
                        {linkStatuses[teacher.id] ? (
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-[#FFB6C1]" />
                            <span className="text-xs text-[#4B4036]">已鏈接</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#A68A64]">未鏈接</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {linkStatuses[teacher.id] && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncTeacher(teacher.id);
                              }}
                              disabled={syncingTeachers.has(teacher.id)}
                              className="px-2 py-1 bg-white/70 border border-[#FFB6C1] text-[#4B4036] rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1"
                              title="同步資料"
                            >
                              {syncingTeachers.has(teacher.id) ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 border-2 border-[#FFB6C1] border-t-transparent rounded-full"
                                />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/aihome/teacher-link/create/teachers/${teacher.id}`)}
                            className="px-3 py-1 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all"
                          >
                            查看/編輯
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TeacherLinkCreateTeachersPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/teachers">
      <WithPermissionCheck pageKey="teachers">
        <TeachersContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}
