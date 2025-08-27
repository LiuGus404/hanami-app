'use client';

import { useState } from 'react';

export default function DebugAssessmentRecordPage() {
  const [assessmentId, setAssessmentId] = useState('453c4ad3-38b3-44f1-803b-a9b08c197ce1');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAssessmentRecord = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debug-assessment-record?id=${assessmentId}`);
      const data = await response.json();
      setResult(data);
      console.log('評估記錄分析結果:', data);
    } catch (error) {
      console.error('檢查評估記錄失敗:', error);
      setResult({ error: '檢查失敗' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">評估記錄資料庫分析</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">檢查評估記錄</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              評估記錄 ID
            </label>
            <input
              type="text"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入評估記錄 ID"
            />
          </div>
          
          <button
            onClick={checkAssessmentRecord}
            disabled={loading || !assessmentId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '檢查中...' : '檢查評估記錄'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">分析結果</h2>
          
          {result.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">基本資訊</h3>
                  <p>評估記錄存在: {result.analysis.assessment_exists ? '✅' : '❌'}</p>
                  <p>學生ID: {result.analysis.student_id}</p>
                  <p>成長樹ID: {result.analysis.tree_id}</p>
                  <p>評估日期: {result.analysis.assessment_date}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">資料庫欄位</h3>
                  <p>總欄位數: {result.analysis.all_fields.length}</p>
                  <p>欄位: {result.analysis.all_fields.join(', ')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">selected_goals 分析</h3>
                  <p>類型: {result.analysis.selected_goals.type}</p>
                  <p>是否為陣列: {result.analysis.selected_goals.is_array ? '✅' : '❌'}</p>
                  <p>長度: {result.analysis.selected_goals.length}</p>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                    <strong>內容:</strong>
                    <pre>{JSON.stringify(result.analysis.selected_goals.content, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">ability_assessments 分析</h3>
                  <p>類型: {result.analysis.ability_assessments.type}</p>
                  <p>是否為物件: {result.analysis.ability_assessments.is_object ? '✅' : '❌'}</p>
                  <p>鍵值數量: {result.analysis.ability_assessments.keys.length}</p>
                  <p>鍵值: {result.analysis.ability_assessments.keys.join(', ')}</p>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                    <strong>內容:</strong>
                    <pre>{JSON.stringify(result.analysis.ability_assessments.content, null, 2)}</pre>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">完整記錄</h3>
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm max-h-60 overflow-y-auto">
                  <pre>{JSON.stringify(result.analysis.raw_record, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              <p>錯誤: {result.error}</p>
              {result.details && <p>詳情: {result.details}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
