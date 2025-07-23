'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { initializeStorage, checkStorageInitialized, getStorageStats, cleanupTestFiles } from '@/lib/initStorage';

export default function InitStoragePage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await initializeStorage();
      
      if (result.success) {
        toast.success(result.message);
        setTestResults(result.tests);
      } else {
        toast.error(result.message);
      }
      
      // 重新獲取統計資訊
      const newStats = await getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error('初始化失敗:', error);
      toast.error('初始化 Storage 失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const isInitialized = await checkStorageInitialized();
      const storageStats = await getStorageStats();
      
      setStats(storageStats);
      
      if (isInitialized) {
        toast.success('Storage 已正確設定');
      } else {
        toast.error('Storage 未正確設定');
      }
    } catch (error) {
      console.error('檢查狀態失敗:', error);
      toast.error('檢查 Storage 狀態失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const result = await cleanupTestFiles();
      
      if (result.success) {
        toast.success(`清理完成，刪除了 ${result.deletedCount} 個測試檔案`);
      } else {
        toast.error(`清理失敗: ${result.error}`);
      }
      
      // 重新獲取統計資訊
      const newStats = await getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error('清理失敗:', error);
      toast.error('清理測試檔案失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Storage 設定檢查</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Storage 功能測試</h2>
          <p className="text-gray-600 mb-4">
            此功能將測試 hanami-media bucket 的上傳、讀取和刪除功能，確保 Storage 設定正確。
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={handleInitialize}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '測試中...' : '執行功能測試'}
            </button>
            
            <button
              onClick={handleCheckStatus}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? '檢查中...' : '檢查狀態'}
            </button>
            
            <button
              onClick={handleCleanup}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '清理中...' : '清理測試檔案'}
            </button>
          </div>
        </div>

        {testResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">測試結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${testResults.upload ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-medium ${testResults.upload ? 'text-green-800' : 'text-red-800'}`}>
                  上傳功能
                </h3>
                <p className={`text-2xl font-bold ${testResults.upload ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.upload ? '✅ 正常' : '❌ 失敗'}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${testResults.read ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-medium ${testResults.read ? 'text-green-800' : 'text-red-800'}`}>
                  讀取功能
                </h3>
                <p className={`text-2xl font-bold ${testResults.read ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.read ? '✅ 正常' : '❌ 失敗'}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${testResults.delete ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-medium ${testResults.delete ? 'text-green-800' : 'text-red-800'}`}>
                  刪除功能
                </h3>
                <p className={`text-2xl font-bold ${testResults.delete ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.delete ? '✅ 正常' : '❌ 失敗'}
                </p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Storage 統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800">總檔案數</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.totalFiles}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">總大小</h3>
                <p className="text-2xl font-bold text-green-600">
                  {(stats.totalSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-800">資料夾數</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.folders.length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800">Bucket 狀態</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.bucketInfo ? '✅ 可用' : '❌ 不可用'}
                </p>
              </div>
            </div>
            
            {stats.folders.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">已使用的資料夾:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.folders.map((folder: string) => (
                    <div key={folder} className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {folder}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">重要說明</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>📁 資料夾結構：</strong> Supabase Storage 使用虛擬資料夾結構，不需要預先建立資料夾。
              當您上傳檔案時，系統會自動根據檔案路徑建立必要的資料夾結構。
            </div>
            <div>
              <strong>🔧 功能測試：</strong> 此頁面會測試上傳、讀取和刪除功能，確保 Storage 設定正確。
            </div>
            <div>
              <strong>🧹 清理功能：</strong> 可以清理測試過程中產生的臨時檔案。
            </div>
            <div>
              <strong>📊 統計資訊：</strong> 顯示當前 Storage 的使用情況和檔案統計。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
 