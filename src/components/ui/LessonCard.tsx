import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Props:
 * - time: string (如 '09:30–10:15')
 * - course: { name: string, icon?: string }
 * - teachers: { name: string, avatar?: string }[]
 * - students: { name: string, age?: string, isTrial?: boolean, remainingLessons?: number, avatar?: string, teacher?: string, id?: string }[]
 * - plan?: { teacherNames: string[], objectives: string, materials: string }
 * - onEdit: () => void
 * - startTime?: string
 * - duration?: string
 * - onClose?: () => void
 * - allShowTeachers?: boolean
 * - allShowStudents?: boolean
 * - allShowPlan?: boolean
 */

interface LessonCardProps {
  time: string;
  course: { name: string; icon?: string };
  teachers: { name: string; avatar?: string }[];
  students: { name: string; age?: string; isTrial?: boolean; remainingLessons?: number; avatar?: string; teacher?: string; id?: string }[];
  plan?: {
    teacherNames: string[];
    teacherNames1: string[];
    teacherNames2: string[];
    objectives: string[];
    materials: string[];
    theme?: string;
    notes?: string;
  };
  onEdit: () => void;
  startTime?: string;
  duration?: string;
  onClose?: () => void;
  allShowTeachers?: boolean;
  allShowStudents?: boolean;
  allShowPlan?: boolean;
}

const getStudentBg = (remainingLessons?: number, isTrial?: boolean) => {
  if (isTrial) return 'bg-[#FFF7D6]';
  if (remainingLessons === 1) return 'bg-[#FFB3B3]';
  if (remainingLessons === 2) return 'bg-[#FFDF9F]';
  return 'bg-[#F5E7D4]';
};

