'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  CircleStackIcon as DatabaseIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function DatabaseDiagnosticPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnosticResult(null);
    
    try {
      const response = await fetch('/aihome/api/auth/check-tables');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDiagnosticResult(data);
    } catch (error) {
      setDiagnosticResult({
        success: false,
        error: '診斷過程中發生錯誤',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const fixDatabase = async () => {
    setLoading(true);
    setFixResult(null);
    
    try {
      // 創建 saas_users 表的 SQL
      const createTableSQL = `
        -- 創建 saas_users 表
        CREATE TABLE IF NOT EXISTS public.saas_users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          full_name TEXT,
          nickname TEXT,
          phone TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'user',
          subscription_status TEXT DEFAULT 'free',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 啟用 RLS
        ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;

        -- 創建 RLS 策略
        DROP POLICY IF EXISTS "Users can view own profile" ON public.saas_users;
        CREATE POLICY "Users can view own profile" ON public.saas_users
          FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update own profile" ON public.saas_users;
        CREATE POLICY "Users can update own profile" ON public.saas_users
          FOR UPDATE USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can insert own profile" ON public.saas_users;
        CREATE POLICY "Users can insert own profile" ON public.saas_users
          FOR INSERT WITH CHECK (auth.uid() = id);
      `;

      setFixResult({
        success: true,
        message: '請在 Supabase SQL 編輯器中執行以下 SQL 代碼',
        sql: createTableSQL
      });
    } catch (error) {
      setFixResult({
        success: false,
        error: '修復過程中發生錯誤',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            數據庫診斷工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            檢查和修復 saas_users 表問題
          </p>
        </div>

        <div className="space-y-6">
          {/* 問題說明 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  問題說明
                </h2>
                <div className="space-y-3 text-[#2B3A3B]">
                  <p>
                    您遇到的 406 錯誤通常表示 <code className="bg-white px-2 py-1 rounded">saas_users</code> 表不存在或權限配置有問題。
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-2">錯誤信息：</h3>
                    <div className="bg-white p-3 rounded border text-sm font-mono">
                      <p>Failed to load resource: the server responded with a status of 406</p>
                      <p>載入用戶數據失敗</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">可能原因：</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>saas_users 表尚未創建</li>
                      <li>RLS (Row Level Security) 策略配置錯誤</li>
                      <li>用戶權限不足</li>
                      <li>表結構與代碼不匹配</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 診斷工具 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <DatabaseIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  數據庫診斷
                </h2>
                
                <div className="space-y-4">
                  <HanamiButton
                    onClick={runDiagnostic}
                    loading={loading}
                    size="lg"
                    className="w-full"
                  >
                    運行診斷檢查
                  </HanamiButton>

                  {diagnosticResult && (
                    <div className={`border rounded-lg p-4 ${
                      diagnosticResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {diagnosticResult.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className={`font-semibold ${
                          diagnosticResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {diagnosticResult.success ? '診斷完成' : '診斷失敗'}
                        </h3>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <p><strong>表存在：</strong> {diagnosticResult.tableExists ? '是' : '否'}</p>
                        {diagnosticResult.columns && (
                          <div>
                            <p><strong>表結構：</strong></p>
                            <ul className="list-disc list-inside ml-4">
                              {diagnosticResult.columns.map((col: any, index: number) => (
                                <li key={index}>{col.column_name} ({col.data_type})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {diagnosticResult.error && (
                          <p className="text-red-700"><strong>錯誤：</strong> {diagnosticResult.error}</p>
                        )}
                        {diagnosticResult.details && (
                          <p className="text-red-700"><strong>詳情：</strong> {diagnosticResult.details}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 修復工具 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <WrenchScrewdriverIcon className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  自動修復
                </h2>
                
                <div className="space-y-4">
                  <HanamiButton
                    onClick={fixDatabase}
                    loading={loading}
                    size="lg"
                    variant="secondary"
                    className="w-full"
                  >
                    生成修復 SQL
                  </HanamiButton>

                  {fixResult && (
                    <div className={`border rounded-lg p-4 ${
                      fixResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {fixResult.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className={`font-semibold ${
                          fixResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {fixResult.success ? '修復 SQL 已生成' : '修復失敗'}
                        </h3>
                      </div>
                      
                      {fixResult.success && (
                        <div className="space-y-4">
                          <p className="text-green-700">{fixResult.message}</p>
                          
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">SQL 代碼：</h4>
                            <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                              {fixResult.sql}
                            </pre>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">執行步驟：</h4>
                            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                              <li>前往 Supabase 控制台</li>
                              <li>選擇您的項目</li>
                              <li>導航至 SQL Editor</li>
                              <li>複製並粘貼上面的 SQL 代碼</li>
                              <li>點擊 "Run" 執行</li>
                              <li>返回此頁面重新測試</li>
                            </ol>
                          </div>
                        </div>
                      )}
                      
                      {fixResult.error && (
                        <p className="text-red-700"><strong>錯誤：</strong> {fixResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 測試工具 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <UserIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  測試工具
                </h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/test-smtp'}
                      size="lg"
                      variant="secondary"
                    >
                      測試郵件發送
                    </HanamiButton>
                    
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/auth/login'}
                      size="lg"
                      variant="secondary"
                    >
                      測試登入功能
                    </HanamiButton>
                  </div>
                  
                  <p className="text-sm text-[#2B3A3B]">
                    修復完成後，請使用這些工具測試系統功能是否正常。
                  </p>
                </div>
              </div>
            </div>
          </HanamiCard>
        </div>

        <div className="text-center mt-8">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/dashboard'}
            size="lg"
          >
            返回儀表板
          </HanamiButton>
        </div>
      </div>
    </div>
  );
}
