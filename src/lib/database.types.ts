export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_task_memory: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          task_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_memory_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tasks: {
        Row: {
          assigned_model: string | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          memory_id: string | null
          model: string | null
          prompt: string | null
          result: string | null
          started_at: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          assigned_model?: string | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          memory_id?: string | null
          model?: string | null
          prompt?: string | null
          result?: string | null
          started_at?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          assigned_model?: string | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          memory_id?: string | null
          model?: string | null
          prompt?: string | null
          result?: string | null
          started_at?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      hanami_admin: {
        Row: {
          admin_email: string | null
          admin_name: string | null
          admin_oid: string | null
          admin_password: string | null
          created_at: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          admin_email?: string | null
          admin_name?: string | null
          admin_oid?: string | null
          admin_password?: string | null
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_email?: string | null
          admin_name?: string | null
          admin_oid?: string | null
          admin_password?: string | null
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Hanami_CourseTypes: {
        Row: {
          created_at: string
          id: string
          name: string | null
          status: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          status?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      hanami_employee: {
        Row: {
          created_at: string | null
          id: string
          teacher_address: string | null
          teacher_background: string | null
          teacher_bankid: string | null
          teacher_dob: string | null
          teacher_email: string | null
          teacher_fullname: string | null
          teacher_hsalary: number | null
          teacher_msalary: number | null
          teacher_nickname: string
          teacher_password: string | null
          teacher_phone: string | null
          teacher_role: string | null
          teacher_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          teacher_address?: string | null
          teacher_background?: string | null
          teacher_bankid?: string | null
          teacher_dob?: string | null
          teacher_email?: string | null
          teacher_fullname?: string | null
          teacher_hsalary?: number | null
          teacher_msalary?: number | null
          teacher_nickname: string
          teacher_password?: string | null
          teacher_phone?: string | null
          teacher_role?: string | null
          teacher_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          teacher_address?: string | null
          teacher_background?: string | null
          teacher_bankid?: string | null
          teacher_dob?: string | null
          teacher_email?: string | null
          teacher_fullname?: string | null
          teacher_hsalary?: number | null
          teacher_msalary?: number | null
          teacher_nickname?: string
          teacher_password?: string | null
          teacher_phone?: string | null
          teacher_role?: string | null
          teacher_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_holidays: {
        Row: {
          created_at: string
          date: string | null
          id: string
          is_closed: boolean | null
          title: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          is_closed?: boolean | null
          title?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          is_closed?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
      hanami_lesson_activity_log: {
        Row: {
          activity_name: string | null
          learning_focus: string | null
          lesson_id: string
          materials_used: string | null
          teacher_reflection: string | null
        }
        Insert: {
          activity_name?: string | null
          learning_focus?: string | null
          lesson_id: string
          materials_used?: string | null
          teacher_reflection?: string | null
        }
        Update: {
          activity_name?: string | null
          learning_focus?: string | null
          lesson_id?: string
          materials_used?: string | null
          teacher_reflection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_lesson_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "hanami_student_lesson"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_schedule: {
        Row: {
          assigned_teachers: string | null
          course_type: string | null
          created_at: string
          duration: string | null
          id: string
          max_students: number | null
          timeslot: string | null
          updated_at: string | null
          weekday: number | null
        }
        Insert: {
          assigned_teachers?: string | null
          course_type?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          max_students?: number | null
          timeslot?: string | null
          updated_at?: string | null
          weekday?: number | null
        }
        Update: {
          assigned_teachers?: string | null
          course_type?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          max_students?: number | null
          timeslot?: string | null
          updated_at?: string | null
          weekday?: number | null
        }
        Relationships: []
      }
      hanami_student_lesson: {
        Row: {
          access_role: string | null
          actual_timeslot: string | null
          course_type: string | null
          created_at: string
          full_name: string | null
          id: string
          lesson_activities: string | null
          lesson_date: string
          lesson_duration: string | null
          lesson_status: string | null
          lesson_teacher: string | null
          next_target: string | null
          notes: string | null
          package_id: string | null
          progress_notes: string | null
          regular_timeslot: string | null
          regular_weekday: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id: string | null
          student_oid: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          access_role?: string | null
          actual_timeslot?: string | null
          course_type?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          lesson_activities?: string | null
          lesson_date: string
          lesson_duration?: string | null
          lesson_status?: string | null
          lesson_teacher?: string | null
          next_target?: string | null
          notes?: string | null
          package_id?: string | null
          progress_notes?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id?: string | null
          student_oid?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          access_role?: string | null
          actual_timeslot?: string | null
          course_type?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          lesson_activities?: string | null
          lesson_date?: string
          lesson_duration?: string | null
          lesson_status?: string | null
          lesson_teacher?: string | null
          next_target?: string | null
          notes?: string | null
          package_id?: string | null
          progress_notes?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id?: string | null
          student_oid?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_student_lesson_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Student_Package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_student_lesson_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_student_lesson_student_oid_fkey"
            columns: ["student_oid"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["student_oid"]
          },
        ]
      }
      hanami_student_lesson_duplicate: {
        Row: {
          access_role: string | null
          actual_timeslot: string | null
          course_type: string | null
          created_at: string
          id: string
          lesson_date: string
          lesson_duration: string | null
          lesson_status: string | null
          next_target: string | null
          notes: string | null
          package_id: string | null
          progress_notes: string | null
          regular_timeslot: string | null
          regular_weekday: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id: string | null
          student_name: string | null
          student_oid: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          access_role?: string | null
          actual_timeslot?: string | null
          course_type?: string | null
          created_at?: string
          id?: string
          lesson_date: string
          lesson_duration?: string | null
          lesson_status?: string | null
          next_target?: string | null
          notes?: string | null
          package_id?: string | null
          progress_notes?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id?: string | null
          student_name?: string | null
          student_oid?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          access_role?: string | null
          actual_timeslot?: string | null
          course_type?: string | null
          created_at?: string
          id?: string
          lesson_date?: string
          lesson_duration?: string | null
          lesson_status?: string | null
          next_target?: string | null
          notes?: string | null
          package_id?: string | null
          progress_notes?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lesson_status_type"] | null
          student_id?: string | null
          student_name?: string | null
          student_oid?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_student_lesson_duplicate_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Student_Package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_student_lesson_duplicate_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_student_lesson_duplicate_student_oid_fkey"
            columns: ["student_oid"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["student_oid"]
          },
        ]
      }
      Hanami_Student_Package: {
        Row: {
          access_role: string | null
          course_name: string
          created_at: string
          full_name: string | null
          id: string
          lesson_duration: number
          lesson_time: string
          package_type: string
          price: number
          remaining_lessons: number
          start_date: string
          status: Database["public"]["Enums"]["package_status_type"] | null
          student_id: string
          total_lessons: number
          updated_at: string
          weekday: string
        }
        Insert: {
          access_role?: string | null
          course_name: string
          created_at?: string
          full_name?: string | null
          id?: string
          lesson_duration: number
          lesson_time: string
          package_type: string
          price: number
          remaining_lessons: number
          start_date: string
          status?: Database["public"]["Enums"]["package_status_type"] | null
          student_id: string
          total_lessons: number
          updated_at?: string
          weekday: string
        }
        Update: {
          access_role?: string | null
          course_name?: string
          created_at?: string
          full_name?: string | null
          id?: string
          lesson_duration?: number
          lesson_time?: string
          package_type?: string
          price?: number
          remaining_lessons?: number
          start_date?: string
          status?: Database["public"]["Enums"]["package_status_type"] | null
          student_id?: string
          total_lessons?: number
          updated_at?: string
          weekday?: string
        }
        Relationships: [
          {
            foreignKeyName: "Hanami_Student_Package_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_student_progress: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          lesson_date: string | null
          lesson_id: string | null
          lesson_type: Database["public"]["Enums"]["lesson_type_enum"] | null
          next_goal: string | null
          progress_notes: string | null
          student_id: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_date?: string | null
          lesson_id?: string | null
          lesson_type?: Database["public"]["Enums"]["lesson_type_enum"] | null
          next_goal?: string | null
          progress_notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_date?: string | null
          lesson_id?: string | null
          lesson_type?: Database["public"]["Enums"]["lesson_type_enum"] | null
          next_goal?: string | null
          progress_notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanami_student_lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          },
        ]
      }
      Hanami_Students: {
        Row: {
          access_role: string | null
          address: string | null
          contact_number: string
          course_type: string | null
          created_at: string | null
          duration_months: number | null
          full_name: string
          gender: string | null
          health_notes: string | null
          id: string
          nick_name: string | null
          ongoing_lessons: number | null
          parent_email: string | null
          regular_timeslot: string | null
          regular_weekday: number | null
          remaining_lessons: number | null
          school: string | null
          started_date: string | null
          student_age: number | null
          student_dob: string | null
          student_email: string | null
          student_oid: string | null
          student_password: string | null
          student_preference: string | null
          student_remarks: string | null
          student_teacher: string | null
          student_type: string | null
          upcoming_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          access_role?: string | null
          address?: string | null
          contact_number: string
          course_type?: string | null
          created_at?: string | null
          duration_months?: number | null
          full_name: string
          gender?: string | null
          health_notes?: string | null
          id?: string
          nick_name?: string | null
          ongoing_lessons?: number | null
          parent_email?: string | null
          regular_timeslot?: string | null
          regular_weekday?: number | null
          remaining_lessons?: number | null
          school?: string | null
          started_date?: string | null
          student_age?: number | null
          student_dob?: string | null
          student_email?: string | null
          student_oid?: string | null
          student_password?: string | null
          student_preference?: string | null
          student_remarks?: string | null
          student_teacher?: string | null
          student_type?: string | null
          upcoming_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          access_role?: string | null
          address?: string | null
          contact_number?: string
          course_type?: string | null
          created_at?: string | null
          duration_months?: number | null
          full_name?: string
          gender?: string | null
          health_notes?: string | null
          id?: string
          nick_name?: string | null
          ongoing_lessons?: number | null
          parent_email?: string | null
          regular_timeslot?: string | null
          regular_weekday?: number | null
          remaining_lessons?: number | null
          school?: string | null
          started_date?: string | null
          student_age?: number | null
          student_dob?: string | null
          student_email?: string | null
          student_oid?: string | null
          student_password?: string | null
          student_preference?: string | null
          student_remarks?: string | null
          student_teacher?: string | null
          student_type?: string | null
          upcoming_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_trial_queue: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preferred_timeslots: Json | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_timeslots?: Json | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_timeslots?: Json | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      hanami_trial_students: {
        Row: {
          access_role: string | null
          actual_timeslot: string | null
          address: string | null
          contact_number: string | null
          course_type: string | null
          created_at: string
          duration_months: string | null
          full_name: string | null
          gender: string | null
          health_notes: string | null
          id: string
          lesson_date: string | null
          lesson_duration: string | null
          nick_name: string | null
          ongoing_lessons: number | null
          parent_email: string | null
          regular_timeslot: string | null
          regular_weekday: string | null
          remaining_lessons: number | null
          school: string | null
          student_age: number | null
          student_dob: string | null
          student_email: string | null
          student_oid: string | null
          student_password: string | null
          student_preference: string | null
          student_teacher: string | null
          student_type: string | null
          trial_remarks: string | null
          trial_status: string | null
          upcoming_lessons: number | null
          updated_at: string | null
          weekday: string | null
        }
        Insert: {
          access_role?: string | null
          actual_timeslot?: string | null
          address?: string | null
          contact_number?: string | null
          course_type?: string | null
          created_at?: string
          duration_months?: string | null
          full_name?: string | null
          gender?: string | null
          health_notes?: string | null
          id?: string
          lesson_date?: string | null
          lesson_duration?: string | null
          nick_name?: string | null
          ongoing_lessons?: number | null
          parent_email?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remaining_lessons?: number | null
          school?: string | null
          student_age?: number | null
          student_dob?: string | null
          student_email?: string | null
          student_oid?: string | null
          student_password?: string | null
          student_preference?: string | null
          student_teacher?: string | null
          student_type?: string | null
          trial_remarks?: string | null
          trial_status?: string | null
          upcoming_lessons?: number | null
          updated_at?: string | null
          weekday?: string | null
        }
        Update: {
          access_role?: string | null
          actual_timeslot?: string | null
          address?: string | null
          contact_number?: string | null
          course_type?: string | null
          created_at?: string
          duration_months?: string | null
          full_name?: string | null
          gender?: string | null
          health_notes?: string | null
          id?: string
          lesson_date?: string | null
          lesson_duration?: string | null
          nick_name?: string | null
          ongoing_lessons?: number | null
          parent_email?: string | null
          regular_timeslot?: string | null
          regular_weekday?: string | null
          remaining_lessons?: number | null
          school?: string | null
          student_age?: number | null
          student_dob?: string | null
          student_email?: string | null
          student_oid?: string | null
          student_password?: string | null
          student_preference?: string | null
          student_teacher?: string | null
          student_type?: string | null
          trial_remarks?: string | null
          trial_status?: string | null
          upcoming_lessons?: number | null
          updated_at?: string | null
          weekday?: string | null
        }
        Relationships: []
      }
      model_status: {
        Row: {
          assigned_task_id: string | null
          model_name: string
          port: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_task_id?: string | null
          model_name: string
          port?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_task_id?: string | null
          model_name?: string
          port?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_status_assigned_task_id_fkey"
            columns: ["assigned_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_teacher_schedule: {
        Row: {
          id: string;
          teacher_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        }
        Insert: {
          id?: string;
          teacher_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          teacher_id?: string;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
          updated_at?: string;
        }
        Relationships: []
      }
      hanami_lesson_plan: {
        Row: {
          id: string;
          created_at: string;
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
        }
        Insert: {
          id?: string;
          created_at?: string;
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
        }
        Update: {
          id?: string;
          created_at?: string;
          lesson_date?: string;
          timeslot?: string;
          course_type?: string;
          topic?: string;
          objectives?: string[];
          materials?: string[];
          teacher_ids?: string[];
          teacher_names?: string[];
          teacher_ids_1?: string[];
          teacher_ids_2?: string[];
          theme?: string;
          notes?: string;
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_generate_student_email_password: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_generate_teacher_email_password: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_simple_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      lesson_status_type:
        | "attended"
        | "absent"
        | "makeup"
        | "cancelled"
        | "sick_leave"
        | "personal_leave"
      lesson_type_enum:
        | "正常課"
        | "補課"
        | "評估課"
        | "考試課"
        | "比賽課"
        | "拍片課"
      package_status_type: "active" | "paused" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lesson_status_type: [
        "attended",
        "absent",
        "makeup",
        "cancelled",
        "sick_leave",
        "personal_leave",
      ],
      lesson_type_enum: [
        "正常課",
        "補課",
        "評估課",
        "考試課",
        "比賽課",
        "拍片課",
      ],
      package_status_type: ["active", "paused", "completed", "cancelled"],
    },
  },
} as const