const LessonCard: React.FC<LessonCardProps> = ({
  time,
  course,
  teachers,
  students,
  plan,
  onEdit,
  startTime,
  duration,
  onClose,
  allShowTeachers = true,
  allShowStudents = true,
  allShowPlan = true,
}) => {
  const router = useRouter();
  const [showTeachers, setShowTeachers] = useState(allShowTeachers);
  const [showStudents, setShowStudents] = useState(allShowStudents);
  const [showPlan, setShowPlan] = useState(allShowPlan);

  // 計算時間區間顯示
  let timeDisplay = time;
  if (startTime && duration) {
    const [h, m] = startTime.split(':').map(Number);
    const [dh, dm] = duration.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, h, m);
    const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000);
    const eh = endDate.getHours().toString().padStart(2, '0');
    const em = endDate.getMinutes().toString().padStart(2, '0');
    timeDisplay = `${startTime.slice(0, 5)}-${eh}:${em}`;
  }

  return (
    <div className="bg-[#FFFDF8] rounded-xl shadow p-4 flex flex-col items-start gap-1 border border-[#EADBC8] w-full max-w-md mx-auto mb-4 relative">
      {/* 右上角按鈕區塊 */}
      <div className="absolute top-3 right-3 flex gap-4 z-10">
        <button
          className="hover:bg-[#F5E7D4] flex items-center justify-center transition-colors"
          style={{ border: 'none', background: 'none', padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
            if (onClose) onClose(); // 點擊編輯時同時關閉卡片
          }}
        >
          <img src="/icons/edit-pencil.png" alt="Edit" className="w-5 h-5" />
        </button>
        <button
          className="hover:bg-[#F5E7D4] text-[#A33] text-sm font-bold flex items-center justify-center transition-colors"
          style={{ border: 'none', background: 'none', padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onClose) onClose();
          }}
        >
          <img src="/close.png" alt="Close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col w-full mb-1">
        <div className="text-sm font-bold text-[#4B4036]">{timeDisplay}</div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1">
            {course.icon ? (
              <img src={course.icon} alt={course.name} className="w-5 h-5" />
            ) : (
              <span className="text-xl"></span>
            )}
            <span className="text-sm font-semibold text-[#4B4036]">{course.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-[#7A6654]">
        <img src="/teacher.png" alt="teacher" className="w-4 h-4" />
        <span>老師</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTeachers(!showTeachers);
          }}
          className="ml-1 text-[9px] underline text-[#4B4036]"
        >
          {showTeachers ? '收起' : '展開'}
        </button>
      </div>
      {showTeachers && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            <div>（1）{plan && Array.isArray(plan.teacherNames1) && plan.teacherNames1.length > 0 ? plan.teacherNames1.join('、') : '未分配'}</div>
            <div>（2）{plan && Array.isArray(plan.teacherNames2) && plan.teacherNames2.length > 0 ? plan.teacherNames2.join('、') : '未分配'}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-0 text-[11px] text-[#7A6654]">
        <img src="/icons/penguin-face.png" alt="students" className="w-4 h-4" />
        <span>學生</span>
        <span className="flex items-center gap-0 text-[10px] text-[#4B4036] font-semibold">（{students.length}）</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStudents(!showStudents);
          }}
          className="ml-1 text-[9px] underline text-[#4B4036]"
        >
          {showStudents ? '收起' : '展開'}
        </button>
      </div>
      {showStudents && (
        <div className="flex flex-wrap gap-2 mb-2 max-h-[120px] overflow-y-auto">
          {students.map((stu, i) => (
            <button
              key={i}
              className={`flex items-center px-3 py-1 rounded-full text-[#4B4036] text-[10px] font-semibold shadow-sm ${getStudentBg(stu.remainingLessons, stu.isTrial)}`}
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/admin/students/${stu.id}`)}
            >
              {stu.name}
              {stu.age && (
                <span className="ml-1 text-[10px] text-[#87704e]">
                  ({(() => {
                    const months = typeof stu.age === 'string' ? parseInt(stu.age) : stu.age;
                    if (isNaN(months)) return '';
                    
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    
                    if (years === 0) return `${remainingMonths}M`;
                    return `${years}Y${remainingMonths ? remainingMonths + 'M' : ''}`;
                  })()})
                </span>
              )}
              {stu.isTrial && <img src="/trial.png" alt="Trial" className="ml-1 w-3 h-3" />}
              {stu.teacher && (
                <span className="ml-1 text-[10px] text-[#4B4036] bg-[#F0ECE6] px-1 rounded">
                  {stu.teacher}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-[11px] text-[#7A6654] mt-1">
        <img src="/details.png" alt="details" className="w-4 h-4" />
        <span>課堂活動</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPlan(!showPlan);
          }}
          className="ml-1 text-[9px] underline text-[#4B4036]"
        >
          {showPlan ? '收起' : '展開'}
        </button>
      </div>
      {showPlan && (
        <div className="flex flex-col gap-2 mb-2">
          {/* 課堂主題 */}
          <div>
            <span className="font-semibold text-[11px] text-[#7A6654]">課堂主題：</span>
            <span className="text-[10px] text-[#4B4036]">{plan?.theme || '未設定'}</span>
          </div>
          {/* 課堂目標 */}
          <div>
            <span className="font-semibold text-[11px] text-[#7A6654]">課堂目標：</span>
            {plan?.objectives && plan.objectives.length > 0 ? (
              <ul className="list-disc ml-4">
                {plan.objectives.map((obj, idx) => (
                  <li key={idx} className="text-[10px] text-[#4B4036]">{obj}</li>
                ))}
              </ul>
            ) : (
              <span className="text-[10px] text-[#87704e] italic">未設定</span>
            )}
          </div>
          {/* 課堂活動 */}
          <div>
            <span className="font-semibold text-[11px] text-[#7A6654]">課堂活動：</span>
            {plan?.materials && plan.materials.length > 0 ? (
              <ul className="list-disc ml-4">
                {plan.materials.map((activity, idx) => (
                  <li key={idx} className="text-[10px] text-[#4B4036]">{activity}</li>
                ))}
              </ul>
            ) : (
              <span className="text-[10px] text-[#87704e] italic">未安排</span>
            )}
          </div>
          {/* 課堂備註 */}
          <div>
            <span className="font-semibold text-[11px] text-[#7A6654]">課堂備註：</span>
            <span className="text-[10px] text-[#4B4036]">{plan?.notes || '—'}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default LessonCard;