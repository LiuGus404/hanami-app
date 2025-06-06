import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type LessonPlan = {
  id: string;
  lesson_date: string;
  timeslot: string;
  course_type: string;
  topic: string;
  objectives: string[];
  materials: string[];
  teacher_ids: string[];
  teacher_names: string[];
  teacher_ids_1: string[];
  teacher_ids_2: string[];
  theme: string;
  notes: string;
  created_at: string;
};

export const useLessonPlans = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  const fetchPlans = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('hanami_lesson_plan')
        .select('*')
        .gte('lesson_date', startDate.toISOString().split('T')[0])
        .lte('lesson_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // 查詢所有老師
      const { data: teachers } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname');

      // 幫每個 plan 加上 teacher_names
      const plansWithNames = (data || []).map(plan => ({
        ...plan,
        teacher_names: (plan.teacher_ids || []).map(
          id => teachers?.find(t => t.id === id)?.teacher_nickname || '未知老師'
        ),
      }));

      setPlans(plansWithNames);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (plan: Omit<LessonPlan, 'id' | 'created_at'>) => {
    try {
      const { data, error: saveError } = await supabase
        .from('hanami_lesson_plan')
        .insert({
          lesson_date: plan.lesson_date,
          timeslot: plan.timeslot,
          course_type: plan.course_type,
          topic: plan.topic,
          objectives: plan.objectives,
          materials: plan.materials,
          teacher_ids: plan.teacher_ids,
          teacher_names: plan.teacher_names,
          teacher_ids_1: plan.teacher_ids_1,
          teacher_ids_2: plan.teacher_ids_2,
          theme: plan.theme,
          notes: plan.notes
        })
        .select();

      if (saveError) throw saveError;

      if (data) {
        const newPlan: LessonPlan = {
          ...data[0],
          teacher_names: plan.teacher_names,
        };
        setPlans(prev => [...prev, newPlan]);
      }
    } catch (err) {
      console.error('Error saving lesson plan:', err);
      throw err;
    }
  };

  const updatePlan = async (plan: LessonPlan) => {
    try {
      const { error: updateError } = await supabase
        .from('hanami_lesson_plan')
        .update({
          lesson_date: plan.lesson_date,
          timeslot: plan.timeslot,
          course_type: plan.course_type,
          topic: plan.topic,
          objectives: plan.objectives,
          materials: plan.materials,
          teacher_ids: plan.teacher_ids,
          teacher_names: plan.teacher_names,
          teacher_ids_1: plan.teacher_ids_1,
          teacher_ids_2: plan.teacher_ids_2,
          theme: plan.theme,
          notes: plan.notes
        })
        .eq('id', plan.id);

      if (updateError) throw updateError;

      setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    } catch (err) {
      console.error('Error updating lesson plan:', err);
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('hanami_lesson_plan')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting lesson plan:', err);
      throw err;
    }
  };

  return {
    plans,
    loading,
    fetchPlans,
    savePlan,
    updatePlan,
    deletePlan,
  };
};

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname');
      console.log('teacher data:', data, 'error:', error);
      if (!error && data) {
        setTeachers(data.map(t => ({
          id: t.id,
          name: t.teacher_nickname || '未命名'
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { teachers, loading };
};