'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CheckStoragePolicies() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkStoragePolicies = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. 檢查 storage.buckets 表結構
      console.log('檢查 storage.buckets 表結構...');
      const { data: bucketsData, error: bucketsError } = await (supabase as any)
        .from('storage.buckets')
        .select('*')
        .limit(10);

      results.buckets = {
        data: bucketsData,
        error: bucketsError
      };

      // 2. 檢查 storage.objects 表結構
      console.log('檢查 storage.objects 表結構...');
      const { data: objectsData, error: objectsError } = await (supabase as any)
        .from('storage.objects')
        .select('*')
        .limit(10);

      results.objects = {
        data: objectsData,
        error: objectsError
      };

      // 3. 檢查 RLS 政策
      console.log('檢查 RLS 政策...');
      const { data: policiesData, error: policiesError } = await (supabase as any)
        .rpc('get_storage_policies')
        .select('*');

      results.policies = {
        data: policiesData,
        error: policiesError
      };

      // 4. 檢查 storage 相關函數
      console.log('檢查 storage 相關函數...');
      const { data: functionsData, error: functionsError } = await (supabase as any)
        .rpc('get_storage_functions')
        .select('*');

      results.functions = {
        data: functionsData,
        error: functionsError
      };

      // 5. 檢查 bucket 設定
      console.log('檢查 bucket 設定...');
      const { data: bucketConfigData, error: bucketConfigError } = await (supabase as any)
        .rpc('get_bucket_config')
        .select('*');

      results.bucketConfig = {
        data: bucketConfigData,
        error: bucketConfigError
      };

      // 6. 嘗試獲取 storage 限制資訊
      console.log('檢查 storage 限制...');
      const { data: limitsData, error: limitsError } = await (supabase as any)
        .rpc('get_storage_limits')
        .select('*');

      results.limits = {
        data: limitsData,
        error: limitsError
      };

      // 7. 檢查是否有自定義的 storage 函數
      console.log('檢查自定義 storage 函數...');
      const { data: customFunctionsData, error: customFunctionsError } = await (supabase as any)
        .rpc('get_custom_storage_functions')
        .select('*');

      results.customFunctions = {
        data: customFunctionsData,
        error: customFunctionsError
      };

      // 8. 檢查 storage 相關觸發器
      console.log('檢查 storage 觸發器...');
      const { data: triggersData, error: triggersError } = await (supabase as any)
        .rpc('get_storage_triggers')
        .select('*');

      results.triggers = {
        data: triggersData,
        error: triggersError
      };

    } catch (error) {
      console.error('檢查過程中發生錯誤:', error);
      results.error = error;
    }

    setResults(results);
    setLoading(false);
  };

  const checkDirectStorageAccess = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 直接查詢 information_schema 來獲取 storage 相關資訊
      console.log('直接查詢 storage 相關資訊...');
      
      // 檢查 storage schema 中的表
      const { data: storageTables, error: storageTablesError } = await (supabase as any)
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'storage');

      results.storageTables = {
        data: storageTables,
        error: storageTablesError
      };

      // 檢查 storage 相關的 RLS 政策
      const { data: storagePolicies, error: storagePoliciesError } = await (supabase as any)
        .from('pg_policies')
        .select('*')
        .ilike('schemaname', 'storage');

      results.storagePolicies = {
        data: storagePolicies,
        error: storagePoliciesError
      };

      // 檢查 storage 相關的函數
      const { data: storageFunctions, error: storageFunctionsError } = await (supabase as any)
        .from('information_schema.routines')
        .select('routine_name, routine_type, data_type')
        .eq('routine_schema', 'storage');

      results.storageFunctions = {
        data: storageFunctions,
        error: storageFunctionsError
      };

      // 檢查 storage 相關的觸發器
      const { data: storageTriggers, error: storageTriggersError } = await (supabase as any)
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, action_statement')
        .eq('trigger_schema', 'storage');

      results.storageTriggers = {
        data: storageTriggers,
        error: storageTriggersError
      };

    } catch (error) {
      console.error('直接查詢過程中發生錯誤:', error);
      results.error = error;
    }

    setResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">檢查 Storage 政策和設定</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={checkStoragePolicies}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '檢查中...' : '檢查 Storage 政策'}
        </button>
        
        <button
          onClick={checkDirectStorageAccess}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? '檢查中...' : '直接查詢 Storage 資訊'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {Object.entries(results).map(([key, value]: [string, any]) => (
            <div key={key} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{key}</h3>
              {value.error ? (
                <div className="text-red-600">
                  <p>錯誤: {JSON.stringify(value.error, null, 2)}</p>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded">
                  <pre className="text-sm overflow-auto max-h-96">
                    {JSON.stringify(value.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 