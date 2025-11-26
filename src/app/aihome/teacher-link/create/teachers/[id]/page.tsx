'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Briefcase, Edit2, Save, X, ArrowLeft, Link2, RefreshCw } from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { Teacher } from '@/types';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import toast from 'react-hot-toast';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

function translateRole(role: string): string {
  switch (role) {
    case 'full_time':
      return '全職';
    case 'part_time':
      return '兼職';
    case 'admin':
      return '行政';
    case 'teacher':
      return '導師';
    default:
      return role;
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

function TeacherDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const orgContext = useTeacherLinkOrganization();
  const orgId = orgContext?.orgId ?? null;
  const organizationResolved = orgContext?.organizationResolved ?? false;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showStatusSelect, setShowStatusSelect] = useState(false);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [tempRole, setTempRole] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [linkStatus, setLinkStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await (supabase
        .from('hanami_employee') as any)
        .select('teacher_role');
      if (!error && data) {
        const uniqueRoles = Array.from(new Set(
          data.map((r: any) => r.teacher_role?.trim())
            .filter((r: any): r is string => !!r && !['', 'undefined'].includes(r)),
        ));
        setRoleOptions(uniqueRoles.map((r) => ({ label: translateRole(r as string), value: r as string })));
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!organizationResolved || !orgId) return;

    setLoading(true);
    setError(null);
    const fetchTeacher = async () => {
      const { data, error } = await (supabase
        .from('hanami_employee') as any)
        .select('*')
        .eq('id', id as string)
        .eq('org_id', orgId)
        .single();
      if (error) {
        setError('找不到老師資料');
        setLoading(false);
        return;
      }
      const normalized = normalizeTeacher(data);
      setTeacher(normalized);
      setEditData(normalized);
      setLoading(false);
    };
    fetchTeacher();
  }, [id, orgId, organizationResolved]);

  // 載入鏈接狀態
  useEffect(() => {
    if (!orgId || !organizationResolved || !id) return;

    const loadLinkStatus = async () => {
      try {
        const response = await fetch(
          `/api/members/link-teacher?teacherId=${encodeURIComponent(id as string)}&orgId=${encodeURIComponent(orgId)}`
        );
        const result = await response.json();
        if (result.success && result.linked) {
          setLinkStatus(result.data);
        } else {
          setLinkStatus(null);
        }
      } catch (error) {
        console.error('載入鏈接狀態失敗:', error);
      }
    };

    loadLinkStatus();
  }, [id, orgId, organizationResolved]);

  // 同步資料
  const handleSync = async (direction: 'member_to_teacher' | 'teacher_to_member' | 'bidirectional' = 'bidirectional') => {
    if (!orgId || !id) {
      toast.error('缺少必要信息');
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/members/sync-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: id,
          direction,
          orgId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || '同步成功');
        // 重新載入老師資料
        const { data, error } = await (supabase
          .from('hanami_employee') as any)
          .select('*')
          .eq('id', id as string)
          .eq('org_id', orgId)
          .single();
        if (!error && data) {
          const normalized = normalizeTeacher(data);
          setTeacher(normalized);
          setEditData(normalized);
        }
        // 重新載入鏈接狀態
        const statusResponse = await fetch(
          `/api/members/link-teacher?teacherId=${encodeURIComponent(id as string)}&orgId=${encodeURIComponent(orgId)}`
        );
        const statusResult = await statusResponse.json();
        if (statusResult.success && statusResult.linked) {
          setLinkStatus(statusResult.data);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('同步失敗:', error);
      toast.error(error instanceof Error ? error.message : '同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (editMode) {
      setTempRole(editData?.teacher_role || '');
      setTempStatus(editData?.teacher_status || '');
    }
  }, [editMode, editData]);

  const handleChange = (field: keyof Teacher, value: string | number | null) => {
    if (!editData) return;
    const newData = { ...editData };
    (newData as any)[field] = value;
    setEditData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
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

    const { error } = await (supabase
      .from('hanami_employee') as any)
      .update(updateData)
      .eq('id', id as string);
    setSaving(false);
    if (error) {
      alert('儲存失敗');
    } else {
      alert('已儲存');
      setTeacher(editData);
      setEditMode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }
  if (!teacher || !editData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        找不到老師資料
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/aihome/teacher-link/create/teachers')}
            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </motion.button>
        </motion.div>

        {/* 主要卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-8 shadow-xl border-2 border-[#EADBC8] overflow-hidden"
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

          <div className="relative z-10">
            {/* 頭像和標題區域 */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="relative mb-4"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] p-2 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img
                      alt="頭像"
                      className="w-full h-full object-cover"
                      src={editData.teacher_gender === 'female' ? '/girl.png' : '/teacher.png'}
                    />
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-sm"
                />
              </motion.div>
              <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
                {editData.teacher_fullname || '未命名'}
              </h1>
              <p className="text-lg text-[#A68A64] mb-4">{editData.teacher_nickname || '—'}</p>

              {/* 鏈接狀態和操作按鈕 */}
              <div className="flex flex-col items-center gap-3">
                {linkStatus && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 rounded-full border border-[#FFB6C1]"
                  >
                    <Link2 className="w-4 h-4 text-[#FFB6C1]" />
                    <span className="text-sm font-medium text-[#4B4036]">已鏈接到成員</span>
                    {linkStatus.last_synced_at && (
                      <span className="text-xs text-[#A68A64]">
                        {new Date(linkStatus.last_synced_at).toLocaleDateString('zh-TW')}
                      </span>
                    )}
                  </motion.div>
                )}
                <div className="flex gap-2">
                  {!editMode && linkStatus && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={syncing}
                      onClick={() => handleSync()}
                      className="flex items-center gap-2 px-4 py-2 bg-white/70 border-2 border-[#FFB6C1] text-[#4B4036] rounded-xl font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {syncing ? (
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
                          同步資料
                        </>
                      )}
                    </motion.button>
                  )}
                  {!editMode && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      編輯資料
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* 資料表單 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#FFB6C1]" />
                  基本資訊
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">姓名</label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_fullname || ''}
                      onChange={e => handleChange('teacher_fullname', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_fullname || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">暱稱</label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_nickname || ''}
                      onChange={e => handleChange('teacher_nickname', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_nickname || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">職位</label>
                  {editMode ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowRoleSelect(true)}
                        className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] text-left focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      >
                        {editData.teacher_role || '請選擇'}
                      </motion.button>
                      {showRoleSelect && (
                        <PopupSelect
                          mode="single"
                          options={roleOptions}
                          selected={tempRole}
                          title="選擇職位"
                          onCancel={() => {
                            setTempRole(editData.teacher_role || '');
                            setTimeout(() => setShowRoleSelect(false), 0);
                          }}
                          onChange={(value) => setTempRole(value as string)}
                          onConfirm={() => {
                            handleChange('teacher_role', tempRole);
                            setTimeout(() => setShowRoleSelect(false), 0);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_role === 'full_time'
                        ? '全職'
                        : editData.teacher_role === 'part_time'
                          ? '兼職'
                          : translateRole(editData.teacher_role || '—')}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">狀態</label>
                  {editMode ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowStatusSelect(true)}
                        className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] text-left focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      >
                        {editData.teacher_status || '請選擇'}
                      </motion.button>
                      {showStatusSelect && (
                        <PopupSelect
                          mode="single"
                          options={[
                            { label: '全職', value: 'full_time' },
                            { label: '兼職', value: 'part_time' },
                          ]}
                          selected={tempStatus}
                          title="選擇狀態"
                          onCancel={() => {
                            setTempStatus(editData.teacher_status || '');
                            setTimeout(() => setShowStatusSelect(false), 0);
                          }}
                          onChange={(value) => setTempStatus(value as string)}
                          onConfirm={() => {
                            handleChange('teacher_status', tempStatus);
                            setTimeout(() => setShowStatusSelect(false), 0);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_status === 'full_time'
                        ? '全職'
                        : editData.teacher_status === 'part_time'
                          ? '兼職'
                          : '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#FFD59A]" />
                  聯絡資訊
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    電話
                  </label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_phone || ''}
                      onChange={e => handleChange('teacher_phone', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_phone || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_email || ''}
                      onChange={e => handleChange('teacher_email', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_email || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    地址
                  </label>
                  {editMode ? (
                    <input
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_address || ''}
                      onChange={e => handleChange('teacher_address', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_address || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    出生日期
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_dob || ''}
                      onChange={e => handleChange('teacher_dob', e.target.value)}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_dob || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* 薪資資訊 */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#EBC9A4]" />
                  薪資資訊
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">月薪</label>
                  {editMode ? (
                    <input
                      type="number"
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_msalary != null ? String(editData.teacher_msalary) : ''}
                      onChange={e => handleChange('teacher_msalary', e.target.value === '' ? null : Number(e.target.value))}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_msalary ?? '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-2">時薪</label>
                  {editMode ? (
                    <input
                      type="number"
                      className="w-full px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                      value={editData.teacher_hsalary != null ? String(editData.teacher_hsalary) : ''}
                      onChange={e => handleChange('teacher_hsalary', e.target.value === '' ? null : Number(e.target.value))}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/50 rounded-xl text-[#4B4036]">
                      {editData.teacher_hsalary ?? '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            {editMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      儲存
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setEditMode(false); setEditData(teacher); }}
                  className="flex-1 px-6 py-3 bg-white/70 border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium hover:bg-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  取消
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherDetailPage() {
  return (
    <TeacherLinkShell currentPath={`/aihome/teacher-link/create/teachers/[id]`}>
      <WithPermissionCheck pageKey="teachers">
        <TeacherDetailContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}
