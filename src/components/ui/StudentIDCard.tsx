'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeGenerator from './QRCodeGenerator';
import { X, Download, Printer } from 'lucide-react';

interface StudentIDCardProps {
  student: {
    id: string;
    full_name: string;
    student_age: number | null;
    student_dob: string | null;
    started_date: string | null;
    student_oid?: string | null;
    gender?: string | null;
    course_type?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentIDCard({ student, isOpen, onClose }: StudentIDCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // 格式化年齡顯示
  const formatAge = (months: number | null) => {
    if (!months) return '—';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} 歲${remainingMonths > 0 ? ` ${remainingMonths} 個月` : ''}`;
  };

  // 格式化日期顯示
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 下載學生證
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const cardElement = document.getElementById('student-id-card');
      if (!cardElement) return;

      // 創建一個臨時的canvas來繪製學生證
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('無法創建canvas上下文');

      // 設置canvas尺寸
      const cardWidth = 420;
      const cardHeight = 600;
      canvas.width = cardWidth * 2; // 高解析度
      canvas.height = cardHeight * 2;
      ctx.scale(2, 2); // 縮放以獲得高解析度

      // 繪製背景漸層
      const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      gradient.addColorStop(0, '#FFD59A');
      gradient.addColorStop(0.5, '#F5C6A0');
      gradient.addColorStop(1, '#EBC9A4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // 繪製裝飾性圓形背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(cardWidth * 0.8, cardHeight * 0.2, 80, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(cardWidth * 0.2, cardHeight * 0.8, 60, 0, 2 * Math.PI);
      ctx.fill();

      // 繪製主要邊框
      ctx.strokeStyle = '#EADBC8';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, cardWidth - 6, cardHeight - 6);
      
      // 繪製內邊框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, cardWidth - 16, cardHeight - 16);

      // 繪製標題背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(20, 20, cardWidth - 40, 60);
      
      // 繪製標題
      ctx.fillStyle = '#4B4036';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Hanami 音樂教育', cardWidth / 2, 45);
      ctx.font = '13px Arial';
      ctx.fillText('學生證 Student ID Card', cardWidth / 2, 65);
      
      // 繪製裝飾線
      ctx.strokeStyle = '#FFB6C1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardWidth * 0.2, 70);
      ctx.lineTo(cardWidth * 0.8, 70);
      ctx.stroke();

      // 繪製學生照片區域
      const photoSize = 80;
      const photoX = (cardWidth - photoSize) / 2;
      const photoY = 100;
      
      // 繪製照片陰影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(photoX + 3, photoY + 3, photoSize, photoSize);
      
      // 繪製照片背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      
      // 繪製照片邊框
      ctx.strokeStyle = '#FFB6C1';
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX, photoY, photoSize, photoSize);
      
      // 繪製內邊框
      ctx.strokeStyle = '#EADBC8';
      ctx.lineWidth = 1;
      ctx.strokeRect(photoX + 2, photoY + 2, photoSize - 4, photoSize - 4);

      // 嘗試載入學生照片
      try {
        // 如果沒有設定性別，預設為男生
        const photoUrl = student.gender === 'female' ? '/girl.png' : '/boy.png';
        const photoImage = new Image();
        photoImage.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          photoImage.onload = () => {
            try {
              // 繪製圓形照片
              ctx.save();
              ctx.beginPath();
              ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 - 2, 0, 2 * Math.PI);
              ctx.clip();
              ctx.drawImage(photoImage, photoX + 2, photoY + 2, photoSize - 4, photoSize - 4);
              ctx.restore();
              resolve(true);
            } catch (error) {
              reject(error);
            }
          };
          photoImage.onerror = () => {
            // 如果照片載入失敗，繪製默認圖標
            ctx.fillStyle = '#EADBC8';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👤', photoX + photoSize / 2, photoY + photoSize / 2 + 8);
            resolve(true);
          };
          photoImage.src = photoUrl;
        });
      } catch (error) {
        console.warn('無法載入學生照片，使用默認圖標:', error);
        // 繪製默認圖標
        ctx.fillStyle = '#EADBC8';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👤', photoX + photoSize / 2, photoY + photoSize / 2 + 8);
      }

      // 繪製學生姓名背景
      const nameY = photoY + photoSize + 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(photoX - 10, nameY - 15, photoSize + 20, 30);
      
      // 繪製學生資訊
      ctx.fillStyle = '#4B4036';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(student.full_name, cardWidth / 2, nameY + 5);

      // 繪製QR碼區域
      const qrSize = 120;
      const qrX = (cardWidth - qrSize) / 2;
      const qrY = nameY + 35;
      
      // 繪製QR碼陰影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(qrX + 3, qrY + 3, qrSize, qrSize);
      
      // 繪製QR碼背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      // 繪製QR碼邊框
      ctx.strokeStyle = '#FFB6C1';
      ctx.lineWidth = 3;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      
      // 繪製內邊框
      ctx.strokeStyle = '#EADBC8';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX + 2, qrY + 2, qrSize - 4, qrSize - 4);

      // 生成並繪製QR碼
      try {
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(student.id)}`;
        
        // 創建圖片元素來載入QR碼
        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          qrImage.onload = () => {
            try {
              ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
              resolve(true);
            } catch (error) {
              reject(error);
            }
          };
          qrImage.onerror = reject;
          qrImage.src = qrCodeUrl;
        });
      } catch (error) {
        console.warn('無法載入QR碼，使用文字替代:', error);
        // 如果QR碼載入失敗，繪製文字替代
        ctx.fillStyle = '#4B4036';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', cardWidth / 2, qrY + qrSize / 2 - 10);
        ctx.font = '10px Arial';
        ctx.fillText(student.id.substring(0, 8), cardWidth / 2, qrY + qrSize / 2 + 10);
      }

      // 繪製詳細資訊背景
      const infoY = qrY + qrSize + 20;
      const infoHeight = 100;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(20, infoY - 10, cardWidth - 40, infoHeight);
      
      // 繪製資訊標題
      ctx.fillStyle = '#4B4036';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('學生資訊 Student Information', cardWidth / 2, infoY + 5);
      
      // 繪製裝飾線
      ctx.strokeStyle = '#FFB6C1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardWidth * 0.2, infoY + 10);
      ctx.lineTo(cardWidth * 0.8, infoY + 10);
      ctx.stroke();
      
      // 繪製詳細資訊
      const infoStartY = infoY + 25;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('年齡 Age:', 30, infoStartY);
      ctx.fillText('出生日期 DOB:', 30, infoStartY + 18);
      ctx.fillText('入學日期 Start:', 30, infoStartY + 36);
      ctx.fillText('學生編號 ID:', 30, infoStartY + 54);

      ctx.font = '11px Arial';
      ctx.fillText(formatAge(student.student_age), 120, infoStartY);
      ctx.fillText(formatDate(student.student_dob), 120, infoStartY + 18);
      ctx.fillText(formatDate(student.started_date), 120, infoStartY + 36);
      ctx.fillText(student.student_oid || student.id, 120, infoStartY + 54);
      
      // 繪製底部裝飾
      ctx.fillStyle = '#FFB6C1';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Hanami Music Education', cardWidth / 2, cardHeight - 20);

      // 創建下載連結
      const link = document.createElement('a');
      link.download = `學生證_${student.full_name}_${student.student_oid || student.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('下載失敗:', error);
      alert('下載失敗，請稍後再試');
    } finally {
      setIsDownloading(false);
    }
  };

  // 列印學生證
  const handlePrint = () => {
    const cardElement = document.getElementById('student-id-card');
    if (!cardElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>學生證 - ${student.full_name}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .card-container {
              transform: scale(1.2);
              transform-origin: center;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            ${cardElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題欄 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#4B4036]">學生證</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-2 text-[#A68A64] hover:bg-[#FFD59A]/20 rounded-lg transition-colors disabled:opacity-50"
                  title="下載學生證"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-[#A68A64] hover:bg-[#FFD59A]/20 rounded-lg transition-colors"
                  title="列印學生證"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 學生證內容 */}
            <div
              id="student-id-card"
              className="rounded-2xl p-6 shadow-lg border-2 border-[#EADBC8]"
              style={{
                background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)'
              }}
            >
              {/* 標題 */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#4B4036] mb-2">Hanami 音樂教育</h3>
                <p className="text-[#2B3A3B] text-sm">學生證 Student ID Card</p>
              </div>

              {/* 學生資訊區域 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 左側：學生照片和基本資訊 */}
                <div className="space-y-4">
                  {/* 學生照片 */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                      <img
                        alt="學生照片"
                        className="w-full h-full rounded-full object-cover"
                        src={student.gender === 'female' ? '/girl.png' : '/boy.png'}
                      />
                    </div>
                  </div>

                  {/* 學生基本資訊 */}
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>姓名 Name</div>
                      <div style={{ color: '#2B3A3B' }}>{student.full_name}</div>
                    </div>
                    
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>年齡 Age</div>
                      <div style={{ color: '#2B3A3B' }}>
                        {formatAge(student.student_age)}
                      </div>
                    </div>

                    {student.course_type && (
                      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>課程 Course</div>
                        <div style={{ color: '#2B3A3B' }}>{student.course_type}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側：QR碼和詳細資訊 */}
                <div className="space-y-4">
                  {/* QR碼 */}
                  <div className="flex justify-center">
                    <div className="bg-white rounded-lg p-3 shadow-md">
                      <QRCodeGenerator 
                        text={student.id} 
                        size={120}
                        className="mx-auto"
                      />
                    </div>
                  </div>

                  {/* 詳細資訊 */}
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>學生編號 ID</div>
                      <div className="font-mono text-xs" style={{ color: '#2B3A3B' }}>
                        {student.student_oid || student.id}
                      </div>
                    </div>
                    
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>出生日期 DOB</div>
                      <div style={{ color: '#2B3A3B' }}>
                        {formatDate(student.student_dob)}
                      </div>
                    </div>

                    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="font-semibold mb-1" style={{ color: '#4B4036' }}>入學日期 Start</div>
                      <div style={{ color: '#2B3A3B' }}>
                        {formatDate(student.started_date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部裝飾 */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFB6C1' }}></div>
                  <span className="text-xs font-medium" style={{ color: '#2B3A3B' }}>Hanami Music Education</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFB6C1' }}></div>
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? '下載中...' : '下載學生證'}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D8CDBF] transition-colors"
              >
                <Printer className="w-4 h-4" />
                列印
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
