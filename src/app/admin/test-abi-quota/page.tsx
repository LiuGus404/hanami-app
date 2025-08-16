'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAbiQuota() {
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAbiQuota();
  }, []);

  const checkAbiQuota = async () => {
    try {
      setLoading(true);
      
      // 首先找到 Abi 的學生 ID
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name')
        .ilike('full_name', '%Abi%');

      if (studentError) {
        console.error('查找 Abi 失敗:', studentError);
        return;
      }

      console.log('找到的學生:', students);

      if (students && students.length > 0) {
        const abiId = students[0].id;
        
        // 獲取 Abi 的配額設定
        const { data: quota, error: quotaError } = await supabase
          .from('hanami_student_media_quota')
          .select('*')
          .eq('student_id', abiId)
          .single();

        if (quotaError) {
          console.error('獲取配額失敗:', quotaError);
        } else {
          console.log('Abi 的配額設定:', quota);
        }

        // 獲取配額等級設定
        if (quota) {
          const { data: level, error: levelError } = await supabase
            .from('hanami_media_quota_levels')
            .select('*')
            .eq('level_name', quota.plan_type)
            .single();

          if (levelError) {
            console.error('獲取配額等級失敗:', levelError);
          } else {
            console.log('配額等級設定:', level);
          }

          // 獲取 Abi 的媒體檔案
          const { data: media, error: mediaError } = await supabase
            .from('hanami_student_media')
            .select('*')
            .eq('student_id', abiId);

          if (mediaError) {
            console.error('獲取媒體失敗:', mediaError);
          } else {
            console.log('Abi 的媒體檔案:', media);
            const videoCount = media?.filter(m => m.media_type === 'video').length || 0;
            const photoCount = media?.filter(m => m.media_type === 'photo').length || 0;
            console.log(`Abi 當前有 ${videoCount} 個影片，${photoCount} 張相片`);
          }

          setQuotaInfo({
            student: students[0],
            quota,
            level,
            media: media || []
          });
        }
      }
    } catch (error) {
      console.error('檢查配額時發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Abi 配額測試</h1>
      
      <div className="mb-4">
        <button 
          onClick={checkAbiQuota}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新檢查配額
        </button>
      </div>
      
      {quotaInfo ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">學生資訊</h2>
            <p>ID: {quotaInfo.student.id}</p>
            <p>姓名: {quotaInfo.student.full_name}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">配額設定</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(quotaInfo.quota, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">配額等級</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(quotaInfo.level, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">媒體檔案</h2>
            <p>總數: {quotaInfo.media.length}</p>
            <p>影片: {quotaInfo.media.filter((m: any) => m.media_type === 'video').length}</p>
            <p>相片: {quotaInfo.media.filter((m: any) => m.media_type === 'photo').length}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">容量分析</h2>
            {quotaInfo.level && (
              <>
                <p>影片限制: {quotaInfo.level.video_limit}</p>
                <p>相片限制: {quotaInfo.level.photo_limit}</p>
                <p>當前影片: {quotaInfo.media.filter((m: any) => m.media_type === 'video').length}</p>
                <p>當前相片: {quotaInfo.media.filter((m: any) => m.media_type === 'photo').length}</p>
                <p>影片剩餘: {quotaInfo.level.video_limit - quotaInfo.media.filter((m: any) => m.media_type === 'video').length}</p>
                <p>相片剩餘: {quotaInfo.level.photo_limit - quotaInfo.media.filter((m: any) => m.media_type === 'photo').length}</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded-lg">
          <p>無法獲取 Abi 的配額資訊</p>
        </div>
      )}
    </div>
  );
} 