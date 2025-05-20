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
  remarks: string;
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

  const upsertPlan = async (plan: Omit<LessonPlan, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('hanami_lesson_plan')
        .upsert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting lesson plan:', error);
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hanami_lesson_plan')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      throw error;
    }
  };

  return {
    plans,
    loading,
    fetchPlans,
    upsertPlan,
    deletePlan,
  };
}; 