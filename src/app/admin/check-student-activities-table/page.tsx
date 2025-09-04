'use client';

import React, { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { toast } from 'react-hot-toast';

export default function CheckStudentActivitiesTablePage() {
  const [loading, setLoading] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [sqlScript, setSqlScript] = useState<string>('');

  const checkTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-student-activities-table');
      const result = await response.json();
      
      setTableExists(result.exists);
      
      if (result.exists) {
        toast.success('hanami_student_activities 表已存在');
      } else {
        toast.error('hanami_student_activities 表不存在');
      }
    } catch (error) {
      console.error('檢查表失敗:', error);
      toast.error('檢查表失敗');
    } finally {
      setLoading(false);
    }
  };

  const getCreateScript = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-student-activities-table', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setSqlScript(result.sql);
        toast.success('已獲取創建腳本');
      } else {
        toast.error('獲取創建腳本失敗');
      }
    } catch (error) {
      console.error('獲取創建腳本失敗:', error);
      toast.error('獲取創建腳本失敗');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    toast.success('SQL 腳本已複製到剪貼板');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">
            檢查 hanami_student_activities 表
          </h1>
          <p className="text-[#87704e]">
            檢查和創建學生活動表，用於安排下一個活動功能
          </p>
        </div>

        <HanamiCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#2B3A3B]">
              表狀態檢查
            </h2>
            
            <div className="flex gap-4">
              <HanamiButton
                variant="primary"
                onClick={checkTable}
                disabled={loading}
              >
                {loading ? '檢查中...' : '檢查表是否存在'}
              </HanamiButton>
              
              <HanamiButton
                variant="secondary"
                onClick={getCreateScript}
                disabled={loading}
              >
                {loading ? '獲取中...' : '獲取創建腳本'}
              </HanamiButton>
            </div>

            {tableExists !== null && (
              <div className={`p-4 rounded-lg ${
                tableExists 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${
                    tableExists ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tableExists ? '✅' : '❌'}
                  </span>
                  <span className={`font-medium ${
                    tableExists ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {tableExists 
                      ? 'hanami_student_activities 表已存在' 
                      : 'hanami_student_activities 表不存在'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </HanamiCard>

        {sqlScript && (
          <HanamiCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2B3A3B]">
                  創建表 SQL 腳本
                </h2>
                <HanamiButton
                  variant="cute"
                  onClick={copyToClipboard}
                >
                  📋 複製腳本
                </HanamiButton>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                  {sqlScript}
                </pre>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">使用說明：</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>複製上面的 SQL 腳本</li>
                  <li>打開 Supabase 控制台</li>
                  <li>進入 SQL 編輯器</li>
                  <li>粘貼並執行腳本</li>
                  <li>執行完成後重新檢查表狀態</li>
                </ol>
              </div>
            </div>
          </HanamiCard>
        )}
      </div>
    </div>
  );
}
