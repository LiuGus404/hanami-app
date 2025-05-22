import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LessonPlan, Teacher } from '@/types';

interface UseLessonPlansProps {
  lessonDate: string;
  timeslot: string;
  courseType: string;
}

export const useLessonPlans = ({ lessonDate, timeslot, courseType }: UseLessonPlansProps) => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data: teacherData, error } = await supabase
          .from('hanami_employee')
          .select('*')
          .eq('teacher_status', 'active');

        if (error) throw error;

        if (teacherData) {
          const formattedTeachers: Teacher[] = teacherData.map(teacher => ({
            id: teacher.id,
            teacher_fullname: teacher.teacher_fullname ?? '',
            teacher_nickname: teacher.teacher_nickname ?? '',
            teacher_role: teacher.teacher_role ?? null,
            teacher_status: teacher.teacher_status ?? null,
            teacher_email: teacher.teacher_email ?? null,
            teacher_phone: teacher.teacher_phone ?? null,
            teacher_address: teacher.teacher_address ?? null,
            teacher_gender: (teacher as any).teacher_gender ?? null,
            teacher_dob: teacher.teacher_dob ?? null,
            teacher_hsalary: typeof teacher.teacher_hsalary === 'number' ? teacher.teacher_hsalary : null,
            teacher_msalary: typeof teacher.teacher_msalary === 'number' ? teacher.teacher_msalary : null,
            teacher_background: teacher.teacher_background ?? null,
            teacher_bankid: teacher.teacher_bankid ?? null,
            created_at: teacher.created_at ?? null,
            updated_at: teacher.updated_at ?? null
          }));
          setTeachers(formattedTeachers);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    const fetchPlans = async () => {
    try {
        const { data: planData, error } = await supabase
        .from('hanami_lesson_plan')
        .select('*')
          .eq('lesson_date', lessonDate)
          .eq('timeslot', timeslot)
          .eq('course_type', courseType);

      if (error) throw error;

        if (planData) {
          const formattedPlans: LessonPlan[] = planData.map(plan => ({
        ...plan,
            teacher_names: plan.teacher_ids.map(id => {
              const teacher = teachers.find(t => t.id === id);
              return teacher ? teacher.teacher_nickname : '未知老師';
            }),
            teacherNames1: plan.teacher_ids_1.map(id => {
              const teacher = teachers.find(t => t.id === id);
              return teacher ? teacher.teacher_nickname : '未知老師';
            }),
            teacherNames2: plan.teacher_ids_2.map(id => {
              const teacher = teachers.find(t => t.id === id);
              return teacher ? teacher.teacher_nickname : '未知老師';
            })
      }));
          setPlans(formattedPlans);
        }
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
    } finally {
      setLoading(false);
    }
  };

    fetchTeachers();
    fetchPlans();
  }, [lessonDate, timeslot, courseType, teachers]);

  const savePlan = async (plan: Omit<LessonPlan, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('hanami_lesson_plan')
        .insert({
          lesson_date: plan.lesson_date,
          timeslot: plan.timeslot,
          course_type: plan.course_type,
          topic: plan.topic,
          objectives: plan.objectives,
          materials: plan.materials,
          teacher_ids: plan.teacher_ids,
          teacher_ids_1: plan.teacher_ids_1,
          teacher_ids_2: plan.teacher_ids_2,
          teacher_names: plan.teacher_names,
          theme: plan.theme,
          notes: plan.notes
        })
        .select();

      if (error) throw error;

      if (data) {
        const newPlan: LessonPlan = {
          ...data[0],
          teacher_names: plan.teacher_names,
          teacherNames1: plan.teacherNames1,
          teacherNames2: plan.teacherNames2
        };
        setPlans(prev => [...prev, newPlan]);
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
    }
  };

  const updatePlan = async (plan: LessonPlan) => {
    try {
      const { error } = await supabase
        .from('hanami_lesson_plan')
        .update({
          lesson_date: plan.lesson_date,
          timeslot: plan.timeslot,
          course_type: plan.course_type,
          topic: plan.topic,
          objectives: plan.objectives,
          materials: plan.materials,
          teacher_ids: plan.teacher_ids,
          teacher_ids_1: plan.teacher_ids_1,
          teacher_ids_2: plan.teacher_ids_2,
          teacher_names: plan.teacher_names,
          theme: plan.theme,
          notes: plan.notes
        })
        .eq('id', plan.id);

      if (error) throw error;

      setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    } catch (error) {
      console.error('Error updating lesson plan:', error);
    }
  };

  return {
    plans,
    teachers,
    loading,
    savePlan,
    updatePlan
  };
}; 