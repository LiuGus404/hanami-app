'use client';

import { useState } from 'react';

export default function TestDragScrollPage() {
  const [editMode, setEditMode] = useState(false);
  const [draggedTeacher, setDraggedTeacher] = useState<string | null>(null);

  // 模擬老師資料
  const teachers = [
    { id: '1', name: '王老師' },
    { id: '2', name: '李老師' },
    { id: '3', name: '張老師' },
  ];

  // 自動滾動功能
  const handleAutoScroll = (e: React.DragEvent) => {
    const scrollThreshold = 80; // 距離邊緣多少像素開始滾動
    const scrollSpeed = 8; // 滾動速度
    
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;
    
    // 檢查是否接近頁面底部
    if (mouseY > windowHeight - scrollThreshold) {
      // 向下滾動
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'smooth'
      });
    }
    // 檢查是否接近頁面頂部
    else if (mouseY < scrollThreshold) {
      // 向上滾動
      window.scrollBy({
        top: -scrollSpeed,
        behavior: 'smooth'
      });
    }
  };

  const handleDragStart = (teacherId: string) => {
    setDraggedTeacher(teacherId);
  };

  const handleDragEnd = () => {
    setDraggedTeacher(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">拖拽自動滾動功能測試</h1>
        
        {/* 功能說明 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-bold text-blue-800 mb-2">功能說明</h2>
          <div className="text-blue-700 space-y-1">
            <p>• 在編輯模式下拖拽老師到日曆格子</p>
            <p>• 當拖拽到頁面邊緣時，頁面會自動滾動</p>
            <p>• 向下拖拽到頁面底部附近會自動向下滾動</p>
            <p>• 向上拖拽到頁面頂部附近會自動向上滾動</p>
            <p>• 滾動是平滑的，提供良好的用戶體驗</p>
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="mb-6">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editMode 
                ? 'bg-[#A68A64] text-white' 
                : 'bg-[#EADBC8] text-[#4B4036]'
            }`}
          >
            {editMode ? '退出編輯模式' : '進入編輯模式'}
          </button>
        </div>

        {/* 老師列表 */}
        {editMode && (
          <div className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
            <h3 className="font-bold text-[#4B4036] mb-3">拖拽老師到下方日曆</h3>
            <div className="flex gap-3">
              {teachers.map(teacher => (
                <div
                  key={teacher.id}
                  draggable
                  onDragStart={() => handleDragStart(teacher.id)}
                  onDragEnd={handleDragEnd}
                  className="px-4 py-2 bg-[#FFE8C2] text-[#4B4036] rounded-lg cursor-move hover:bg-[#EADBC8] transition-colors border border-[#EADBC8]"
                >
                  {teacher.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模擬長內容 */}
        <div className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
          <h3 className="font-bold text-[#4B4036] mb-3">上方內容區域</h3>
          <p className="text-[#4B4036]">這是頁面上方的內容，拖拽老師時會自動向上滾動到這裡。</p>
        </div>

        {/* 日曆區域 */}
        <div 
          className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]"
          onDragOver={editMode ? (e) => {
            e.preventDefault();
            handleAutoScroll(e);
          } : undefined}
        >
          <h3 className="font-bold text-[#4B4036] mb-3">日曆區域</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="h-20 border border-[#EADBC8] rounded p-2 flex items-center justify-center text-sm text-[#4B4036] bg-white"
                onDragOver={editMode ? (e) => {
                  e.preventDefault();
                  handleAutoScroll(e);
                } : undefined}
                onDrop={editMode ? (e) => {
                  e.preventDefault();
                  if (draggedTeacher) {
                    alert(`已將老師拖拽到第 ${i + 1} 個格子`);
                  }
                } : undefined}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* 模擬長內容 */}
        <div className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
          <h3 className="font-bold text-[#4B4036] mb-3">下方內容區域</h3>
          <p className="text-[#4B4036]">這是頁面下方的內容，拖拽老師時會自動向下滾動到這裡。</p>
        </div>

        {/* 更多內容以確保有足夠的滾動空間 */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
            <h3 className="font-bold text-[#4B4036] mb-3">額外內容區域 {i + 1}</h3>
            <p className="text-[#4B4036]">這是額外的內容區域，用於測試滾動功能。</p>
          </div>
        ))}

        {/* 使用說明 */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">使用說明</h3>
          <div className="text-green-700 space-y-1">
            <p>1. 點擊「進入編輯模式」按鈕</p>
            <p>2. 拖拽上方的老師卡片</p>
            <p>3. 將老師拖拽到日曆格子中</p>
            <p>4. 當拖拽到頁面邊緣時，觀察自動滾動效果</p>
            <p>5. 滾動是平滑的，提供良好的用戶體驗</p>
          </div>
        </div>
      </div>
    </div>
  );
} 