"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { PopupSelect } from "@/components/ui/PopupSelect"; // 新增引入 PopupSelect

// 欄目設計參考 LessonAvailabilityDashboard
const columns = [
  { label: "姓名", key: "full_name" },
  { label: "出生日期", key: "student_dob" },
  { label: "年齡", key: "student_age" },
  { label: "聯絡電話", key: "phone_no" },
  { label: "偏好時段", key: "prefer_time" },
  { label: "備註", key: "notes" },
  { label: "登記時間", key: "created_at" },
];

function formatAge(months: number | null | undefined): string {
  if (!months || isNaN(months)) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0 && m === 0) return "";
  if (y === 0) return `${m}月`;
  if (m === 0) return `${y}歲`;
  return `${y}歲${m}月`;
}

export default function TrialQueueListPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [showPageSizePopup, setShowPageSizePopup] = useState(false);
  const [tempPageSize, setTempPageSize] = useState(pageSize === Infinity ? 'all' : pageSize.toString());

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("hanami_trial_queue")
        .select("*")
        .eq("status", "候補中")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      setQueue(data || []);
      setLoading(false);
    };
    fetchQueue();
  }, []);

  // 搜尋過濾
  const filteredQueue = queue.filter((stu: any) =>
    stu.full_name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // 分頁
  const total = filteredQueue.length;
  const totalPages = pageSize === Infinity ? 1 : Math.ceil(total / pageSize);
  const pagedQueue =
    pageSize === Infinity
      ? filteredQueue
      : filteredQueue.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-[#4B4036]">輪候中學生列表</h2>
          <Image src="/rabbit.png" alt="icon" width={32} height={32} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <input
            type="text"
            placeholder="搜尋學生姓名"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]"
          />
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-sm text-[#2B3A3B]">每頁顯示：</span>
            <button
              onClick={() => setShowPageSizePopup(true)}
              className="border border-[#EADBC8] rounded-full px-3 py-1 text-sm bg-white"
            >
              {pageSize === Infinity ? '全部' : pageSize}
            </button>
            {showPageSizePopup && (
              <PopupSelect
                title="每頁顯示"
                options={[
                  { label: '20', value: '20' },
                  { label: '50', value: '50' },
                  { label: '100', value: '100' },
                  { label: '全部', value: 'all' },
                ]}
                selected={tempPageSize}
                onChange={(v: string | string[]) => setTempPageSize(Array.isArray(v) ? v[0] : v)}
                onConfirm={() => {
                  setPageSize(tempPageSize === 'all' ? Infinity : Number(tempPageSize));
                  setCurrentPage(1);
                  setShowPageSizePopup(false);
                }}
                onCancel={() => setShowPageSizePopup(false)}
                mode="single"
              />
            )}
            <span className="text-sm text-[#2B3A3B] ml-2">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
                              className={`px-2 py-1 rounded-full ml-1 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'}`}
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded-full ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'}`}
            >
              &gt;
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-[#4B4036] text-center py-10">載入中...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">⚠️ {error}</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-[#EADBC8]">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B]"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedQueue.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center text-[#87704e] py-8">
                      暫無輪候中學生
                    </td>
                  </tr>
                ) : (
                  pagedQueue.map((stu: any, idx: number) => (
                    <tr key={stu.id} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                      <td className="p-3 text-sm text-[#2B3A3B]">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.full_name}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.student_dob ? new Date(stu.student_dob).toLocaleDateString('zh-HK') : ''}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{formatAge(stu.student_age)}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.phone_no}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">
                        {Array.isArray(stu.prefer_time)
                          ? stu.prefer_time.join(", ")
                          : (stu.prefer_time || "")}
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.notes}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.created_at ? stu.created_at.replace('T', ' ').slice(0, 16) : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-sm text-gray-600 mt-2">顯示學生數：{total}（全部輪候中）</div>
      </div>
    </div>
  );
} 