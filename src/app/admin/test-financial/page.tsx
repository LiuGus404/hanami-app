'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestFinancialPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFinancialTable = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // 測試 1: 檢查表是否存在
      addTestResult('開始測試財務支出表...');
      
      const { data: tableExists, error: tableError } = await supabase
        .from('hanami_financial_expenses')
        .select('id')
        .limit(1);
      
      if (tableError) {
        addTestResult(`❌ 表不存在或無法訪問: ${tableError.message}`);
        return;
      }
      
      addTestResult('✅ 財務支出表存在且可訪問');

      // 測試 2: 插入測試數據
      addTestResult('測試插入支出記錄...');
      
      const testExpense = {
        expense_date: new Date().toISOString().slice(0, 10),
        expense_category: '測試支出',
        expense_description: '這是一筆測試支出記錄',
        amount: 100.50,
        payment_method: '現金',
        notes: '測試用途'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('hanami_financial_expenses')
        .insert(testExpense)
        .select()
        .single();

      if (insertError) {
        addTestResult(`❌ 插入失敗: ${insertError.message}`);
        return;
      }

      addTestResult(`✅ 成功插入測試支出記錄，ID: ${insertData.id}`);

      // 測試 3: 查詢數據
      addTestResult('測試查詢支出記錄...');
      
      const { data: queryData, error: queryError } = await supabase
        .from('hanami_financial_expenses')
        .select('*')
        .eq('expense_category', '測試支出')
        .order('created_at', { ascending: false });

      if (queryError) {
        addTestResult(`❌ 查詢失敗: ${queryError.message}`);
        return;
      }

      addTestResult(`✅ 成功查詢到 ${queryData.length} 筆測試記錄`);

      // 測試 4: 刪除測試數據
      addTestResult('清理測試數據...');
      
      const { error: deleteError } = await supabase
        .from('hanami_financial_expenses')
        .delete()
        .eq('expense_category', '測試支出');

      if (deleteError) {
        addTestResult(`❌ 刪除失敗: ${deleteError.message}`);
        return;
      }

      addTestResult('✅ 成功清理測試數據');

      // 測試 5: 檢查課程包數據
      addTestResult('測試課程包收入計算...');
      
      const { data: packageData, error: packageError } = await supabase
        .from('Hanami_Student_Package')
        .select('id, course_name, price, status')
        .eq('status', 'active')
        .limit(5);

      if (packageError) {
        addTestResult(`❌ 課程包查詢失敗: ${packageError.message}`);
        return;
      }

      const totalIncome = packageData?.reduce((sum, pkg) => sum + (pkg.price || 0), 0) || 0;
      addTestResult(`✅ 找到 ${packageData.length} 個活躍課程包，總收入: $${totalIncome}`);

      addTestResult('🎉 所有測試完成！財務功能正常運作');

    } catch (error) {
      addTestResult(`❌ 測試過程中發生錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2B3A3B] mb-6">財務功能測試</h1>
        
        <HanamiCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#2B3A3B]">測試控制</h2>
            <HanamiButton
              onClick={testFinancialTable}
              disabled={loading}
              variant="primary"
            >
              {loading ? '測試中...' : '開始測試'}
            </HanamiButton>
          </div>
          
          <p className="text-gray-600 mb-4">
            此頁面將測試財務支出表的基本功能，包括：
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>檢查財務支出表是否存在</li>
            <li>測試插入支出記錄</li>
            <li>測試查詢支出記錄</li>
            <li>測試刪除支出記錄</li>
            <li>測試課程包收入計算</li>
          </ul>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">測試結果</h2>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              尚未執行測試
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </HanamiCard>
      </div>
    </div>
  );
}
