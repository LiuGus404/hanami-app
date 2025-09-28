'use client';

import { useState } from 'react';
import { useBatchContactDays } from '@/hooks/useBatchContactDays';

export default function TestBatchContactDays() {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['90399475', '98765432']);
  const [newPhone, setNewPhone] = useState('');

  const { results, loading, error } = useBatchContactDays(phoneNumbers);

  const addPhone = () => {
    if (newPhone.trim() && !phoneNumbers.includes(newPhone.trim())) {
      setPhoneNumbers([...phoneNumbers, newPhone.trim()]);
      setNewPhone('');
    }
  };

  const removePhone = (phone: string) => {
    setPhoneNumbers(phoneNumbers.filter(p => p !== phone));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">批量聯繫天數測試</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">電話號碼列表</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="輸入電話號碼"
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={addPhone}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {phoneNumbers.map(phone => (
            <div key={phone} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
              <span>{phone}</span>
              <button
                onClick={() => removePhone(phone)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">載入狀態</h2>
        <div className="flex items-center gap-4">
          <span>載入中: {loading ? '是' : '否'}</span>
          {error && <span className="text-red-500">錯誤: {error}</span>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">結果</h2>
        <div className="space-y-3">
          {phoneNumbers.map(phone => {
            const result = results[phone];
            return (
              <div key={phone} className="p-4 border rounded">
                <h3 className="font-medium mb-2">電話: {phone}</h3>
                {result ? (
                  <div className="space-y-1 text-sm">
                    <p>聯繫天數: {result.daysSinceContact ?? '無記錄'}</p>
                    <p>最後聯繫時間: {result.lastContactTime ? new Date(result.lastContactTime).toLocaleString() : '無'}</p>
                    <p>有聯繫記錄: {result.hasContact ? '是' : '否'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">無數據</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

