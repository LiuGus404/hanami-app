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

      // 直接使用列印功能，用戶可以選擇「另存為PDF」
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('無法開啟新視窗，請檢查瀏覽器設定');
        return;
      }

      // 獲取所有相關的CSS樣式
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n');

      printWindow.document.write(`
        <html>
          <head>
            <title>學生證 - ${student.full_name}</title>
            <style>
              ${styles}
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              .card-container {
                transform: scale(1.5);
                transform-origin: center;
              }
              @media print {
                body { 
                  background: white !important;
                  padding: 0;
                }
                .card-container {
                  transform: scale(1);
                  transform-origin: top left;
                }
                #student-id-card {
                  background-image: url('/3d-character-backgrounds/studentcard/studentcard.png') !important;
                  background-size: cover !important;
                  background-position: center !important;
                  background-repeat: no-repeat !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                #student-id-card * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="card-container">
              ${cardElement.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      alert('已開啟列印視窗，您可以選擇「另存為PDF」來下載學生證');
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

    // 獲取所有相關的CSS樣式
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>學生證 - ${student.full_name}</title>
          <style>
            ${styles}
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .card-container {
              transform: scale(1.2);
              transform-origin: center;
            }
            @media print {
              body { 
                background: white !important;
                padding: 0;
              }
              .card-container {
                transform: scale(1);
                transform-origin: top left;
              }
              #student-id-card {
                background-image: url('/3d-character-backgrounds/studentcard/studentcard.png') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              #student-id-card * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
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
    
    // 等待圖片載入完成後再列印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
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
              className="rounded-2xl p-6 shadow-lg border-2 border-[#EADBC8] relative overflow-hidden"
              style={{
                backgroundImage: 'url(/3d-character-backgrounds/studentcard/studentcard.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
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
                    <div className="bg-white/90 rounded-lg p-3 shadow-md">
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
