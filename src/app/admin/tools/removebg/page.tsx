'use client'

import { useState } from 'react'

export default function RemoveBgToolPage() {
  const [originalImage, setOriginalImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('無檔案選取');
      return;
    }
  
    console.log('選取檔案', file);
    const url = URL.createObjectURL(file);
    console.log('產生預覽網址', url);
  
    setOriginalImage(file);
    setPreviewUrl(url);  // ✅ 這是關鍵
    setResultUrl(null);
    e.target.value = ''; // 清空 file input
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image_file', originalImage);
    formData.append('size', 'auto');

    console.log('送出請求中...');

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_REMOVEBG_API_KEY!,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('回傳錯誤：', errorText);
        setErrorMessage('去背失敗：' + errorText);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const resultObjectUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjectUrl);
    } catch (error) {
      console.error('發生例外錯誤：', error);
      setErrorMessage('發生錯誤：' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffceb] px-6 py-8 font-['Quicksand',_sans-serif]">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow border border-[#EADBC8]">
        <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">圖片去背景工具</h2>

        <div className="mb-6 text-center">
  <input
    id="fileInput"
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="hidden"
  />

  <label htmlFor="fileInput">
    <div className="cursor-pointer bg-[#F78CA2] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#f96d8c] transition inline-block">
      上載圖片
    </div>
  </label>
</div>

        {previewUrl && (
          <div className="mb-4">
            <p className="text-sm text-[#555] mb-1">原始圖片預覽：</p>
            <img src={previewUrl} alt="預覽" className="rounded-xl max-w-full" />
          </div>
        )}

{previewUrl && (
  <button
    onClick={handleRemoveBackground}
    disabled={loading}
    className="mt-4 bg-[#F78CA2] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#f96d8c] transition"
  >
    {loading ? '處理中...' : '去除背景'}
  </button>
)}

        {errorMessage && (
          <p className="mt-2 text-red-500 text-sm">{errorMessage}</p>
        )}

        {resultUrl && (
          <div className="mt-6">
            <p className="text-sm text-[#555] mb-1">去背結果：</p>
            <img src={resultUrl} alt="去背後" className="rounded-xl max-w-full" />
          </div>
        )}
      </div>
    </div>
  )
}
