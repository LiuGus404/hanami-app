'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function DebugAssessmentModePage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [trees, setTrees] = useState<any[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>('');

  // 載入成長樹列表
  const loadTrees = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name')
        .limit(10);

      if (error) throw error;
      setTrees(data || []);
    } catch (error) {
      console.error('載入成長樹失敗:', error);
      setMessage('載入成長樹失敗');
    }
  };

  // 檢查資料庫中的目標資料
  const checkDatabaseGoals = async () => {
    if (!selectedTree) {
      setMessage('請先選擇成長樹');
      return;
    }

    setLoading(true);
    setMessage('檢查資料庫中的目標資料...');
    
    try {
      const { data, error } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', selectedTree)
        .order('goal_order');

      if (error) throw error;

      setDebugResults(prev => [...prev, {
        type: 'database_check',
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }]);

      setMessage(`找到 ${data?.length || 0} 個目標`);
    } catch (error) {
      console.error('檢查資料庫失敗:', error);
      setDebugResults(prev => [...prev, {
        type: 'database_check',
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      }]);
      setMessage(`檢查資料庫失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 模擬 loadExistingGoals 函數
  const simulateLoadExistingGoals = async () => {
    if (!selectedTree) {
      setMessage('請先選擇成長樹');
      return;
    }

    setLoading(true);
    setMessage('模擬 loadExistingGoals 函數...');
    
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', selectedTree)
        .order('goal_order');
      
      if (goalsError) throw goalsError;
      
      const processedGoals = (goalsData || []).map((g: any) => {
        console.log(`loadExistingGoals - 處理目標 ${g.goal_name} 的資料:`, g);
        
        // 確保進度內容是陣列且過濾空值
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        return {
          goal_name: g.goal_name,
          goal_description: g.goal_description || '',
          goal_icon: g.goal_icon || '⭐',
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
          // 添加評估模式欄位
          assessment_mode: g.assessment_mode || 'progress',
          multi_select_levels: Array.isArray(g.multi_select_levels) ? g.multi_select_levels : [],
          multi_select_descriptions: Array.isArray(g.multi_select_descriptions) ? g.multi_select_descriptions : [],
        };
      });

      setDebugResults(prev => [...prev, {
        type: 'load_existing_goals',
        success: true,
        originalData: goalsData,
        processedData: processedGoals,
        timestamp: new Date().toISOString()
      }]);

      setMessage(`處理了 ${processedGoals.length} 個目標`);
    } catch (error) {
      console.error('模擬載入失敗:', error);
      setDebugResults(prev => [...prev, {
        type: 'load_existing_goals',
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      }]);
      setMessage(`模擬載入失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 創建測試目標
  const createTestGoal = async () => {
    if (!selectedTree) {
      setMessage('請先選擇成長樹');
      return;
    }

    setLoading(true);
    setMessage('創建測試目標...');
    
    try {
      const testGoal = {
        tree_id: selectedTree,
        goal_name: '調試測試目標',
        goal_description: '這是一個用於調試的測試目標',
        goal_icon: '🔍',
        goal_order: 999,
        is_achievable: true,
        is_completed: false,
        progress_max: 3,
        required_abilities: [],
        related_activities: [],
        progress_contents: ['步驟1', '步驟2', '步驟3'],
        assessment_mode: 'multi_select',
        multi_select_levels: ['基礎掌握', '熟練運用', '創新應用'],
        multi_select_descriptions: [
          '能夠基本理解並執行',
          '能夠熟練地運用',
          '能夠創新性地應用'
        ]
      };

      const { data, error } = await supabase
        .from('hanami_growth_goals')
        .insert([testGoal])
        .select()
        .single();

      if (error) throw error;

      setDebugResults(prev => [...prev, {
        type: 'create_test_goal',
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }]);

      setMessage('測試目標創建成功！');
    } catch (error) {
      console.error('創建測試目標失敗:', error);
      setDebugResults(prev => [...prev, {
        type: 'create_test_goal',
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      }]);
      setMessage(`創建測試目標失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 清理測試資料
  const cleanupTestData = async () => {
    if (!selectedTree) {
      setMessage('請先選擇成長樹');
      return;
    }

    setLoading(true);
    setMessage('清理測試資料...');
    
    try {
      const { error } = await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', selectedTree)
        .eq('goal_name', '調試測試目標');

      if (error) throw error;

      setDebugResults(prev => [...prev, {
        type: 'cleanup',
        success: true,
        timestamp: new Date().toISOString()
      }]);

      setMessage('測試資料清理完成！');
    } catch (error) {
      console.error('清理失敗:', error);
      setDebugResults(prev => [...prev, {
        type: 'cleanup',
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      }]);
      setMessage(`清理失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrees();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">評估模式調試工具</h1>

      {/* 狀態訊息 */}
      {message && (
        <div className={`p-4 mb-4 rounded-lg ${
          message.includes('成功') || message.includes('完成') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* 選擇成長樹 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
          選擇成長樹
        </label>
        <select
          className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
          value={selectedTree}
          onChange={(e) => setSelectedTree(e.target.value)}
        >
          <option value="">請選擇成長樹</option>
          {trees.map((tree) => (
            <option key={tree.id} value={tree.id}>
              {tree.tree_name || '未命名成長樹'}
            </option>
          ))}
        </select>
      </div>

      {/* 調試按鈕 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HanamiButton
          onClick={checkDatabaseGoals}
          disabled={loading || !selectedTree}
          variant="primary"
        >
          檢查資料庫目標
        </HanamiButton>

        <HanamiButton
          onClick={simulateLoadExistingGoals}
          disabled={loading || !selectedTree}
          variant="cute"
        >
          模擬載入目標
        </HanamiButton>

        <HanamiButton
          onClick={createTestGoal}
          disabled={loading || !selectedTree}
          variant="secondary"
        >
          創建測試目標
        </HanamiButton>

        <HanamiButton
          onClick={cleanupTestData}
          disabled={loading || !selectedTree}
          variant="danger"
        >
          清理測試資料
        </HanamiButton>
      </div>

      {/* 調試結果 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試結果</h2>
        
        {debugResults.length === 0 ? (
          <p className="text-gray-500">還沒有調試結果</p>
        ) : (
          <div className="space-y-4">
            {debugResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.type === 'database_check' && '資料庫檢查'}
                    {result.type === 'load_existing_goals' && '模擬載入目標'}
                    {result.type === 'create_test_goal' && '創建測試目標'}
                    {result.type === 'cleanup' && '清理測試資料'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? '成功' : '失敗'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  時間: {new Date(result.timestamp).toLocaleString()}
                </p>
                
                {result.success && (
                  <div className="text-sm">
                    {result.type === 'database_check' && result.data && (
                      <div>
                        <p><strong>目標數量:</strong> {result.data.length}</p>
                        {result.data.map((goal: any, idx: number) => (
                          <div key={idx} className="mt-2 p-2 bg-gray-100 rounded">
                            <p><strong>目標 {idx + 1}:</strong> {goal.goal_name}</p>
                            <p><strong>評估模式:</strong> {goal.assessment_mode}</p>
                            {goal.assessment_mode === 'multi_select' && (
                              <>
                                <p><strong>多選等級:</strong> {goal.multi_select_levels?.join(', ')}</p>
                                <p><strong>等級描述:</strong> {goal.multi_select_descriptions?.join(', ')}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.type === 'load_existing_goals' && result.processedData && (
                      <div>
                        <p><strong>處理後目標數量:</strong> {result.processedData.length}</p>
                        {result.processedData.map((goal: any, idx: number) => (
                          <div key={idx} className="mt-2 p-2 bg-gray-100 rounded">
                            <p><strong>目標 {idx + 1}:</strong> {goal.goal_name}</p>
                            <p><strong>評估模式:</strong> {goal.assessment_mode}</p>
                            {goal.assessment_mode === 'multi_select' && (
                              <>
                                <p><strong>多選等級:</strong> {goal.multi_select_levels?.join(', ')}</p>
                                <p><strong>等級描述:</strong> {goal.multi_select_descriptions?.join(', ')}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.type === 'create_test_goal' && result.data && (
                      <div>
                        <p><strong>創建的目標:</strong> {result.data.goal_name}</p>
                        <p><strong>評估模式:</strong> {result.data.assessment_mode}</p>
                        {result.data.assessment_mode === 'multi_select' && (
                          <>
                            <p><strong>多選等級:</strong> {result.data.multi_select_levels?.join(', ')}</p>
                            <p><strong>等級描述:</strong> {result.data.multi_select_descriptions?.join(', ')}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!result.success && (
                  <div className="text-sm text-red-600">
                    {result.error?.message || result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </HanamiCard>
    </div>
  );
} 