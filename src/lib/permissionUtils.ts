import { supabase } from './supabase';

// 權限檢查工具函數
export const permissionUtils = {
  // 檢查用戶是否可以查看特定學生
  canViewStudent: async (userId: string, userType: string, studentId: string) => {
    try {
      // 管理員可以查看所有學生
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該學生的老師
      if (userType === 'teacher') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('student_teacher')
          .eq('id', studentId)
          .single();

        return student?.student_teacher === userId;
      }

      // 家長檢查是否為該學生的家長
      if (userType === 'parent') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('parent_email')
          .eq('id', studentId)
          .single();

        // 這裡需要根據實際的家長認證邏輯來實現
        // 暫時假設家長郵箱匹配
        return true; // 簡化實現
      }

      return false;
    } catch (error) {
      console.error('檢查查看學生權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以編輯特定學生
  canEditStudent: async (userId: string, userType: string, studentId: string) => {
    try {
      // 管理員可以編輯所有學生
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該學生的老師
      if (userType === 'teacher') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('student_teacher')
          .eq('id', studentId)
          .single();

        return student?.student_teacher === userId;
      }

      // 家長通常不能編輯學生資料
      if (userType === 'parent') {
        return false;
      }

      return false;
    } catch (error) {
      console.error('檢查編輯學生權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以查看特定課程
  canViewLesson: async (userId: string, userType: string, lessonId: string) => {
    try {
      // 管理員可以查看所有課程
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該課程的老師
      if (userType === 'teacher') {
        const { data: lesson } = await supabase
          .from('hanami_student_lesson')
          .select('lesson_teacher')
          .eq('id', lessonId)
          .single();

        return lesson?.lesson_teacher === userId;
      }

      // 家長檢查是否為該課程學生的家長
      if (userType === 'parent') {
        const { data: lesson } = await supabase
          .from('hanami_student_lesson')
          .select('student_id')
          .eq('id', lessonId)
          .single();

        if (lesson?.student_id) {
          const { data: student } = await supabase
            .from('Hanami_Students')
            .select('parent_email')
            .eq('id', lesson.student_id)
            .single();

          // 簡化實現，假設家長可以查看
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('檢查查看課程權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以編輯特定課程
  canEditLesson: async (userId: string, userType: string, lessonId: string) => {
    try {
      // 管理員可以編輯所有課程
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該課程的老師
      if (userType === 'teacher') {
        const { data: lesson } = await supabase
          .from('hanami_student_lesson')
          .select('lesson_teacher')
          .eq('id', lessonId)
          .single();

        return lesson?.lesson_teacher === userId;
      }

      // 家長通常不能編輯課程
      if (userType === 'parent') {
        return false;
      }

      return false;
    } catch (error) {
      console.error('檢查編輯課程權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以查看進度
  canViewProgress: async (userId: string, userType: string, studentId: string) => {
    try {
      // 管理員可以查看所有進度
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該學生的老師
      if (userType === 'teacher') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('student_teacher')
          .eq('id', studentId)
          .single();

        return student?.student_teacher === userId;
      }

      // 家長檢查是否為該學生的家長
      if (userType === 'parent') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('parent_email')
          .eq('id', studentId)
          .single();

        // 簡化實現
        return true;
      }

      return false;
    } catch (error) {
      console.error('檢查查看進度權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以編輯進度
  canEditProgress: async (userId: string, userType: string, studentId: string) => {
    try {
      // 管理員可以編輯所有進度
      if (userType === 'admin') {
        return true;
      }

      // 老師檢查是否為該學生的老師
      if (userType === 'teacher') {
        const { data: student } = await supabase
          .from('Hanami_Students')
          .select('student_teacher')
          .eq('id', studentId)
          .single();

        return student?.student_teacher === userId;
      }

      // 家長通常不能編輯進度
      if (userType === 'parent') {
        return false;
      }

      return false;
    } catch (error) {
      console.error('檢查編輯進度權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以查看財務資料
  canViewFinancialData: async (userId: string, userType: string) => {
    try {
      // 只有管理員可以查看財務資料
      return userType === 'admin';
    } catch (error) {
      console.error('檢查查看財務資料權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以管理老師
  canManageTeachers: async (userId: string, userType: string) => {
    try {
      // 只有管理員可以管理老師
      return userType === 'admin';
    } catch (error) {
      console.error('檢查管理老師權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以管理學生
  canManageStudents: async (userId: string, userType: string) => {
    try {
      // 管理員可以管理所有學生
      if (userType === 'admin') {
        return true;
      }

      // 老師可以管理自己的學生
      if (userType === 'teacher') {
        return true; // 簡化實現
      }

      return false;
    } catch (error) {
      console.error('檢查管理學生權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以管理課程
  canManageLessons: async (userId: string, userType: string) => {
    try {
      // 管理員可以管理所有課程
      if (userType === 'admin') {
        return true;
      }

      // 老師可以管理自己的課程
      if (userType === 'teacher') {
        return true; // 簡化實現
      }

      return false;
    } catch (error) {
      console.error('檢查管理課程權限時發生錯誤:', error);
      return false;
    }
  },

  // 檢查用戶是否可以匯出資料
  canExportData: async (userId: string, userType: string) => {
    try {
      // 只有管理員可以匯出資料
      return userType === 'admin';
    } catch (error) {
      console.error('檢查匯出資料權限時發生錯誤:', error);
      return false;
    }
  },

  // 獲取用戶權限
  getUserPermissions: async (userId: string, userType: string) => {
    try {
      // 根據用戶類型返回預設權限
      if (userType === 'admin') {
        return {
          can_view_all_students: true,
          can_view_all_lessons: true,
          can_manage_teachers: true,
          can_manage_students: true,
          can_manage_lessons: true,
          can_view_financial_data: true,
          can_export_data: true,
          is_active: true
        };
      }

      if (userType === 'teacher') {
        return {
          can_view_all_students: false,
          can_view_all_lessons: true,
          can_manage_teachers: false,
          can_manage_students: true,
          can_manage_lessons: true,
          can_view_financial_data: false,
          can_export_data: false,
          is_active: true
        };
      }

      if (userType === 'parent') {
        return {
          can_view_all_students: false,
          can_view_all_lessons: false,
          can_manage_teachers: false,
          can_manage_students: false,
          can_manage_lessons: false,
          can_view_financial_data: false,
          can_export_data: false,
          is_active: true
        };
      }

      return {
        can_view_all_students: false,
        can_view_all_lessons: false,
        can_manage_teachers: false,
        can_manage_students: false,
        can_manage_lessons: false,
        can_view_financial_data: false,
        can_export_data: false,
        is_active: false
      };
    } catch (error) {
      console.error('獲取用戶權限時發生錯誤:', error);
      return {
        can_view_all_students: false,
        can_view_all_lessons: false,
        can_manage_teachers: false,
        can_manage_students: false,
        can_manage_lessons: false,
        can_view_financial_data: false,
        can_export_data: false,
        is_active: false
      };
    }
  },

  // 獲取老師的學生列表
  getTeacherStudents: async (teacherId: string) => {
    try {
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_email, parent_email')
        .eq('student_teacher', teacherId);

      return students || [];
    } catch (error) {
      console.error('獲取老師學生列表時發生錯誤:', error);
      return [];
    }
  },

  // 獲取家長的學生列表
  getParentStudents: async (parentId: string) => {
    try {
      // 簡化實現，根據家長郵箱查找學生
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_email, student_teacher')
        .eq('parent_email', parentId);

      return students || [];
    } catch (error) {
      console.error('獲取家長學生列表時發生錯誤:', error);
      return [];
    }
  },

  // 獲取老師的課程列表
  getTeacherLessons: async (teacherId: string) => {
    try {
      const { data: lessons } = await supabase
        .from('hanami_student_lesson')
        .select('id, lesson_date, lesson_duration, full_name')
        .eq('lesson_teacher', teacherId)
        .order('lesson_date', { ascending: false });

      return lessons || [];
    } catch (error) {
      console.error('獲取老師課程列表時發生錯誤:', error);
      return [];
    }
  },

  // 獲取家長的課程列表
  getParentLessons: async (parentId: string) => {
    try {
      // 簡化實現，根據家長郵箱查找相關課程
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('parent_email', parentId);

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        const { data: lessons } = await supabase
          .from('hanami_student_lesson')
          .select('id, lesson_date, lesson_duration, full_name')
          .in('student_id', studentIds)
          .order('lesson_date', { ascending: false });

        return lessons || [];
      }

      return [];
    } catch (error) {
      console.error('獲取家長課程列表時發生錯誤:', error);
      return [];
    }
  }
}; 