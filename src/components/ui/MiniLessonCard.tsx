import React, { useState } from 'react';

interface MiniLessonCardProps {
  time: string;
  course: { name: string; icon?: string; activities?: string[] };
  students: { name: string; isTrial?: boolean; remainingLessons?: number; age?: string }[];
  plan?: {
    teacherNames1?: string[];
    teacherNames2?: string[];
    objectives: string[];
    materials: string[];
  };
  onClick: () => void;
  onEdit: () => void;
  duration?: string;
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

const MiniLessonCard: React.FC<MiniLessonCardProps> = ({
  time,
  course,
  students,
  plan,
  onClick,
  onEdit,
  duration,
  allShowTeachers = true,
  allShowStudents = true,
  allShowPlan = true,
}) => {
  const [showStudents, setShowStudents] = useState(true);
  const [showPlan, setShowPlan] = useState(true);
  const [showTeachers, setShowTeachers] = useState(true);

  // 全局開關同步
  React.useEffect(() => {
    setShowTeachers(allShowTeachers);
  }, [allShowTeachers]);
  React.useEffect(() => {
    setShowStudents(allShowStudents);
  }, [allShowStudents]);
  React.useEffect(() => {
    setShowPlan(allShowPlan);
  }, [allShowPlan]);

  let timeDisplay = time;
  if (time && duration) {
    const [h, m] = time.split(':').map(Number);
    const [dh, dm] = duration.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, h, m);
    const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000);
    const eh = endDate.getHours().toString().padStart(2, '0');
    const em = endDate.getMinutes().toString().padStart(2, '0');
    timeDisplay = `${time.slice(0, 5)}-${eh}:${em}`;
  }

  return (
    <div
      className="bg-[#FFFDF8] rounded-xl shadow p-2 flex flex-col items-start gap-1 border border-[#EADBC8] cursor-pointer hover:shadow-lg transition min-w-[110px] max-w-[140px] relative"
      onClick={onClick}
    >
      {/* 編輯按鈕 */}
      <button
        className="absolute top-1 right-1 z-10 bg-[#FFFDF8] rounded-full p-1 shadow hover:bg-[#F5E7D4]"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <img src="/icons/edit-pencil.png" alt="Edit" className="w-4 h-4" />
      </button>

      <div className="mb-0.5">
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-[#4B4036]">{timeDisplay.split('-')[0]}</span>
          {timeDisplay.includes('-') && (
            <span className="text-[10px] text-[#7A6654]">-{timeDisplay.split('-')[1]}</span>
          )}
        </div>
      </div>
      <div className="text-xs text-[#6B5C4D] mb-1">{course.name}</div>
      <div className="flex items-center gap-0 text-[11px] text-[#7A6654]">
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
        <div className="flex items-start gap-1 text-[10px] text-[#4B4036] mb-1 ml-0.5">
          <div className="flex flex-col justify-center items-start">
            <div>（1）{plan?.teacherNames1?.length > 0 ? plan.teacherNames1.join('、') : '未分配'}</div>
            <div>（2）{plan?.teacherNames2?.length > 0 ? plan.teacherNames2.join('、') : '未分配'}</div>
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
        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
          {students.map((stu, i) => (
            <div
              key={i}
              className={`flex items-center px-2 py-0.5 rounded-full text-[#4B4036] text-[10px] font-semibold ${getStudentBg(stu.remainingLessons, stu.isTrial)}`}
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
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 text-[11px] text-[#7A6654] mt-1">
        <img src="/details.png" alt="details" className="w-4 h-4" />
        <span>課堂活動</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPlan((prev) => !prev);
          }}
          className="ml-1 text-[9px] underline text-[#4B4036]"
        >
          {showPlan ? '收起' : '展開'}
        </button>
      </div>
      {showPlan && (
        <div className="flex flex-col gap-1">
          {plan?.materials?.length > 0 ? (
            plan.materials.map((activity, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="text-[10px] text-[#4B4036] bg-[#F0ECE6] px-2 py-0.5 rounded-full w-fit">
                  {activity}
                </div>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-[#87704e] italic">未安排</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniLessonCard; 