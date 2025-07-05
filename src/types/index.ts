export interface CourseType {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  teacher_fullname: string;
  teacher_nickname: string;
  teacher_role: string | null;
  teacher_status: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  teacher_address: string | null;
  teacher_gender: string | null;
  teacher_dob: string | null;
  teacher_hsalary: number | null;
  teacher_msalary: number | null;
  teacher_background: string | null;
  teacher_bankid: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Student {
  id: string;
  student_oid: string | null;
  full_name: string;
  nick_name: string | null;
  gender: string | null;
  contact_number: string;
  student_dob: string | null;
  student_age: number | null;
  parent_email: string | null;
  health_notes: string | null;
  student_remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  address?: string | null;
  course_type?: string | null;
  duration_months?: number | null;
  regular_timeslot?: string | null;
  regular_weekday?: number | null;
  school?: string | null;
  started_date?: string | null;
  student_email?: string | null;
  student_password?: string | null;
  student_preference?: string | null;
  student_teacher?: string | null;
  student_type?: string | null;
  lesson_date?: string | null;
  actual_timeslot?: string | null;
}

export interface Lesson {
  id: string;
  student_id: string;
  student_oid: string | null;
  lesson_date: string;
  regular_timeslot: string;
  actual_timeslot: string | null;
  lesson_status: string | null;
  course_type: string | CourseType | null;
  lesson_duration: string | null;
  regular_weekday: number | null;
  lesson_count: number;
  is_trial: boolean;
  lesson_teacher: string | null;
  package_id: string | null;
  status: string | null;
  notes: string | null;
  next_target: string | null;
  progress_notes: string | null;
  video_url: string | null;
  full_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  access_role: string | null;
  remarks: string | null;
  lesson_activities?: string | null;
}

export interface TrialLesson {
  id: string;
  full_name: string;
  nick_name: string;
  gender: string;
  contact_number: string;
  student_dob: string | null;
  student_age: number | null;
  parent_email: string;
  health_notes: string;
  prefer_time: string[];
  notes: string;
  created_at: string | null;
  updated_at: string | null;
  phone_no?: string | null;
}

export interface LessonPlan {
  id: string;
  created_at: string | null;
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
  teacherNames1?: string[];
  teacherNames2?: string[];
}

export interface TrialStudent {
  id: string;
  full_name: string;
  lesson_date: string;
  actual_timeslot: string;
  weekday: string;
  student_age?: number;
}

export interface Schedule {
  id: string;
  teacher_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  created_at: string | null;
  updated_at: string | null;
  weekday?: string;
  timeslot?: string;
  max_students?: number;
  current_students?: number;
  duration?: string | null;
}

export interface StudentFormData extends Omit<Student, 'gender' | 'course_type' | 'student_type'> {
  gender: string | null;
  course_type: string | null;
  student_type: string | null;
  lesson_date?: string | null;
  actual_timeslot?: string | null;
  trial_date?: string | null;
  trial_time?: string | null;
  trial_remarks?: string | null;
}

export interface StudentProgress {
  id: string
  student_id: string | null
  lesson_id: string | null
  lesson_date: string | null
  course_type: string | null
  lesson_type: '正常課' | '補課' | '評估課' | '考試課' | '比賽課' | '拍片課' | null
  duration_minutes: number | null
  progress_notes: string | null
  next_goal: string | null
  video_url: string | null
  created_at: string
  updated_at: string | null
  review_status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  is_sent: boolean
  sent_at: string | null
  ai_processed: boolean
  ai_processed_at: string | null
  ai_feedback: string | null
  ai_suggestions: string | null
  student?: {
    full_name: string
    student_oid: string | null
    course_type: string | null
    student_type: string | null
  }
  lesson?: {
    lesson_date: string
    actual_timeslot: string | null
    lesson_teacher: string | null
  }
} 