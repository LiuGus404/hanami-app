'use client';

import React, { useState } from 'react';

export default function DebugAddStudentButton() {
  const [showSlotDetailModal, setShowSlotDetailModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const handleAddStudentClick = () => {
    console.log('添加學生按鈕被點擊了！');
    setShowAddStudentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">調試添加學生按鈕</h1>
        
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          onClick={() => setShowSlotDetailModal(true)}
        >
          打開時段詳情模態框
        </button>

        {/* 時段詳情模態框 */}
        {showSlotDetailModal && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="bg-white border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* 模態框標題 */}
              <div className="bg-gray-800 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">時段詳情測試</h3>
                  <button
                    className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center"
                    onClick={() => setShowSlotDetailModal(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 模態框內容 */}
              <div className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">這是一個測試模態框</p>
                  <p className="text-gray-600">請檢查底部的按鈕是否顯示</p>
                </div>
              </div>

              {/* 模態框底部 - 這裡應該有添加學生按鈕 */}
              <div className="bg-gray-100 p-4 rounded-b-2xl border-t">
                <div className="flex justify-between">
                  <button
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                    onClick={handleAddStudentClick}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    添加學生到課程
                  </button>
                  <button
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full text-sm font-medium"
                    onClick={() => setShowSlotDetailModal(false)}
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 添加學生模態框 */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">添加學生模態框</h3>
                <p className="text-gray-600 mb-4">這個模態框應該正常顯示</p>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowAddStudentModal(false)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-white rounded border">
          <h2 className="text-lg font-bold mb-2">調試信息</h2>
          <div className="space-y-2 text-sm">
            <div>時段詳情模態框顯示: {showSlotDetailModal ? '是' : '否'}</div>
            <div>添加學生模態框顯示: {showAddStudentModal ? '是' : '否'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}



