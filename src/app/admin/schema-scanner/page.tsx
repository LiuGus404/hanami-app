'use client';

import { useState } from 'react';

import { supabase } from '@/lib/supabase';

type ScanMode = 'simple'

export default function SchemaScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('simple');
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scanResult, setScanResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setError('');

    try {
      // 簡化掃描功能，直接使用 scanDatabase
      await scanDatabase();
      setReport('資料庫掃描完成，請查看掃描結果。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '掃描失敗');
    } finally {
      setIsScanning(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-schema-report-${scanMode}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scanDatabase = async () => {
    setLoading(true);
    setScanResult('開始掃描資料庫...\n');

    try {
      // 檢查 hanami_student_lesson 表
      setScanResult(prev => `${prev}\n🔍 檢查 hanami_student_lesson 表...\n`);

      const { data: lessonData, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .limit(10);

      if (lessonError) {
        setScanResult(prev => `${prev}❌ 錯誤: ${lessonError.message}\n`);
        if (lessonError.code === 'PGRST116') {
          setScanResult(prev => `${prev}💡 提示: 這可能是RLS權限問題，請執行 fix_hanami_student_lesson_rls.sql 腳本\n`);
        }
      } else {
        setScanResult(prev => `${prev}✅ 找到 ${lessonData?.length || 0} 筆課堂記錄\n`);
        if (lessonData && lessonData.length > 0) {
          setScanResult(prev => `${prev}📋 範例資料:\n${JSON.stringify(lessonData[0], null, 2)}\n`);
        }
      }

      // 檢查 Hanami_Students 表
      setScanResult(prev => `${prev}\n🔍 檢查 Hanami_Students 表...\n`);

      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(5);

      const typedStudentData = (studentData || []) as Array<{ id: string; full_name: string; student_type: string;[key: string]: any }>;

      if (studentError) {
        setScanResult(prev => `${prev}❌ 錯誤: ${studentError.message}\n`);
      } else {
        setScanResult(prev => `${prev}✅ 找到 ${typedStudentData.length || 0} 筆學生記錄\n`);
        if (typedStudentData.length > 0) {
          setScanResult(prev => `${prev}📋 學生列表:\n${typedStudentData.map(s => `${s.id}: ${s.full_name} (${s.student_type})`).join('\n')}\n`);
        }
      }

      // 檢查特定學生的課堂資料
      if (typedStudentData.length > 0) {
        const testStudent = typedStudentData[0];
        setScanResult(prev => `${prev}\n🔍 檢查學生 ${testStudent.full_name} (${testStudent.student_type}) 的課堂資料...\n`);

        if (testStudent.student_type === '試堂' || testStudent.student_type === 'trial') {
          // 檢查試堂學生課堂資料
          const { data: trialLessons, error: trialLessonError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .eq('id', testStudent.id);

          if (trialLessonError) {
            setScanResult(prev => `${prev}❌ 錯誤: ${trialLessonError.message}\n`);
          } else {
            setScanResult(prev => `${prev}✅ 試堂學生課堂資料: ${JSON.stringify(trialLessons?.[0] || {}, null, 2)}\n`);
          }
        } else {
          // 檢查常規學生課堂資料
          const { data: studentLessons, error: studentLessonError } = await supabase
            .from('hanami_student_lesson')
            .select('*')
            .eq('student_id', testStudent.id);

          if (studentLessonError) {
            setScanResult(prev => `${prev}❌ 錯誤: ${studentLessonError.message}\n`);
          } else {
            setScanResult(prev => `${prev}✅ 該學生有 ${studentLessons?.length || 0} 筆課堂記錄\n`);
          }
        }
      }

    } catch (error) {
      setScanResult(prev => `${prev}❌ 掃描失敗: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    setLoading(true);
    setScanResult('開始創建測試資料...\n');

    try {
      // 先獲取一個學生
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(5)
        .returns<Array<{ id: string; full_name: string; student_type: string }>>();

      if (studentError || !students || students.length === 0) {
        setScanResult(prev => `${prev}❌ 無法獲取學生資料\n`);
        return;
      }

      setScanResult(prev => `${prev}📝 找到 ${students.length} 個學生，開始創建測試課堂資料...\n`);

      for (const student of students) {
        setScanResult(prev => `${prev}\n🎯 為學生 ${student.full_name} (${student.id}) 創建課堂資料...\n`);

        if (student.student_type === '試堂' || student.student_type === 'trial') {
          // 試堂學生：更新 hanami_trial_students 表
          const { error: updateError } = await (supabase
            .from('hanami_trial_students') as any)
            .update({
              lesson_date: new Date().toISOString().split('T')[0],
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              student_teacher: '張老師',
              lesson_duration: '00:45:00',
            })
            .eq('id', student.id);

          if (updateError) {
            setScanResult(prev => `${prev}❌ 更新試堂學生課堂資料失敗: ${updateError.message}\n`);
          } else {
            setScanResult(prev => `${prev}✅ 成功更新試堂學生課堂資料\n`);
          }
        } else {
          // 常規學生：在 hanami_student_lesson 表中創建記錄
          const testLessons = [
            {
              student_id: student.id,
              lesson_date: new Date().toISOString().split('T')[0], // 今天
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: '出席',
              full_name: student.full_name,
            },
            {
              student_id: student.id,
              lesson_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 一週前
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: '出席',
              full_name: student.full_name,
            },
            {
              student_id: student.id,
              lesson_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 一週後
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: null,
              full_name: student.full_name,
            },
          ];

          for (const lesson of testLessons) {
            const { error: insertError } = await (supabase
              .from('hanami_student_lesson') as any)
              .insert(lesson);

            if (insertError) {
              setScanResult(prev => `${prev}❌ 創建課堂資料失敗: ${insertError.message}\n`);
            } else {
              setScanResult(prev => `${prev}✅ 成功創建課堂資料: ${lesson.lesson_date}\n`);
            }
          }
        }
      }

      setScanResult(prev => `${prev}\n🎉 測試資料創建完成！\n`);

    } catch (error) {
      setScanResult(prev => `${prev}❌ 創建測試資料失敗: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const checkSpecificStudent = async () => {
    setLoading(true);
    setScanResult('開始檢查特定學生課堂資料...\n');

    try {
      // 獲取第一個學生
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(1)
        .returns<Array<{ id: string; full_name: string; student_type: string }>>();

      if (studentError || !students || students.length === 0) {
        setScanResult(prev => `${prev}❌ 無法獲取學生資料\n`);
        return;
      }

      const student = students[0];
      setScanResult(prev => `${prev}🎯 檢查學生 ${student.full_name} (${student.id}) 的課堂資料...\n`);

      if (student.student_type === '試堂' || student.student_type === 'trial') {
        // 檢查試堂學生
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .eq('id', student.id);

        if (trialError) {
          setScanResult(prev => `${prev}❌ 查詢試堂學生資料失敗: ${trialError.message}\n`);
        } else {
          setScanResult(prev => `${prev}✅ 試堂學生資料: ${JSON.stringify(trialData, null, 2)}\n`);
        }
      } else {
        // 檢查常規學生的課堂資料
        const { data: lessonData, error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .eq('student_id', student.id);

        if (lessonError) {
          setScanResult(prev => `${prev}❌ 查詢課堂資料失敗: ${lessonError.message}\n`);
        } else {
          setScanResult(prev => `${prev}✅ 課堂資料數量: ${lessonData?.length || 0}\n`);
          if (lessonData && lessonData.length > 0) {
            setScanResult(prev => `${prev}📋 課堂資料: ${JSON.stringify(lessonData[0], null, 2)}\n`);
          }
        }
      }

    } catch (error) {
      setScanResult(prev => `${prev}❌ 檢查失敗: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Supabase 資料庫結構掃描器</h1>
        <p className="text-gray-600 mb-6">
          掃描並分析 Supabase 資料庫的所有表格、欄位和 RLS 策略
        </p>

        {/* 掃描模式選擇 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">選擇掃描模式:</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                checked={scanMode === 'simple'}
                className="mr-2"
                type="radio"
                value="simple"
                onChange={(e) => setScanMode(e.target.value as ScanMode)}
              />
              <span>簡單掃描 (基本資訊)</span>
            </label>

          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isScanning}
            onClick={handleScan}
          >
            {isScanning ? '掃描中...' : '開始簡單掃描'}
          </button>

          {report && (
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={downloadReport}
            >
              下載報告
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>錯誤:</strong> {error}
          </div>
        )}


      </div>

      {report && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📄 完整報告</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm overflow-x-auto">{report}</pre>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">資料庫資料檢查</h2>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={scanDatabase}
        >
          {loading ? '掃描中...' : '開始掃描資料庫'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">掃描結果：</h2>
        <div className="bg-white rounded-lg p-4 border border-[#E9E2D6]">
          <pre className="text-sm text-[#4B4036] whitespace-pre-wrap bg-gray-50 p-4 rounded border">
            {scanResult || '尚未開始掃描'}
          </pre>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">創建測試資料</h2>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={createTestData}
        >
          {loading ? '創建中...' : '開始創建測試資料'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">檢查特定學生課堂資料</h2>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={checkSpecificStudent}
        >
          {loading ? '檢查中...' : '開始檢查特定學生課堂資料'}
        </button>
      </div>
    </div>
  );
} 