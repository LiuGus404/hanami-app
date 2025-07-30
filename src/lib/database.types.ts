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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          student_id?: string | null
          student_oid?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'hanami_student_lesson_package_id_fkey'
            columns: ['package_id']
            isOneToOne: false
            referencedRelation: 'Hanami_Student_Package'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_student_lesson_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'Hanami_Students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_student_lesson_student_oid_fkey'
            columns: ['student_oid']
            isOneToOne: false
            referencedRelation: 'Hanami_Students'
            referencedColumns: ['student_oid']
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          student_id?: string
          total_lessons?: number
          updated_at?: string
          weekday?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Hanami_Student_Package_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'Hanami_Students'
            referencedColumns: ['id']
          },
        ]
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
      Hanami_CourseTypes: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          status: boolean | null;
          trial_limit: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          status?: boolean | null;
          trial_limit?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          status?: boolean | null;
          trial_limit?: number | null;
        };
        Relationships: [];
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
      hanami_lesson_plan: {
        Row: {
          id: string
          created_at: string
          lesson_date: string
          timeslot: string
          course_type: string
          topic: string
          objectives: string[]
          materials: string[]
          teacher_ids: string[]
          teacher_names: string[]
          teacher_ids_1: string[]
          teacher_ids_2: string[]
          theme: string
          notes: string
        }
        Insert: {
          id?: string
          created_at?: string
          lesson_date: string
          timeslot: string
          course_type: string
          topic: string
          objectives: string[]
          materials: string[]
          teacher_ids: string[]
          teacher_names: string[]
          teacher_ids_1: string[]
          teacher_ids_2: string[]
          theme: string
          notes: string
        }
        Update: {
          id?: string
          created_at?: string
          lesson_date?: string
          timeslot?: string
          course_type?: string
          topic?: string
          objectives?: string[]
          materials?: string[]
          teacher_ids?: string[]
          teacher_names?: string[]
          teacher_ids_1?: string[]
          teacher_ids_2?: string[]
          theme?: string
          notes?: string
        }
        Relationships: []
      }
      hanami_schedule: {
        Row: {
          id: string
          weekday: number
          timeslot: string
          max_students: number
          assigned_teachers: string | null
          created_at?: string | null
          updated_at?: string | null
          course_type: string | null
          duration: string | null
        }
        Insert: {
          id?: string
          weekday: number
          timeslot: string
          max_students: number
          assigned_teachers?: string | null
          created_at?: string | null
          updated_at?: string | null
          course_type?: string | null
          duration?: string | null
        }
        Update: {
          id?: string
          weekday?: number
          timeslot?: string
          max_students?: number
          assigned_teachers?: string | null
          created_at?: string | null
          updated_at?: string | null
          course_type?: string | null
          duration?: string | null
        }
        Relationships: []
      }
      teacher_schedule: {
        Row: {
          id: string
          teacher_id: string
          scheduled_date: string
          start_time: string
          end_time: string
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
          teacher_id: string
          scheduled_date: string
          start_time: string
          end_time: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          teacher_id?: string
          scheduled_date?: string
          start_time?: string
          end_time?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inactive_student_list: {
        Row: {
          id: string
          original_id: string
          student_type: string
          full_name: string | null
          student_age: number | null
          student_preference: string | null
          course_type: string | null
          remaining_lessons: number | null
          regular_weekday: number | null
          gender: string | null
          student_oid: string | null
          contact_number: string | null
          regular_timeslot: string | null
          health_notes: string | null
          lesson_date: string | null
          actual_timeslot: string | null
          inactive_date: string
          inactive_reason: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          original_id: string
          student_type: string
          full_name?: string | null
          student_age?: number | null
          student_preference?: string | null
          course_type?: string | null
          remaining_lessons?: number | null
          regular_weekday?: number | null
          gender?: string | null
          student_oid?: string | null
          contact_number?: string | null
          regular_timeslot?: string | null
          health_notes?: string | null
          lesson_date?: string | null
          actual_timeslot?: string | null
          inactive_date: string
          inactive_reason: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          original_id?: string
          student_type?: string
          full_name?: string | null
          student_age?: number | null
          student_preference?: string | null
          course_type?: string | null
          remaining_lessons?: number | null
          regular_weekday?: number | null
          gender?: string | null
          student_oid?: string | null
          contact_number?: string | null
          regular_timeslot?: string | null
          health_notes?: string | null
          lesson_date?: string | null
          actual_timeslot?: string | null
          inactive_date?: string
          inactive_reason?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_trial_queue: {
        Row: {
          id: string;
          student_id: string;
          status: string | null;
          prefer_time: string | null;
          course_types: string | null;
          notes: string | null;
          student_age: number | null;
          full_name: string | null;
          student_dob: string | null;
          phone_no: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          status?: string | null;
          prefer_time?: string | null;
          course_types?: string | null;
          notes?: string | null;
          student_age?: number | null;
          full_name?: string | null;
          student_dob?: string | null;
          phone_no?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          status?: string | null;
          prefer_time?: string | null;
          course_types?: string | null;
          notes?: string | null;
          student_age?: number | null;
          full_name?: string | null;
          student_dob?: string | null;
          phone_no?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      }
      hanami_admin: {
        Row: {
          id: string
          admin_email: string
          admin_name: string
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          admin_email: string
          admin_name: string
          role: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          admin_email?: string
          admin_name?: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_tasks: {
        Row: {
          id: string
          status: string
          title: string
          model: string
          prompt: string
          result: string
          started_at: string | null
          finished_at: string | null
          error_message: string
          assigned_model: string
          memory_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          status: string
          title: string
          model: string
          prompt: string
          result?: string
          started_at?: string | null
          finished_at?: string | null
          error_message?: string
          assigned_model?: string
          memory_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          status?: string
          title?: string
          model?: string
          prompt?: string
          result?: string
          started_at?: string | null
          finished_at?: string | null
          error_message?: string
          assigned_model?: string
          memory_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_teaching_activities: {
        Row: {
          id: string
          activity_name: string
          activity_description: string | null
          activity_type: string
          difficulty_level: number | null
          target_abilities: string[] | null
          materials_needed: string[] | null
          duration_minutes: number | null
          age_range_min: number | null
          age_range_max: number | null
          notion_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          template_id: string | null
          custom_fields: Json | null
          tags: string[] | null
          category: string | null
          status: string | null
          version: number | null
          created_by: string | null
          updated_by: string | null
          estimated_duration: number | null
          instructions: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          activity_name: string
          activity_description?: string | null
          activity_type: string
          difficulty_level?: number | null
          target_abilities?: string[] | null
          materials_needed?: string[] | null
          duration_minutes?: number | null
          age_range_min?: number | null
          age_range_max?: number | null
          notion_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          template_id?: string | null
          custom_fields?: Json | null
          tags?: string[] | null
          category?: string | null
          status?: string | null
          version?: number | null
          created_by?: string | null
          updated_by?: string | null
          estimated_duration?: number | null
          instructions?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          activity_name?: string
          activity_description?: string | null
          activity_type?: string
          difficulty_level?: number | null
          target_abilities?: string[] | null
          materials_needed?: string[] | null
          duration_minutes?: number | null
          age_range_min?: number | null
          age_range_max?: number | null
          notion_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          template_id?: string | null
          custom_fields?: Json | null
          tags?: string[] | null
          category?: string | null
          status?: string | null
          version?: number | null
          created_by?: string | null
          updated_by?: string | null
          estimated_duration?: number | null
          instructions?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_teaching_activities_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hanami_resource_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      hanami_resource_templates: {
        Row: {
          id: string
          template_name: string
          template_type: string
          template_description: string | null
          template_schema: Json
          template_icon: string | null
          template_color: string | null
          is_active: boolean | null
          is_public: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_name: string
          template_type: string
          template_description?: string | null
          template_schema: Json
          template_icon?: string | null
          template_color?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          template_name?: string
          template_type?: string
          template_description?: string | null
          template_schema?: Json
          template_icon?: string | null
          template_color?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_resource_categories: {
        Row: {
          id: string
          category_name: string
          category_description: string | null
          parent_category_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_name: string
          category_description?: string | null
          parent_category_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_name?: string
          category_description?: string | null
          parent_category_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_resource_tags: {
        Row: {
          id: string
          tag_name: string
          tag_description: string | null
          tag_color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tag_name: string
          tag_description?: string | null
          tag_color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tag_name?: string
          tag_description?: string | null
          tag_color?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      hanami_custom_options: {
        Row: {
          id: string
          option_type: string
          option_name: string
          option_value: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          option_type: string
          option_name: string
          option_value: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          option_type?: string
          option_name?: string
          option_value?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_development_abilities: {
        Row: {
          id: string;
          ability_name: string;
          ability_description: string | null;
          ability_icon: string | null;
          ability_color: string | null;
          max_level: number;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ability_name: string;
          ability_description?: string | null;
          ability_icon?: string | null;
          ability_color?: string | null;
          max_level: number;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ability_name?: string;
          ability_description?: string | null;
          ability_icon?: string | null;
          ability_color?: string | null;
          max_level?: number;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hanami_development_abilities_category_fkey";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "hanami_ability_categories";
            referencedColumns: ["category_name"];
          }
        ];
      }
      hanami_ability_categories: {
        Row: {
          id: string;
          category_name: string;
          category_description: string | null;
          category_color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          category_description?: string | null;
          category_color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          category_description?: string | null;
          category_color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      }
      hanami_ability_levels: {
        Row: {
          id: string;
          ability_id: string;
          level: number;
          level_title: string;
          level_description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ability_id: string;
          level: number;
          level_title: string;
          level_description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ability_id?: string;
          level?: number;
          level_title?: string;
          level_description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hanami_ability_levels_ability_id_fkey";
            columns: ["ability_id"];
            isOneToOne: false;
            referencedRelation: "hanami_development_abilities";
            referencedColumns: ["id"];
          }
        ];
      }
      hanami_student_abilities: {
        Row: {
          id: string;
          student_id: string;
          ability_id: string;
          current_level: number;
          progress_percentage: number;
          last_updated: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          ability_id: string;
          current_level: number;
          progress_percentage: number;
          last_updated: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          ability_id?: string;
          current_level?: number;
          progress_percentage?: number;
          last_updated?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      }
      hanami_growth_trees: {
        Row: {
          id: string;
          tree_name: string;
          tree_description: string | null;
          tree_icon: string | null;
          course_type_id: string | null;
          tree_level: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tree_name: string;
          tree_description?: string | null;
          tree_icon?: string | null;
          course_type_id?: string | null;
          tree_level?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tree_name?: string;
          tree_description?: string | null;
          tree_icon?: string | null;
          course_type_id?: string | null;
          tree_level?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      }
      hanami_student_progress: {
        Row: {
          id: string;
          student_id: string;
          lesson_date: string;
          activity_id: string | null;
          goal_id: string | null;
          performance_rating: number;
          notes: string | null;
          next_target: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          lesson_date: string;
          activity_id?: string | null;
          goal_id?: string | null;
          performance_rating: number;
          notes?: string | null;
          next_target?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          lesson_date?: string;
          activity_id?: string | null;
          goal_id?: string | null;
          performance_rating?: number;
          notes?: string | null;
          next_target?: string | null;
          created_at?: string;
        };
        Relationships: [];
      }
      hanami_ability_assessments: {
        Row: {
          id: string;
          student_id: string;
          tree_id: string;
          assessment_date: string;
          lesson_date: string;
          teacher_id: string | null;
          ability_assessments: any;
          overall_performance_rating: number;
          general_notes: string | null;
          next_lesson_focus: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          tree_id: string;
          assessment_date: string;
          lesson_date: string;
          teacher_id?: string | null;
          ability_assessments: any;
          overall_performance_rating: number;
          general_notes?: string | null;
          next_lesson_focus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          tree_id?: string;
          assessment_date?: string;
          lesson_date?: string;
          teacher_id?: string | null;
          ability_assessments?: any;
          overall_performance_rating?: number;
          general_notes?: string | null;
          next_lesson_focus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hanami_ability_assessments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'Hanami_Students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_ability_assessments_tree_id_fkey'
            columns: ['tree_id']
            isOneToOne: false
            referencedRelation: 'hanami_growth_trees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_ability_assessments_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'hanami_employee'
            referencedColumns: ['id']
          }
        ];
      }
      hanami_ability_assessment_history: {
        Row: {
          id: string;
          assessment_id: string;
          student_id: string;
          ability_id: string;
          previous_level: number | null;
          new_level: number | null;
          change_date: string;
          change_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          student_id: string;
          ability_id: string;
          previous_level?: number | null;
          new_level?: number | null;
          change_date: string;
          change_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          student_id?: string;
          ability_id?: string;
          previous_level?: number | null;
          new_level?: number | null;
          change_date?: string;
          change_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hanami_ability_assessment_history_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: false
            referencedRelation: 'hanami_ability_assessments'
            referencedColumns: ['id']
          }
        ];
      }
      hanami_growth_goals: {
        Row: {
          id: string;
          tree_id: string;
          goal_name: string;
          goal_description: string | null;
          goal_icon: string | null;
          goal_order: number;
          is_completed: boolean;
          is_achievable: boolean;
          progress_max: number;
          required_abilities: string[];
          related_activities: string[];
          progress_contents: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          tree_id: string;
          goal_name: string;
          goal_description?: string | null;
          goal_icon?: string | null;
          goal_order: number;
          is_completed?: boolean;
          is_achievable?: boolean;
          progress_max: number;
          required_abilities?: string[];
          related_activities?: string[];
          progress_contents?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          tree_id?: string;
          goal_name?: string;
          goal_description?: string | null;
          goal_icon?: string | null;
          goal_order?: number;
          is_completed?: boolean;
          is_achievable?: boolean;
          progress_max?: number;
          required_abilities?: string[];
          related_activities?: string[];
          progress_contents?: string[];
          created_at?: string;
        };
        Relationships: [];
      }
      hanami_ai_message_templates: {
        Row: {
          id: string;
          template_name: string;
          template_content: string;
          template_type: string;
          variables: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_name: string;
          template_content: string;
          template_type?: string;
          variables?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_name?: string;
          template_content?: string;
          template_type?: string;
          variables?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      }
      hanami_ai_message_logs: {
        Row: {
          id: string;
          student_id: string;
          template_id: string | null;
          message_content: string;
          student_data: any;
          webhook_response: any | null;
          status: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          template_id?: string | null;
          message_content: string;
          student_data: any;
          webhook_response?: any | null;
          status?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          template_id?: string | null;
          message_content?: string;
          student_data?: any;
          webhook_response?: any | null;
          status?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'hanami_ai_message_logs_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'hanami_ai_message_templates'
            referencedColumns: ['id']
          }
        ];
      }
      hanami_student_trees: {
        Row: {
          id: string;
          student_id: string | null;
          tree_id: string | null;
          enrollment_date: string | null;
          completion_date: string | null;
          current_goal_id: string | null;
          tree_status: string | null;
          teacher_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          // 新增欄位（如果存在）
          start_date?: string | null;
          status?: string | null;
          completed_goals?: string[] | null;
          progress_notes?: string | null;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          tree_id?: string | null;
          enrollment_date?: string | null;
          completion_date?: string | null;
          current_goal_id?: string | null;
          tree_status?: string | null;
          teacher_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          // 新增欄位（如果存在）
          start_date?: string | null;
          status?: string | null;
          completed_goals?: string[] | null;
          progress_notes?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          tree_id?: string | null;
          enrollment_date?: string | null;
          completion_date?: string | null;
          current_goal_id?: string | null;
          tree_status?: string | null;
          teacher_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          // 新增欄位（如果存在）
          start_date?: string | null;
          status?: string | null;
          completed_goals?: string[] | null;
          progress_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'hanami_student_trees_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'Hanami_Students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_student_trees_tree_id_fkey'
            columns: ['tree_id']
            isOneToOne: false
            referencedRelation: 'hanami_growth_trees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hanami_student_trees_current_goal_id_fkey'
            columns: ['current_goal_id']
            isOneToOne: false
            referencedRelation: 'hanami_growth_goals'
            referencedColumns: ['id']
          }
        ];
      }
      hanami_student_media: {
        Row: {
          id: string
          student_id: string
          media_type: string
          file_name: string
          file_path: string
          file_size: number
          file_duration: number | null
          thumbnail_path: string | null
          title: string | null
          description: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
          is_favorite: boolean | null
        }
        Insert: {
          id?: string
          student_id: string
          media_type: string
          file_name: string
          file_path: string
          file_size: number
          file_duration?: number | null
          thumbnail_path?: string | null
          title?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
          is_favorite?: boolean | null
        }
        Update: {
          id?: string
          student_id?: string
          media_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_duration?: number | null
          thumbnail_path?: string | null
          title?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
          is_favorite?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_student_media_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          }
        ]
      }
      hanami_student_media_quota: {
        Row: {
          student_id: string
          plan_type: string
          video_limit: number
          photo_limit: number
          video_count: number
          photo_count: number
          total_used_space: number
          last_updated: string
        }
        Insert: {
          student_id: string
          plan_type?: string
          video_limit?: number
          photo_limit?: number
          video_count?: number
          photo_count?: number
          total_used_space?: number
          last_updated?: string
        }
        Update: {
          student_id?: string
          plan_type?: string
          video_limit?: number
          photo_limit?: number
          video_count?: number
          photo_count?: number
          total_used_space?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanami_student_media_quota_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "Hanami_Students"
            referencedColumns: ["id"]
          }
        ]
      }
      hanami_user_permissions_v2: {
        Row: {
          id: string
          user_email: string
          user_phone: string
          role_id: string
          status: string
          approved_by: string | null
          approved_at: string | null
          custom_permissions: any
          student_access_list: string[]
          page_access_list: string[]
          feature_access_list: string[]
          data_access_config: any
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_email: string
          user_phone: string
          role_id: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          custom_permissions?: any
          student_access_list?: string[]
          page_access_list?: string[]
          feature_access_list?: string[]
          data_access_config?: any
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_email?: string
          user_phone?: string
          role_id?: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          custom_permissions?: any
          student_access_list?: string[]
          page_access_list?: string[]
          feature_access_list?: string[]
          data_access_config?: any
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_roles: {
        Row: {
          id: string
          role_name: string
          display_name: string
          description: string | null
          is_system_role: boolean
          permissions: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role_name: string
          display_name: string
          description?: string | null
          is_system_role?: boolean
          permissions?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_name?: string
          display_name?: string
          description?: string | null
          is_system_role?: boolean
          permissions?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_parents: {
        Row: {
          id: string
          parent_email: string
          parent_name: string
          parent_phone: string
          parent_password: string
          parent_address: string | null
          parent_status: string
          parent_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_email: string
          parent_name: string
          parent_phone: string
          parent_password: string
          parent_address?: string | null
          parent_status?: string
          parent_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_email?: string
          parent_name?: string
          parent_phone?: string
          parent_password?: string
          parent_address?: string | null
          parent_status?: string
          parent_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_parent_student_links: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          relationship_type: string
          is_primary_contact: boolean
          can_view_progress: boolean
          can_receive_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          relationship_type?: string
          is_primary_contact?: boolean
          can_view_progress?: boolean
          can_receive_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
          relationship_type?: string
          is_primary_contact?: boolean
          can_view_progress?: boolean
          can_receive_notifications?: boolean
          created_at?: string
          updated_at?: string
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
        | 'attended'
        | 'absent'
        | 'makeup'
        | 'cancelled'
        | 'sick_leave'
        | 'personal_leave'
      lesson_type_enum:
        | '正常課'
        | '補課'
        | '評估課'
        | '考試課'
        | '比賽課'
        | '拍片課'
      package_status_type: 'active' | 'paused' | 'completed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}