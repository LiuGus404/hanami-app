'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

import HanamiButton from '@/components/ui/HanamiButton';
import HanamiCard from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { supabase } from '@/lib/supabase';
import { AbilityLevel } from '@/types/progress';

interface AbilityLevelManagerProps {
  abilityId: string;
  abilityName: string;
  maxLevel: number;
  onClose: () => void;
}

export default function AbilityLevelManager({ 
  abilityId, 
  abilityName, 
  maxLevel, 
  onClose 
}: AbilityLevelManagerProps) {
  const [levels, setLevels] = useState<AbilityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<AbilityLevel | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLevel, setNewLevel] = useState({
    level: 1,
    level_title: '',
    level_description: '',
  });

  useEffect(() => {
    loadLevels();
  }, [abilityId]);

  const loadLevels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hanami_ability_levels')
        .select('*')
        .eq('ability_id', abilityId)
        .order('level');

      if (error) throw error;
      setLevels(data || []);
    } catch (err) {
      console.error('載入等級失敗：', err);
    } finally {
      setLoading(false);
    }
  };

  const createLevel = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_ability_levels')
        .insert([{
          ability_id: abilityId,
          level: newLevel.level,
          level_title: newLevel.level_title,
          level_description: newLevel.level_description,
        }])
        .select()
        .single();

      if (error) throw error;
      setLevels([...levels, data]);
      setShowAddForm(false);
      setNewLevel({ level: 1, level_title: '', level_description: '' });
    } catch (err) {
      console.error('建立等級失敗：', err);
    }
  };

  const updateLevel = async () => {
    if (!editingLevel) return;
    
    try {
      const { data, error } = await supabase
        .from('hanami_ability_levels')
        .update({
          level_title: editingLevel.level_title,
          level_description: editingLevel.level_description,
        })
        .eq('id', editingLevel.id)
        .select()
        .single();

      if (error) throw error;
      setLevels(levels.map(l => l.id === editingLevel.id ? data : l));
      setEditingLevel(null);
    } catch (err) {
      console.error('更新等級失敗：', err);
    }
  };

  const deleteLevel = async (levelId: string) => {
    try {
      const { error } = await supabase
        .from('hanami_ability_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;
      setLevels(levels.filter(l => l.id !== levelId));
    } catch (err) {
      console.error('刪除等級失敗：', err);
    }
  };

  const getAvailableLevels = () => {
    const usedLevels = levels.map(l => l.level);
    return Array.from({ length: maxLevel }, (_, i) => i + 1)
      .filter(level => !usedLevels.includes(level));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFD59A]/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-hanami-text">
            {abilityName} - 等級管理
          </h2>
          <HanamiButton
            variant="secondary"
            onClick={onClose}
          >
            關閉
          </HanamiButton>
        </div>

        {/* 等級列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {levels.map((level) => (
            <HanamiCard key={level.id} className="p-4">
              {editingLevel?.id === level.id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-hanami-text-secondary">
                      等級 {level.level}
                    </span>
                    <div className="flex gap-2">
                      <HanamiButton
                        size="sm"
                        variant="primary"
                        onClick={updateLevel}
                      >
                        儲存
                      </HanamiButton>
                      <HanamiButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingLevel(null)}
                      >
                        取消
                      </HanamiButton>
                    </div>
                  </div>
                  <HanamiInput
                    label="等級標題"
                    value={editingLevel.level_title}
                    onChange={e => setEditingLevel({
                      ...editingLevel,
                      level_title: e.target.value
                    })}
                  />
                  <HanamiInput
                    label="等級描述"
                    value={editingLevel.level_description}
                    onChange={e => setEditingLevel({
                      ...editingLevel,
                      level_description: e.target.value
                    })}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-hanami-text-secondary">
                      等級 {level.level}
                    </span>
                    <div className="flex gap-2">
                      <HanamiButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingLevel(level)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </HanamiButton>
                      <HanamiButton
                        size="sm"
                        variant="danger"
                        onClick={() => deleteLevel(level.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </HanamiButton>
                    </div>
                  </div>
                  <h3 className="font-semibold text-hanami-text mb-1">
                    {level.level_title}
                  </h3>
                  <p className="text-sm text-hanami-text-secondary">
                    {level.level_description}
                  </p>
                </div>
              )}
            </HanamiCard>
          ))}
        </div>

        {/* 新增等級表單 */}
        {showAddForm ? (
          <HanamiCard className="p-4 mb-6">
            <h3 className="font-semibold text-hanami-text mb-4">新增等級</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-hanami-text mb-2">
                    等級
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    value={newLevel.level.toString()}
                    onChange={e => setNewLevel({
                      ...newLevel,
                      level: parseInt(e.target.value)
                    })}
                  >
                    {getAvailableLevels().map(level => (
                      <option key={level} value={level}>
                        等級 {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <HanamiInput
                label="等級標題"
                placeholder="例如：基礎掌握"
                value={newLevel.level_title}
                onChange={e => setNewLevel({
                  ...newLevel,
                  level_title: e.target.value
                })}
              />
              <HanamiInput
                label="等級描述"
                placeholder="描述此等級的具體表現"
                value={newLevel.level_description}
                onChange={e => setNewLevel({
                  ...newLevel,
                  level_description: e.target.value
                })}
              />
              <div className="flex gap-3">
                <HanamiButton
                  variant="primary"
                  onClick={createLevel}
                  disabled={!newLevel.level_title || !newLevel.level_description}
                >
                  新增等級
                </HanamiButton>
                <HanamiButton
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>
        ) : (
          <div className="text-center">
            <HanamiButton
              variant="primary"
              onClick={() => setShowAddForm(true)}
              disabled={getAvailableLevels().length === 0}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              新增等級
            </HanamiButton>
            {getAvailableLevels().length === 0 && (
              <p className="text-sm text-hanami-text-secondary mt-2">
                已達到最高等級數量限制
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 