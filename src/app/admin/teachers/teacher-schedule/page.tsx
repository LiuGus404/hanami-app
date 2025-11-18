// /admin/teacher-schedule/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';

import TeacherSchedulePanel from '@/components/admin/TeacherSchedulePanel';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  'default-org',
  'unassigned-org-placeholder',
]);

export default function TeacherSchedulePage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('*');
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [tempTeacherId, setTempTeacherId] = useState<string>('*');

  // 從會話中獲取機構信息（admin 頁面可能沒有 OrganizationProvider）
  const session = getUserSession();
  const currentOrganization = session?.organization || null;

  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) {
      console.log('🔍 [TeacherSchedule] 沒有 currentOrganization.id');
      return null;
    }
    const isValid = UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id);
    console.log('🔍 [TeacherSchedule] validOrgId 計算:', {
      orgId: currentOrganization.id,
      isValid,
      isPlaceholder: PLACEHOLDER_ORG_IDS.has(currentOrganization.id),
      sessionOrg: currentOrganization
    });
    return isValid ? currentOrganization.id : null;
  }, [currentOrganization?.id]);

  useEffect(() => {
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
  }, [validOrgId]);

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-xl font-bold mb-4">教師排班管理</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">選擇老師：</label>
          <button
            className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
            onClick={() => setShowTeacherSelect(true)}
          >
            {selectedTeacherId === '*' ? '全部老師' : teachers.find(t => t.id === selectedTeacherId)?.teacher_nickname || '請選擇'}
          </button>
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
    </div>
  );
}
