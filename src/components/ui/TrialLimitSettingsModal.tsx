'use client';

import Image from 'next/image';
import React, { useState, useEffect, useMemo } from 'react';

import { supabase } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface TrialLimitSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: {[courseTypeId: string]: number}) => void
  currentSettings: {[courseTypeId: string]: number}
}

export default function TrialLimitSettingsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings, 
}: TrialLimitSettingsModalProps) {
  // 從會話中獲取機構信息
  const session = getUserSession();
  const currentOrganization = session?.organization || null;
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) {
      return null;
    }
    return UUID_REGEX.test(currentOrganization.id) ? currentOrganization.id : null;
  }, [currentOrganization?.id]);
  
  const [courseTypes, setCourseTypes] = useState<{[id: string]: { name: string, trial_limit: number }} >({});
  const [settings, setSettings] = useState<{[courseTypeId: string]: number}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCourseTypes();
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings, validOrgId]);

  const loadCourseTypes = async () => {
    try {
      if (!validOrgId) {
        setError('尚未選擇機構，無法載入課程類型');
        setCourseTypes({});
        return;
      }
      
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name, trial_limit')
        .eq('status', true)
        .eq('org_id', validOrgId)
        .order('name');

      if (error) {
        console.error('無法載入課程類型：', error);
        setError(`無法載入課程類型：${error.message}`);
        return;
      }

      const courseTypesMap: {[id: string]: { name: string, trial_limit: number }} = {};
      if (!error && Array.isArray(data)) {
        data.forEach(course => {
          if (!('id' in course)) return;
          const c = course as { id: string; name?: string; trial_limit?: number };
          courseTypesMap[c.id] = {
            name: c.name || c.id,
            trial_limit: c.trial_limit ?? 1,
          };
        });
      }
      setCourseTypes(courseTypesMap);
    } catch (err) {
      console.error('載入課程類型失敗：', err);
      setError('載入課程類型失敗');
    }
  };

  const handleSave = async () => {
    if (!validOrgId) {
      setError('尚未選擇機構，無法保存設定');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // 並行更新所有異動過的課程類型，確保 org_id 被記錄
      await Promise.all(
        Object.entries(settings).map(async ([id, limit]) => {
          const { error } = await supabase
            .from('Hanami_CourseTypes')
            .update({ 
              trial_limit: limit,
              org_id: validOrgId
            })
            .eq('id', id)
            .eq('org_id', validOrgId);
          if (error) throw error;
        }),
      );
      onSave(settings);
      onClose();
    } catch (err: any) {
      console.error('保存設定失敗：', err);
      setError(`保存設定失敗：${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (courseTypeId: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [courseTypeId]: Math.max(0, value), // 確保不為負數
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-[#EADBC8]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#4B4036]">試堂人數設定</h2>
            <Image alt="icon" height={24} src="/rabbit.png" width={24} />
          </div>
          <button
            className="text-[#87704e] hover:text-[#4B4036] transition-colors"
            onClick={onClose}
          >
            <Image alt="關閉" height={20} src="/close.png" width={20} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 text-sm text-[#87704e]">
            設定每個課程類型每堂課最多可容納的試堂學生人數。系統會根據此設定計算有位時間。
          </div>

          <div className="space-y-4">
            {Object.entries(courseTypes).map(([id, info]) => (
              <div key={id} className="flex items-center justify-between p-4 bg-[#FFF8EF] border border-[#EADBC8] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#EADBC8] rounded-full" />
                  <span className="font-medium text-[#4B4036]">{info.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#87704e]">每堂最多試堂人數：</label>
                  <input
                    className="w-16 px-2 py-1 text-center border border-[#EADBC8] rounded bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#EADBC8] focus:border-transparent"
                    max="10"
                    min="0"
                    type="number"
                    value={settings[id] ?? info.trial_limit ?? 1}
                    onChange={(e) => updateSetting(id, parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-[#87704e]">人</span>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(courseTypes).length === 0 && (
            <div className="text-center py-8 text-[#87704e]">
              正在載入課程類型...
            </div>
          )}
        </div>

        {/* 按鈕區域 */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#EADBC8]">
          <button
            className="px-4 py-2 text-[#87704e] border border-[#EADBC8] rounded-lg hover:bg-[#FFF8EF] transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D4C4A8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
            onClick={handleSave}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-[#4B4036] border-t-transparent rounded-full animate-spin" />
            )}
            保存設定
          </button>
        </div>
      </div>
    </div>
  );
} 