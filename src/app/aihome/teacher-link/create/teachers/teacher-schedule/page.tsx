// /aihome/teacher-link/create/teachers/teacher-schedule/page.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, ArrowLeft } from 'lucide-react';

import TeacherSchedulePanel from '@/components/admin/TeacherSchedulePanel';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import TeacherManagementNavBar from '@/components/ui/TeacherManagementNavBar';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  'default-org',
  'unassigned-org-placeholder',
]);

function TeacherScheduleContent() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('*');
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [tempTeacherId, setTempTeacherId] = useState<string>('*');

  // 使用 TeacherLinkShell 提供的機構信息
  const { orgId, organization, organizationResolved } = useTeacherLinkOrganization();

  const validOrgId = useMemo(() => {
    // 優先使用 orgId，如果沒有則使用 organization.id
    const resolvedOrgId = orgId || (organization?.id && UUID_REGEX.test(organization.id) ? organization.id : null);
    
    if (!resolvedOrgId) {
      console.log('🔍 [TeacherSchedule] 沒有有效的 orgId');
      return null;
    }
    
    const isValid = UUID_REGEX.test(resolvedOrgId) && !PLACEHOLDER_ORG_IDS.has(resolvedOrgId);
    console.log('🔍 [TeacherSchedule] validOrgId 計算:', {
      orgId: resolvedOrgId,
      isValid,
      isPlaceholder: PLACEHOLDER_ORG_IDS.has(resolvedOrgId),
      organizationResolved
    });
    return isValid ? resolvedOrgId : null;
  }, [orgId, organization?.id, organizationResolved]);

  useEffect(() => {
    // 等待機構信息解析完成後再查詢
    if (!organizationResolved) {
      console.log('⏳ [TeacherSchedule] 等待機構信息解析...');
      return;
    }

    const fetchTeachers = async () => {
      try {
        let teacherQuery = supabase
          .from('hanami_employee')
          .select('id, teacher_nickname');

        // 根據 org_id 過濾老師
        if (validOrgId) {
          teacherQuery = teacherQuery.eq('org_id', validOrgId);
          console.log('✅ [TeacherSchedule] 老師查詢已添加 org_id 過濾:', validOrgId);
        } else {
          // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
          teacherQuery = teacherQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
          console.warn('⚠️ [TeacherSchedule] validOrgId 為 null，老師查詢將返回空結果');
        }

        const { data, error } = await teacherQuery;
        if (error) {
          console.warn('Warning fetching teachers:', error.message);
        } else if (data) {
          console.log('📊 [TeacherSchedule] 載入的老師數量:', data.length, 'validOrgId:', validOrgId);
          console.log('📊 [TeacherSchedule] 載入的老師列表:', data.map((t: any) => ({ id: t.id, name: t.teacher_nickname })));
          setTeachers(data);
        } else {
          console.log('📊 [TeacherSchedule] 沒有載入到任何老師，validOrgId:', validOrgId);
        }
      } catch (error) {
        console.warn('Unexpected error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, [validOrgId, organizationResolved]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/aihome/teacher-link/create')}
            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理面板
          </motion.button>
        </motion.div>

        {/* 導航欄 */}
        <TeacherManagementNavBar orgId={orgId} />

        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Calendar className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">教師排班管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            管理老師的排班時間和課程安排
          </p>
        </motion.div>

        {/* 主要內容卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
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
            {/* 老師選擇 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4B4036] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#FFB6C1]" />
                選擇老師
              </label>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTeacherSelect(true)}
                className="w-full text-left px-4 py-3 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]"
              >
                {selectedTeacherId === '*' ? '全部老師' : teachers.find(t => t.id === selectedTeacherId)?.teacher_nickname || '請選擇'}
              </motion.button>
              {showTeacherSelect && (
                <PopupSelect
                  mode="single"
                  options={[
                    { label: '全部老師', value: '*' },
                    ...teachers.map(t => ({ label: t.teacher_nickname, value: t.id })),
                  ]}
                  selected={tempTeacherId}
                  title="選擇老師"
                  onCancel={() => {
                    setTempTeacherId(selectedTeacherId);
                    setShowTeacherSelect(false);
                  }}
                  onChange={(value) => setTempTeacherId(value as string)}
                  onConfirm={() => {
                    setSelectedTeacherId(tempTeacherId);
                    setShowTeacherSelect(false);
                  }}
                />
              )}
            </div>

            {/* 排班面板 */}
            <div className="mt-6">
              <TeacherSchedulePanel
                teacherIds={
                  selectedTeacherId === '*'
                    ? teachers.map((t) => t.id)
                    : [selectedTeacherId]
                }
                orgId={validOrgId}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherSchedulePage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/teachers/teacher-schedule">
      <TeacherScheduleContent />
    </TeacherLinkShell>
  );
}

