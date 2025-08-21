'use client';

import { useState } from 'react';

export default function TestDateTeacherSelectPage() {
  const [showDateTeacherSelect, setShowDateTeacherSelect] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('2024-12-25');
  const [selectedTeachersForDate, setSelectedTeachersForDate] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    start_time: string;
    end_time: string;
  }>({
    start_time: '09:00',
    end_time: '18:00',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // 模擬老師資料
  const teachers = [
    { id: '1', teacher_nickname: '王老師', teacher_fullname: '王小明' },
    { id: '2', teacher_nickname: '李老師', teacher_fullname: '李美玲' },
    { id: '3', teacher_nickname: '張老師', teacher_fullname: '張志偉' },
    { id: '4', teacher_nickname: '陳老師', teacher_fullname: '陳雅婷' },
    { id: '5', teacher_nickname: '劉老師', teacher_fullname: '劉建國' },
    { id: '6', teacher_nickname: '黃老師', teacher_fullname: '黃淑芬' },
  ];

  // 模擬排班資料
  const mockSchedules = [
    { id: '1', teacher_id: '1', scheduled_date: '2024-12-20', start_time: '09:00', end_time: '18:00' },
    { id: '2', teacher_id: '1', scheduled_date: '2024-12-25', start_time: '10:00', end_time: '19:00' },
    { id: '3', teacher_id: '1', scheduled_date: '2024-12-15', start_time: '08:00', end_time: '17:00' },
    { id: '4', teacher_id: '2', scheduled_date: '2024-12-22', start_time: '09:30', end_time: '18:30' },
    { id: '5', teacher_id: '2', scheduled_date: '2024-12-28', start_time: '11:00', end_time: '20:00' },
  ];

  // 處理老師選擇
  const handleTeacherSelection = (teacherId: string) => {
    setSelectedTeachersForDate(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // 處理時間範圍變更
  const handleTimeRangeChange = (field: 'start_time' | 'end_time', value: string) => {
    setSelectedTimeRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 模擬安排排班
  const handleBatchScheduleTeachers = async () => {
    if (selectedTeachersForDate.length === 0) {
      setMessage('請至少選擇一位老師');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // 模擬 API 調用延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      const selectedTeacherNames = selectedTeachersForDate.map(teacherId => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.teacher_nickname;
      }).join('、');

      setMessage(`✅ 已成功安排 ${selectedTeacherNames} 在 ${selectedDate} 上班時間：${selectedTimeRange.start_time} - ${selectedTimeRange.end_time}`);
      
      // 重置狀態
      setShowDateTeacherSelect(false);
      setSelectedTeachersForDate([]);
      setSelectedTimeRange({
        start_time: '09:00',
        end_time: '18:00',
      });

      // 3秒後清除成功訊息
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('安排排班時發生錯誤:', error);
      setMessage('❌ 安排排班時發生錯誤，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 模擬刪除功能
  const handleMockDelete = (type: string, name: string) => {
    setMessage(`🗑️ 模擬刪除：${type} - ${name}`);
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">日期老師選擇功能測試</h1>
        
        {/* 功能說明 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-bold text-blue-800 mb-2">功能說明</h2>
          <div className="text-blue-700 space-y-1">
            <p>• 點擊日期格子會彈出老師選擇彈窗</p>
            <p>• 可以多選老師（使用 checkbox）</p>
            <p>• 可以設置統一的上班時間範圍</p>
            <p>• 提供預覽功能，確認安排內容</p>
            <p>• 支持批量安排多位老師的排班</p>
            <p>• 已修復 fetchData 錯誤問題</p>
            <p>• <strong>新增：列表模式中老師名字旁有「📅 安排排班」按鈕</strong></p>
            <p>• <strong>新增：列表模式中老師名字旁有「🗑️ 刪除排班」按鈕</strong></p>
            <p>• <strong>新增：列表模式中排班記錄按日期排序</strong></p>
            <p>• <strong>新增：每條排班記錄都有單獨的刪除按鈕</strong></p>
            <p>• <strong>更新：使用圖示替代 emoji，提升視覺一致性</strong></p>
          </div>
        </div>

        {/* 狀態訊息 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : message.includes('🗑️')
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.includes('✅') ? (
                <span className="text-green-600">✓</span>
              ) : message.includes('🗑️') ? (
                <span className="text-orange-600">🗑️</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* 測試按鈕 */}
        <div className="mb-6">
          <button
            onClick={() => setShowDateTeacherSelect(true)}
            className="px-6 py-3 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
          >
            測試日期老師選擇彈窗
          </button>
        </div>

        {/* 模擬列表模式 */}
        <div className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
          <h3 className="font-bold text-[#4B4036] mb-3">模擬列表模式（含刪除功能和日期排序）</h3>
          <div className="space-y-4">
            {teachers.slice(0, 2).map(teacher => {
              const teacherSchedules = mockSchedules.filter(s => s.teacher_id === teacher.id);
              const sortedSchedules = [...teacherSchedules].sort((a, b) => 
                new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
              );
              
              if (sortedSchedules.length === 0) return null;
              
              return (
                <div key={teacher.id} className="border border-[#EADBC8] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-[#4B4036] text-lg">{teacher.teacher_nickname}</div>
                    <button
                      className="px-3 py-1 text-xs bg-[#EADBC8] text-[#4B4036] rounded hover:bg-[#FFE8C2] border border-[#EADBC8] transition-colors flex items-center gap-1"
                      onClick={() => {
                        setMessage(`📅 點擊了 ${teacher.teacher_nickname} 的「安排排班」按鈕`);
                        setTimeout(() => setMessage(''), 2000);
                      }}
                      title="安排老師排班"
                    >
                      <img src="/calendar.png" alt="calendar" className="w-3 h-3" />
                      安排排班
                    </button>
                    <button
                      className="px-3 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300 border border-red-200 transition-colors flex items-center gap-1"
                      onClick={() => handleMockDelete('所有排班', teacher.teacher_nickname)}
                      title="刪除老師排班"
                    >
                      <img src="/close.png" alt="delete" className="w-3 h-3" />
                      刪除排班
                    </button>
                    <button className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]">
                      匯出 CSV
                    </button>
                    <button className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]">
                      複製 Markdown
                    </button>
                  </div>
                  <div className="text-sm text-[#A68A64] mb-3">{teacher.teacher_fullname}</div>
                  
                  {/* 排班表格 */}
                  <table className="w-full border border-[#EADBC8] rounded-lg">
                    <thead className="bg-[#FFF9F2]">
                      <tr>
                        <th className="p-2 border-b border-[#EADBC8] text-left text-sm">日期</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left text-sm">老師</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left text-sm">上班時間</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left text-sm">下班時間</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left text-sm">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSchedules.map(sch => (
                        <tr key={sch.id} className="hover:bg-[#FFFCF5]">
                          <td className="p-2 border-b border-[#EADBC8] font-medium text-sm">{sch.scheduled_date}</td>
                          <td className="p-2 border-b border-[#EADBC8] text-sm">{teacher.teacher_nickname}</td>
                          <td className="p-2 border-b border-[#EADBC8] text-sm">{sch.start_time}</td>
                          <td className="p-2 border-b border-[#EADBC8] text-sm">{sch.end_time}</td>
                          <td className="p-2 border-b border-[#EADBC8]">
                            <button
                              className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300 border border-red-200 transition-colors flex items-center justify-center"
                              onClick={() => handleMockDelete('單個排班', `${teacher.teacher_nickname} ${sch.scheduled_date}`)}
                              title="刪除此排班"
                            >
                              <img src="/close.png" alt="delete" className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        {/* 模擬日曆格子 */}
        <div className="mb-6 p-4 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
          <h3 className="font-bold text-[#4B4036] mb-3">模擬日曆格子</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="h-20 border border-[#EADBC8] rounded p-2 flex flex-col justify-between cursor-pointer hover:bg-[#FFFCF5] transition-colors"
                onClick={() => {
                  setSelectedDate(`2024-12-${String(i + 1).padStart(2, '0')}`);
                  setShowDateTeacherSelect(true);
                }}
              >
                <div className="text-sm font-semibold text-[#4B4036]">{i + 1}</div>
                <div className="text-xs text-[#A68A64]">點擊測試</div>
              </div>
            ))}
          </div>
        </div>

        {/* 使用說明 */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">使用說明</h3>
          <div className="text-green-700 space-y-1">
            <p>1. 點擊上方的「測試日期老師選擇彈窗」按鈕</p>
            <p>2. 或點擊下方的模擬日曆格子</p>
            <p>3. 在彈窗中選擇老師（可多選）</p>
            <p>4. 設置上班時間範圍</p>
            <p>5. 查看預覽並確認安排</p>
            <p>6. 點擊「安排排班」完成操作</p>
            <p>7. 觀察成功訊息和錯誤處理</p>
            <p>8. <strong>在列表模式中，點擊老師名字旁的「📅 安排排班」按鈕</strong></p>
            <p>9. <strong>在列表模式中，點擊老師名字旁的「🗑️ 刪除排班」按鈕</strong></p>
            <p>10. <strong>在列表模式中，點擊每條排班記錄旁的「🗑️」按鈕刪除單個排班</strong></p>
            <p>11. <strong>所有刪除操作都會有確認對話框，防止誤操作</strong></p>
          </div>
        </div>

        {/* 修復說明 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">修復內容</h3>
          <div className="text-yellow-700 space-y-1">
            <p>• 將 fetchData 函數從 useEffect 內部提取出來</p>
            <p>• 使其可以在組件內的其他函數中調用</p>
            <p>• 修復了 "Can't find variable: fetchData" 錯誤</p>
            <p>• 添加了更好的錯誤處理和用戶反饋</p>
            <p>• <strong>新增：列表模式中老師名字旁的排班按鈕</strong></p>
            <p>• <strong>新增：單個老師排班彈窗功能</strong></p>
            <p>• <strong>新增：列表模式中老師名字旁的刪除按鈕</strong></p>
            <p>• <strong>新增：排班記錄按日期排序功能</strong></p>
            <p>• <strong>新增：單個排班記錄的刪除功能</strong></p>
          </div>
        </div>

        {/* 新功能說明 */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-bold text-purple-800 mb-2">新功能：列表模式完整功能</h3>
          <div className="text-purple-700 space-y-1">
            <p>• 在列表模式中，每位老師名字旁都有「📅 安排排班」按鈕</p>
            <p>• 在列表模式中，每位老師名字旁都有「🗑️ 刪除排班」按鈕</p>
            <p>• 點擊安排按鈕會彈出專門的單個老師排班彈窗</p>
            <p>• 點擊刪除按鈕會刪除該老師的所有排班記錄</p>
            <p>• 排班記錄按日期自動排序（升序）</p>
            <p>• 每條排班記錄都有單獨的刪除按鈕</p>
            <p>• 支持更新現有排班或創建新排班</p>
            <p>• 提供即時預覽和確認功能</p>
            <p>• 完整的錯誤處理和用戶反饋</p>
            <p>• 使用圖示替代 emoji，提升視覺一致性</p>
            <p>• 所有刪除操作都有確認對話框，防止誤操作</p>
          </div>
        </div>
      </div>

      {/* 日期老師選擇彈窗 */}
      {showDateTeacherSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-[#FFFDF8] rounded-2xl shadow-2xl p-8 w-[500px] max-h-[90vh] overflow-y-auto border border-[#EADBC8] relative">
            <button
              aria-label="關閉"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-xl text-[#A68A64] hover:bg-[#F3F0E5] shadow"
              onClick={() => setShowDateTeacherSelect(false)}
            >×
            </button>
            
            <div className="text-xl font-bold mb-4 text-[#4B4036]">
              安排老師排班 - {selectedDate}
            </div>

            {/* 老師選擇區域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-[#4B4036]">選擇老師：</label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {teachers.map(teacher => (
                  <label
                    key={teacher.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedTeachersForDate.includes(teacher.id)
                        ? 'border-[#A68A64] bg-[#FFE8C2] shadow-md'
                        : 'border-[#EADBC8] bg-white hover:bg-[#FFFCF5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeachersForDate.includes(teacher.id)}
                      onChange={() => handleTeacherSelection(teacher.id)}
                      className="mr-3 w-4 h-4 text-[#A68A64] border-[#EADBC8] rounded focus:ring-[#A68A64]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[#4B4036]">{teacher.teacher_nickname}</div>
                      <div className="text-xs text-[#A68A64]">{teacher.teacher_fullname}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 時間設置區域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-[#4B4036]">上班時間：</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-[#A68A64] mb-1">開始時間</label>
                  <input
                    type="time"
                    value={selectedTimeRange.start_time}
                    onChange={(e) => handleTimeRangeChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[#A68A64] mb-1">結束時間</label>
                  <input
                    type="time"
                    value={selectedTimeRange.end_time}
                    onChange={(e) => handleTimeRangeChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  />
                </div>
              </div>
            </div>

            {/* 預覽區域 */}
            {selectedTeachersForDate.length > 0 && (
              <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-sm font-medium text-[#4B4036] mb-2">預覽安排：</div>
                <div className="space-y-1">
                  {selectedTeachersForDate.map(teacherId => {
                    const teacher = teachers.find(t => t.id === teacherId);
                    return (
                      <div key={teacherId} className="text-sm text-[#4B4036]">
                        • {teacher?.teacher_nickname}：{selectedTimeRange.start_time} - {selectedTimeRange.end_time}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-2 bg-gray-200 rounded-full text-sm text-[#4B4036] hover:bg-gray-300 transition-colors"
                onClick={() => setShowDateTeacherSelect(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="px-6 py-2 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036] hover:bg-[#DDBA90] transition-colors disabled:opacity-50"
                disabled={loading || selectedTeachersForDate.length === 0}
                onClick={handleBatchScheduleTeachers}
              >
                {loading ? '安排中...' : '安排排班'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 