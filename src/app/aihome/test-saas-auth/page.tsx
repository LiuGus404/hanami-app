'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestSaasAuthPage() {
  const { user, loading, logout } = useSaasAuth();

  console.log('TestSaasAuth - loading:', loading, 'user:', user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">useSaasAuth 測試頁面</h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">狀態信息</h2>
          <div className="space-y-4">
            <div>
              <strong>User Name:</strong> {user?.full_name || 'N/A'}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">原始數據</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify({ loading, user }, null, 2)}
          </pre>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/aihome/profile"
            className="inline-block px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            測試個人資料頁面
          </a>
        </div>
      </div>
    </div>
  );
}


