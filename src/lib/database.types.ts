export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          attachments: Json | null
          content: string | null
          content_json: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          is_edited: boolean | null
          is_pinned: boolean | null
          model_used: string | null
          processing_time_ms: number | null
          reactions: Json | null
          reply_to_id: string | null
          room_id: string | null
          sender_role_instance_id: string | null
          sender_type: string
          sender_user_id: string | null
          session_id: string | null
          status: string | null
          thread_id: string | null
          tool_calls: Json | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          content_json?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          model_used?: string | null
          processing_time_ms?: number | null
          reactions?: Json | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_role_instance_id?: string | null
          sender_type: string
          sender_user_id?: string | null
          session_id?: string | null
          status?: string | null
          thread_id?: string | null
          tool_calls?: Json | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          content_json?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          model_used?: string | null
          processing_time_ms?: number | null
          reactions?: Json | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_role_instance_id?: string | null
          sender_type?: string
          sender_user_id?: string | null
          session_id?: string | null
          status?: string | null
          thread_id?: string | null
          tool_calls?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ai_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_roles: {
        Row: {
          available_model_ids: string[] | null
          available_models: string[] | null
          avatar_url: string | null
          capabilities: Json | null
          category: string | null
          created_at: string | null
          creator_user_id: string | null
          default_model: string | null
          description: string | null
          id: string
          is_public: boolean | null
          max_tokens: number | null
          name: string
          pricing_override: Json | null
          rating: number | null
          slug: string
          status: string | null
          system_prompt: string
          temperature: number | null
          tone: string | null
          tools: Json | null
          updated_at: string | null
          usage_count: number | null
          version: number | null
        }
        Insert: {
          available_model_ids?: string[] | null
          available_models?: string[] | null
          avatar_url?: string | null
          capabilities?: Json | null
          category?: string | null
          created_at?: string | null
          creator_user_id?: string | null
          default_model?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_tokens?: number | null
          name: string
          pricing_override?: Json | null
          rating?: number | null
          slug: string
          status?: string | null
          system_prompt: string
          temperature?: number | null
          tone?: string | null
          tools?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Update: {
          available_model_ids?: string[] | null
          available_models?: string[] | null
          avatar_url?: string | null
          capabilities?: Json | null
          category?: string | null
          created_at?: string | null
          creator_user_id?: string | null
          default_model?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_tokens?: number | null
          name?: string
          pricing_override?: Json | null
          rating?: number | null
          slug?: string
          status?: string | null
          system_prompt?: string
          temperature?: number | null
          tone?: string | null
          tools?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Relationships: []
      }
      ai_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          room_type: string | null
          settings: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          room_type?: string | null
          settings?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          room_type?: string | null
          settings?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_rooms_simple: {
        Row: {
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          audio_seconds: number | null
          cost_usd: number | null
          created_at: string | null
          first_token_ms: number | null
          id: string
          image_count: number | null
          input_tokens: number | null
          latency_ms: number | null
          message_id: string | null
          model: string
          output_tokens: number | null
          pricing_snapshot: Json | null
          provider: string
          request_data: Json | null
          response_data: Json | null
          role_instance_id: string | null
          room_id: string | null
          session_id: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          audio_seconds?: number | null
          cost_usd?: number | null
          created_at?: string | null
          first_token_ms?: number | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model: string
          output_tokens?: number | null
          pricing_snapshot?: Json | null
          provider: string
          request_data?: Json | null
          response_data?: Json | null
          role_instance_id?: string | null
          room_id?: string | null
          session_id?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          audio_seconds?: number | null
          cost_usd?: number | null
          created_at?: string | null
          first_token_ms?: number | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string
          output_tokens?: number | null
          pricing_snapshot?: Json | null
          provider?: string
          request_data?: Json | null
          response_data?: Json | null
          role_instance_id?: string | null
          room_id?: string | null
          session_id?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_role_instance_id_fkey"
            columns: ["role_instance_id"]
            isOneToOne: false
            referencedRelation: "role_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          age_rating: string | null
          agent_id: string | null
          assigned_role_id: string | null
          assigned_workflow: string | null
          client_msg_id: string
          content: string
          content_json: Json | null
          created_at: string | null
          error_message: string | null
          food_cost: number | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          message_type: string
          parent_id: string | null
          processing_lock_id: string | null
          processing_started_at: string | null
          processing_time_ms: number | null
          processing_worker_id: string | null
          retry_count: number | null
          role: string
          status: string
          thread_id: string
          turn_no: number | null
          updated_at: string | null
        }
        Insert: {
          age_rating?: string | null
          agent_id?: string | null
          assigned_role_id?: string | null
          assigned_workflow?: string | null
          client_msg_id: string
          content?: string
          content_json?: Json | null
          created_at?: string | null
          error_message?: string | null
          food_cost?: number | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          message_type: string
          parent_id?: string | null
          processing_lock_id?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          processing_worker_id?: string | null
          retry_count?: number | null
          role: string
          status?: string
          thread_id: string
          turn_no?: number | null
          updated_at?: string | null
        }
        Update: {
          age_rating?: string | null
          agent_id?: string | null
          assigned_role_id?: string | null
          assigned_workflow?: string | null
          client_msg_id?: string
          content?: string
          content_json?: Json | null
          created_at?: string | null
          error_message?: string | null
          food_cost?: number | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          message_type?: string
          parent_id?: string | null
          processing_lock_id?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          processing_worker_id?: string | null
          retry_count?: number | null
          role?: string
          status?: string
          thread_id?: string
          turn_no?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          age_rating: string | null
          cost_tracking: Json | null
          created_at: string | null
          food_balance_used: number | null
          id: string
          is_archived: boolean | null
          settings: Json | null
          thread_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_rating?: string | null
          cost_tracking?: Json | null
          created_at?: string | null
          food_balance_used?: number | null
          id?: string
          is_archived?: boolean | null
          settings?: Json | null
          thread_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_rating?: string | null
          cost_tracking?: Json | null
          created_at?: string | null
          food_balance_used?: number | null
          id?: string
          is_archived?: boolean | null
          settings?: Json | null
          thread_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          analysis: Json | null
          analysis_created_at: string | null
          analysis_model: string | null
          analysis_version: number | null
          api_caption: string | null
          api_comments: number | null
          api_hashtags: Json | null
          api_likes: number | null
          api_owner_fullname: string | null
          api_owner_username: string | null
          api_raw: Json | null
          api_timestamp: string | null
          api_video_plays: number | null
          api_video_views: number | null
          category: string | null
          created_at: string
          excerpt_short: string | null
          id: string
          language: string | null
          main_text: string | null
          media_type: string
          metrics_extra: Json | null
          my_idea_links: Json | null
          my_notes: string | null
          my_priority: number | null
          my_rating: number | null
          section_cta: string | null
          section_hook: string | null
          section_script_outline: string | null
          section_structure: string | null
          section_subtitles_raw: string | null
          section_summary: string | null
          source_platform_id: string | null
          source_type: string
          source_url: string | null
          status: string | null
          sub_category: string | null
          subtitle_lines: Json | null
          subtitle_lines_count: number | null
          summary_short: string | null
          tags_ai: Json | null
          tags_manual: Json | null
          target_audience: string | null
          text_blocks: Json | null
          title: string | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          analysis_created_at?: string | null
          analysis_model?: string | null
          analysis_version?: number | null
          api_caption?: string | null
          api_comments?: number | null
          api_hashtags?: Json | null
          api_likes?: number | null
          api_owner_fullname?: string | null
          api_owner_username?: string | null
          api_raw?: Json | null
          api_timestamp?: string | null
          api_video_plays?: number | null
          api_video_views?: number | null
          category?: string | null
          created_at?: string
          excerpt_short?: string | null
          id?: string
          language?: string | null
          main_text?: string | null
          media_type: string
          metrics_extra?: Json | null
          my_idea_links?: Json | null
          my_notes?: string | null
          my_priority?: number | null
          my_rating?: number | null
          section_cta?: string | null
          section_hook?: string | null
          section_script_outline?: string | null
          section_structure?: string | null
          section_subtitles_raw?: string | null
          section_summary?: string | null
          source_platform_id?: string | null
          source_type: string
          source_url?: string | null
          status?: string | null
          sub_category?: string | null
          subtitle_lines?: Json | null
          subtitle_lines_count?: number | null
          summary_short?: string | null
          tags_ai?: Json | null
          tags_manual?: Json | null
          target_audience?: string | null
          text_blocks?: Json | null
          title?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          analysis_created_at?: string | null
          analysis_model?: string | null
          analysis_version?: number | null
          api_caption?: string | null
          api_comments?: number | null
          api_hashtags?: Json | null
          api_likes?: number | null
          api_owner_fullname?: string | null
          api_owner_username?: string | null
          api_raw?: Json | null
          api_timestamp?: string | null
          api_video_plays?: number | null
          api_video_views?: number | null
          category?: string | null
          created_at?: string
          excerpt_short?: string | null
          id?: string
          language?: string | null
          main_text?: string | null
          media_type?: string
          metrics_extra?: Json | null
          my_idea_links?: Json | null
          my_notes?: string | null
          my_priority?: number | null
          my_rating?: number | null
          section_cta?: string | null
          section_hook?: string | null
          section_script_outline?: string | null
          section_structure?: string | null
          section_subtitles_raw?: string | null
          section_summary?: string | null
          source_platform_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string | null
          sub_category?: string | null
          subtitle_lines?: Json | null
          subtitle_lines_count?: number | null
          summary_short?: string | null
          tags_ai?: Json | null
          tags_manual?: Json | null
          target_audience?: string | null
          text_blocks?: Json | null
          title?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          avatar_data: string | null
          avatar_type: string | null
          avatar_url: string | null
          capabilities: Json | null
          category: string | null
          color_scheme: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          frequency_penalty: number | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          max_tokens: number | null
          model_config: Json | null
          model_name: string
          model_provider: string
          name: string
          personality_traits: Json | null
          presence_penalty: number | null
          rating: number | null
          rating_count: number | null
          share_token: string | null
          status: string | null
          system_prompt: string
          temperature: number | null
          tone_settings: Json | null
          top_p: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          avatar_data?: string | null
          avatar_type?: string | null
          avatar_url?: string | null
          capabilities?: Json | null
          category?: string | null
          color_scheme?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          frequency_penalty?: number | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          max_tokens?: number | null
          model_config?: Json | null
          model_name: string
          model_provider: string
          name: string
          personality_traits?: Json | null
          presence_penalty?: number | null
          rating?: number | null
          rating_count?: number | null
          share_token?: string | null
          status?: string | null
          system_prompt: string
          temperature?: number | null
          tone_settings?: Json | null
          top_p?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          avatar_data?: string | null
          avatar_type?: string | null
          avatar_url?: string | null
          capabilities?: Json | null
          category?: string | null
          color_scheme?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          frequency_penalty?: number | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          max_tokens?: number | null
          model_config?: Json | null
          model_name?: string
          model_provider?: string
          name?: string
          personality_traits?: Json | null
          presence_penalty?: number | null
          rating?: number | null
          rating_count?: number | null
          share_token?: string | null
          status?: string | null
          system_prompt?: string
          temperature?: number | null
          tone_settings?: Json | null
          top_p?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: []
      }
      food_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          message_id: string | null
          thread_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          thread_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          thread_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_transactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_transactions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_children: {
        Row: {
          age_months: number | null
          allergies: string | null
          birth_date: string
          created_at: string | null
          full_name: string
          gender: string
          health_notes: string | null
          id: string
          nick_name: string | null
          parent_id: string
          preferences: string | null
          updated_at: string | null
        }
        Insert: {
          age_months?: number | null
          allergies?: string | null
          birth_date: string
          created_at?: string | null
          full_name: string
          gender: string
          health_notes?: string | null
          id?: string
          nick_name?: string | null
          parent_id: string
          preferences?: string | null
          updated_at?: string | null
        }
        Update: {
          age_months?: number | null
          allergies?: string | null
          birth_date?: string
          created_at?: string | null
          full_name?: string
          gender?: string
          health_notes?: string | null
          id?: string
          nick_name?: string | null
          parent_id?: string
          preferences?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hanami_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanami_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          org_name: string
          org_slug: string
          settings: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          org_name: string
          org_slug: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          org_name?: string
          org_slug?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hanami_payme_fps_accounts: {
        Row: {
          created_at: string | null
          fps_link: string | null
          fps_name: string | null
          fps_phone: string | null
          id: string
          institution_code: string | null
          institution_name: string
          is_active: boolean | null
          is_primary: boolean | null
          metadata: Json | null
          notes: string | null
          payme_link: string | null
          payme_name: string
          payme_phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fps_link?: string | null
          fps_name?: string | null
          fps_phone?: string | null
          id?: string
          institution_code?: string | null
          institution_name: string
          is_active?: boolean | null
          is_primary?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payme_link?: string | null
          payme_name: string
          payme_phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fps_link?: string | null
          fps_name?: string | null
          fps_phone?: string | null
          id?: string
          institution_code?: string | null
          institution_name?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payme_link?: string | null
          payme_name?: string
          payme_phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: string
          user_id: string | null
          user_phone: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: string
          user_id?: string | null
          user_phone?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hanami_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hanami_task_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          task_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          task_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "hanami_task_list"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_system_message: boolean | null
          task_id: string
          user_id: string | null
          user_phone: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          task_id: string
          user_id?: string | null
          user_phone?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          task_id?: string
          user_id?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "hanami_task_list"
            referencedColumns: ["id"]
          },
        ]
      }
      hanami_task_list: {
        Row: {
          actual_duration: number | null
          assigned_to: string[] | null
          category: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          due_date: string | null
          estimated_duration: number | null
          follow_up_content: string | null
          id: string
          is_public: boolean | null
          org_id: string | null
          phone: string | null
          priority: string
          progress_percentage: number | null
          project_id: string | null
          status: string
          time_block_end: string | null
          time_block_start: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_duration?: number | null
          assigned_to?: string[] | null
          category?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          due_date?: string | null
          estimated_duration?: number | null
          follow_up_content?: string | null
          id?: string
          is_public?: boolean | null
          org_id?: string | null
          phone?: string | null
          priority: string
          progress_percentage?: number | null
          project_id?: string | null
          status?: string
          time_block_end?: string | null
          time_block_start?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_duration?: number | null
          assigned_to?: string[] | null
          category?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          due_date?: string | null
          estimated_duration?: number | null
          follow_up_content?: string | null
          id?: string
          is_public?: boolean | null
          org_id?: string | null
          phone?: string | null
          priority?: string
          progress_percentage?: number | null
          project_id?: string | null
          status?: string
          time_block_end?: string | null
          time_block_start?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hanami_user_organizations: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          org_id: string
          role: string | null
          updated_at: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          org_id: string
          role?: string | null
          updated_at?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          org_id?: string
          role?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanami_user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "hanami_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          access_count: number | null
          confidence: number | null
          created_at: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          importance: number | null
          key: string | null
          last_accessed_at: string | null
          memory_type: string | null
          role_id: string | null
          role_instance_id: string | null
          room_id: string | null
          scope: Database["public"]["Enums"]["memory_scope"]
          session_id: string | null
          source: Json | null
          task_id: string | null
          ttl_days: number | null
          updated_at: string | null
          user_id: string | null
          value: string
          value_json: Json | null
        }
        Insert: {
          access_count?: number | null
          confidence?: number | null
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          key?: string | null
          last_accessed_at?: string | null
          memory_type?: string | null
          role_id?: string | null
          role_instance_id?: string | null
          room_id?: string | null
          scope: Database["public"]["Enums"]["memory_scope"]
          session_id?: string | null
          source?: Json | null
          task_id?: string | null
          ttl_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          value: string
          value_json?: Json | null
        }
        Update: {
          access_count?: number | null
          confidence?: number | null
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          key?: string | null
          last_accessed_at?: string | null
          memory_type?: string | null
          role_id?: string | null
          role_instance_id?: string | null
          room_id?: string | null
          scope?: Database["public"]["Enums"]["memory_scope"]
          session_id?: string | null
          source?: Json | null
          task_id?: string | null
          ttl_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          value?: string
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_role_instance_id_fkey"
            columns: ["role_instance_id"]
            isOneToOne: false
            referencedRelation: "role_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      message_costs: {
        Row: {
          created_at: string | null
          food_amount: number | null
          food_cost_usd: number | null
          id: string
          input_cost_usd: number | null
          input_tokens: number
          message_id: string
          model_name: string
          model_provider: string
          output_cost_usd: number | null
          output_tokens: number
          thread_id: string
          total_cost_usd: number | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          food_amount?: number | null
          food_cost_usd?: number | null
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number
          message_id: string
          model_name: string
          model_provider: string
          output_cost_usd?: number | null
          output_tokens?: number
          thread_id: string
          total_cost_usd?: number | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          food_amount?: number | null
          food_cost_usd?: number | null
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number
          message_id?: string
          model_name?: string
          model_provider?: string
          output_cost_usd?: number | null
          output_tokens?: number
          thread_id?: string
          total_cost_usd?: number | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_costs_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_processing_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          message_id: string
          worker_id: string | null
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          message_id: string
          worker_id?: string | null
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          message_id?: string
          worker_id?: string | null
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_processing_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      model_configs: {
        Row: {
          capabilities: Json | null
          context_window: number | null
          context_window_display: string | null
          created_at: string | null
          default_frequency_penalty: number | null
          default_presence_penalty: number | null
          default_temperature: number | null
          default_top_p: number | null
          description: string | null
          display_name: string
          effective_date: string | null
          id: string
          input_cost_usd: number | null
          is_active: boolean | null
          is_available: boolean | null
          is_free: boolean | null
          max_tokens: number | null
          metadata: Json | null
          model_id: string
          model_name: string
          model_type: string
          output_cost_usd: number | null
          pricing_details: Json | null
          pricing_info: Json | null
          pricing_version: number | null
          provider: string
          supported_modalities: string[] | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          context_window?: number | null
          context_window_display?: string | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_p?: number | null
          description?: string | null
          display_name: string
          effective_date?: string | null
          id?: string
          input_cost_usd?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_free?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_id: string
          model_name: string
          model_type?: string
          output_cost_usd?: number | null
          pricing_details?: Json | null
          pricing_info?: Json | null
          pricing_version?: number | null
          provider: string
          supported_modalities?: string[] | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          context_window?: number | null
          context_window_display?: string | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_p?: number | null
          description?: string | null
          display_name?: string
          effective_date?: string | null
          id?: string
          input_cost_usd?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_free?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_id?: string
          model_name?: string
          model_type?: string
          output_cost_usd?: number | null
          pricing_details?: Json | null
          pricing_info?: Json | null
          pricing_version?: number | null
          provider?: string
          supported_modalities?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      model_pricing: {
        Row: {
          audio_price_usd: number | null
          context_window: number | null
          created_at: string | null
          image_price_usd: number | null
          input_price_usd: number | null
          is_active: boolean | null
          max_tokens: number | null
          metadata: Json | null
          model: string
          output_price_usd: number | null
          provider: string
          supports_audio: boolean | null
          supports_tools: boolean | null
          supports_vision: boolean | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          audio_price_usd?: number | null
          context_window?: number | null
          created_at?: string | null
          image_price_usd?: number | null
          input_price_usd?: number | null
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model: string
          output_price_usd?: number | null
          provider: string
          supports_audio?: boolean | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_price_usd?: number | null
          context_window?: number | null
          created_at?: string | null
          image_price_usd?: number | null
          input_price_usd?: number | null
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model?: string
          output_price_usd?: number | null
          provider?: string
          supports_audio?: boolean | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      model_pricing_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          context_window: number | null
          context_window_display: string | null
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          model_config_id: string
          pricing_details: Json
          pricing_version: number
          supported_modalities: string[] | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          context_window?: number | null
          context_window_display?: string | null
          created_at?: string | null
          effective_from: string
          effective_until?: string | null
          id?: string
          model_config_id: string
          pricing_details: Json
          pricing_version: number
          supported_modalities?: string[] | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          context_window?: number | null
          context_window_display?: string | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          model_config_id?: string
          pricing_details?: Json
          pricing_version?: number
          supported_modalities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "model_pricing_history_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "available_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_pricing_history_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "model_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_bindings: {
        Row: {
          access_count: number | null
          binding_date: string | null
          binding_status: string | null
          binding_type: string | null
          created_at: string | null
          id: string
          institution: string | null
          last_accessed: string | null
          notes: string | null
          parent_id: string
          student_id: string
          student_name: string
          student_oid: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          binding_date?: string | null
          binding_status?: string | null
          binding_type?: string | null
          created_at?: string | null
          id?: string
          institution?: string | null
          last_accessed?: string | null
          notes?: string | null
          parent_id: string
          student_id: string
          student_name: string
          student_oid?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          binding_date?: string | null
          binding_status?: string | null
          binding_type?: string | null
          created_at?: string | null
          id?: string
          institution?: string | null
          last_accessed?: string | null
          notes?: string | null
          parent_id?: string
          student_id?: string
          student_name?: string
          student_oid?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          airwallex_intent_id: string | null
          airwallex_request_id: string | null
          amount: number
          cancel_url: string | null
          checkout_url: string | null
          created_at: string | null
          currency: string
          description: string | null
          file_name: string | null
          id: string
          metadata: Json | null
          payment_method: string
          paypal_order_id: string | null
          return_url: string | null
          screenshot_url: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          airwallex_intent_id?: string | null
          airwallex_request_id?: string | null
          amount: number
          cancel_url?: string | null
          checkout_url?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          payment_method: string
          paypal_order_id?: string | null
          return_url?: string | null
          screenshot_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          airwallex_intent_id?: string | null
          airwallex_request_id?: string | null
          amount?: number
          cancel_url?: string | null
          checkout_url?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string
          paypal_order_id?: string | null
          return_url?: string | null
          screenshot_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_instances: {
        Row: {
          context_window: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          max_tokens_override: number | null
          model_override: string | null
          nickname: string | null
          role_id: string | null
          room_id: string | null
          settings: Json | null
          system_prompt_override: string | null
          temperature_override: number | null
          updated_at: string | null
        }
        Insert: {
          context_window?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          max_tokens_override?: number | null
          model_override?: string | null
          nickname?: string | null
          role_id?: string | null
          room_id?: string | null
          settings?: Json | null
          system_prompt_override?: string | null
          temperature_override?: number | null
          updated_at?: string | null
        }
        Update: {
          context_window?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          max_tokens_override?: number | null
          model_override?: string | null
          nickname?: string | null
          role_id?: string | null
          room_id?: string | null
          settings?: Json | null
          system_prompt_override?: string | null
          temperature_override?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          joined_at: string | null
          last_active_at: string | null
          permissions: Json | null
          role: string | null
          room_id: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          joined_at?: string | null
          last_active_at?: string | null
          permissions?: Json | null
          role?: string | null
          room_id: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          joined_at?: string | null
          last_active_at?: string | null
          permissions?: Json | null
          role?: string | null
          room_id?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ai_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_roles: {
        Row: {
          display_order: number | null
          is_active: boolean | null
          quick_access: boolean | null
          role_instance_id: string
          room_id: string
        }
        Insert: {
          display_order?: number | null
          is_active?: boolean | null
          quick_access?: boolean | null
          role_instance_id: string
          room_id: string
        }
        Update: {
          display_order?: number | null
          is_active?: boolean | null
          quick_access?: boolean | null
          role_instance_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_roles_role_instance_id_fkey"
            columns: ["role_instance_id"]
            isOneToOne: false
            referencedRelation: "role_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_3d_characters: {
        Row: {
          avatar_url: string | null
          character_name: string
          character_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          model_url: string
          personality_config: Json
          voice_config: Json | null
        }
        Insert: {
          avatar_url?: string | null
          character_name: string
          character_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_url: string
          personality_config: Json
          voice_config?: Json | null
        }
        Update: {
          avatar_url?: string | null
          character_name?: string
          character_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_url?: string
          personality_config?: Json
          voice_config?: Json | null
        }
        Relationships: []
      }
      saas_character_interactions: {
        Row: {
          character_id: string | null
          created_at: string | null
          id: string
          interaction_type: string
          message_content: string | null
          metadata: Json | null
          response_content: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          message_content?: string | null
          metadata?: Json | null
          response_content?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          message_content?: string | null
          metadata?: Json | null
          response_content?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_character_interactions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "saas_3d_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_character_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_character_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_character_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_character_modules: {
        Row: {
          character_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_config: Json
          module_type: string
          priority: number | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_config: Json
          module_type: string
          priority?: number | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_config?: Json
          module_type?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_character_modules_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "saas_3d_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_child_bindings: {
        Row: {
          binding_date: string | null
          binding_status: string | null
          child_student_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
          verification_code: string | null
        }
        Insert: {
          binding_date?: string | null
          binding_status?: string | null
          child_student_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          verification_code?: string | null
        }
        Update: {
          binding_date?: string | null
          binding_status?: string | null
          child_student_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_child_bindings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_child_bindings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_child_bindings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_coupons: {
        Row: {
          applicable_plans: string[] | null
          coupon_code: string
          coupon_name: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          institution_code: string | null
          institution_name: string | null
          is_active: boolean
          min_amount: number | null
          notes: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          usage_limit_per_user: number | null
          used_by_emails: string[] | null
          used_by_user_ids: string[] | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          coupon_code: string
          coupon_name: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          institution_code?: string | null
          institution_name?: string | null
          is_active?: boolean
          min_amount?: number | null
          notes?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_limit_per_user?: number | null
          used_by_emails?: string[] | null
          used_by_user_ids?: string[] | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          coupon_code?: string
          coupon_name?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          institution_code?: string | null
          institution_name?: string | null
          is_active?: boolean
          min_amount?: number | null
          notes?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_limit_per_user?: number | null
          used_by_emails?: string[] | null
          used_by_user_ids?: string[] | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      saas_emotional_states: {
        Row: {
          child_student_id: string | null
          context: string | null
          emotional_state: string
          id: string
          intensity_level: number | null
          recorded_at: string | null
          trigger_event: string | null
          user_id: string | null
        }
        Insert: {
          child_student_id?: string | null
          context?: string | null
          emotional_state: string
          id?: string
          intensity_level?: number | null
          recorded_at?: string | null
          trigger_event?: string | null
          user_id?: string | null
        }
        Update: {
          child_student_id?: string | null
          context?: string | null
          emotional_state?: string
          id?: string
          intensity_level?: number | null
          recorded_at?: string | null
          trigger_event?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_emotional_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_emotional_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_emotional_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_emotional_support_logs: {
        Row: {
          character_id: string | null
          created_at: string | null
          effectiveness_rating: number | null
          emotional_state_after: string | null
          emotional_state_before: string | null
          id: string
          support_content: string
          support_type: string
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          emotional_state_after?: string | null
          emotional_state_before?: string | null
          id?: string
          support_content: string
          support_type: string
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          emotional_state_after?: string | null
          emotional_state_before?: string | null
          id?: string
          support_content?: string
          support_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_emotional_support_logs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "saas_3d_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_emotional_support_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_emotional_support_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_emotional_support_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_gacha_draw_history: {
        Row: {
          created_at: string | null
          draw_count: number
          draw_type: string
          id: string
          machine_id: string
          points_spent: number
          rewards_won: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          draw_count?: number
          draw_type: string
          id?: string
          machine_id: string
          points_spent: number
          rewards_won: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          draw_count?: number
          draw_type?: string
          id?: string
          machine_id?: string
          points_spent?: number
          rewards_won?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_gacha_draw_history_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "saas_gacha_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_gacha_machine_rewards: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          machine_id: string
          probability: number
          reward_id: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          machine_id: string
          probability: number
          reward_id: string
          updated_at?: string | null
          weight?: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          machine_id?: string
          probability?: number
          reward_id?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "saas_gacha_machine_rewards_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "saas_gacha_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_gacha_machine_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "saas_gacha_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_gacha_machines: {
        Row: {
          background_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          end_time: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          machine_name: string
          machine_slug: string
          single_draw_cost: number
          start_time: string | null
          ten_draw_bonus: number | null
          ten_draw_cost: number
          theme_config: Json | null
          updated_at: string | null
        }
        Insert: {
          background_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          machine_name: string
          machine_slug: string
          single_draw_cost?: number
          start_time?: string | null
          ten_draw_bonus?: number | null
          ten_draw_cost?: number
          theme_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          background_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          machine_name?: string
          machine_slug?: string
          single_draw_cost?: number
          start_time?: string | null
          ten_draw_bonus?: number | null
          ten_draw_cost?: number
          theme_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_gacha_rewards: {
        Row: {
          created_at: string | null
          delivery_type: string
          icon_emoji: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          rarity: string
          reward_description: string | null
          reward_name: string
          reward_type: string
          reward_value: Json
          stock_remaining: number | null
          stock_total: number | null
          updated_at: string | null
          usage_limit: number | null
          valid_days: number | null
        }
        Insert: {
          created_at?: string | null
          delivery_type?: string
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          rarity: string
          reward_description?: string | null
          reward_name: string
          reward_type: string
          reward_value: Json
          stock_remaining?: number | null
          stock_total?: number | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_days?: number | null
        }
        Update: {
          created_at?: string | null
          delivery_type?: string
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          rarity?: string
          reward_description?: string | null
          reward_name?: string
          reward_type?: string
          reward_value?: Json
          stock_remaining?: number | null
          stock_total?: number | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_days?: number | null
        }
        Relationships: []
      }
      saas_invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          payment_id: string | null
          pdf_url: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          payment_id?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          payment_id?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "saas_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_learning_progress: {
        Row: {
          completion_status: string | null
          created_at: string | null
          id: string
          node_id: string | null
          notes: string | null
          path_id: string | null
          performance_rating: number | null
          time_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completion_status?: string | null
          created_at?: string | null
          id?: string
          node_id?: string | null
          notes?: string | null
          path_id?: string | null
          performance_rating?: number | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completion_status?: string | null
          created_at?: string | null
          id?: string
          node_id?: string | null
          notes?: string | null
          path_id?: string | null
          performance_rating?: number | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_learning_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "saas_user_learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_memory_relationships: {
        Row: {
          created_at: string | null
          id: string
          memory_id: string | null
          related_memory_id: string | null
          relationship_type: string
          strength: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          memory_id?: string | null
          related_memory_id?: string | null
          relationship_type: string
          strength?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          memory_id?: string | null
          related_memory_id?: string | null
          relationship_type?: string
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_memory_relationships_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "saas_personal_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_memory_relationships_related_memory_id_fkey"
            columns: ["related_memory_id"]
            isOneToOne: false
            referencedRelation: "saas_personal_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          external_payment_id: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          payment_method: string
          payment_status: string
          receipt_url: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          external_payment_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          payment_method: string
          payment_status: string
          receipt_url?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          external_payment_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          payment_method?: string
          payment_status?: string
          receipt_url?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_personal_memories: {
        Row: {
          child_student_id: string | null
          created_at: string | null
          id: string
          importance_level: number | null
          last_accessed: string | null
          memory_content: Json
          memory_tags: string[] | null
          memory_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          child_student_id?: string | null
          created_at?: string | null
          id?: string
          importance_level?: number | null
          last_accessed?: string | null
          memory_content: Json
          memory_tags?: string[] | null
          memory_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          child_student_id?: string | null
          created_at?: string | null
          id?: string
          importance_level?: number | null
          last_accessed?: string | null
          memory_content?: Json
          memory_tags?: string[] | null
          memory_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_personal_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_personal_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_personal_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_personalized_stories: {
        Row: {
          base_story_id: string | null
          child_student_id: string | null
          created_at: string | null
          engagement_rating: number | null
          id: string
          personalization_elements: Json | null
          personalized_content: string
          story_session_id: string | null
          user_id: string | null
        }
        Insert: {
          base_story_id?: string | null
          child_student_id?: string | null
          created_at?: string | null
          engagement_rating?: number | null
          id?: string
          personalization_elements?: Json | null
          personalized_content: string
          story_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          base_story_id?: string | null
          child_student_id?: string | null
          created_at?: string | null
          engagement_rating?: number | null
          id?: string
          personalization_elements?: Json | null
          personalized_content?: string
          story_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_personalized_stories_base_story_id_fkey"
            columns: ["base_story_id"]
            isOneToOne: false
            referencedRelation: "saas_story_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_personalized_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_personalized_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_personalized_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_phone_profiles: {
        Row: {
          analysis_model: string | null
          analysis_raw_md: string | null
          analysis_structured: Json | null
          analysis_version: string | null
          attention_notes: string | null
          attitude: string | null
          created_at: string | null
          id: string
          important_notes: string | null
          last_analysis_at: string | null
          level: string | null
          needs: string | null
          person_name: string | null
          personality_traits: string | null
          phone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_model?: string | null
          analysis_raw_md?: string | null
          analysis_structured?: Json | null
          analysis_version?: string | null
          attention_notes?: string | null
          attitude?: string | null
          created_at?: string | null
          id?: string
          important_notes?: string | null
          last_analysis_at?: string | null
          level?: string | null
          needs?: string | null
          person_name?: string | null
          personality_traits?: string | null
          phone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_model?: string | null
          analysis_raw_md?: string | null
          analysis_structured?: Json | null
          analysis_version?: string | null
          attention_notes?: string | null
          attitude?: string | null
          created_at?: string | null
          id?: string
          important_notes?: string | null
          last_analysis_at?: string | null
          level?: string | null
          needs?: string | null
          person_name?: string | null
          personality_traits?: string | null
          phone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_phone_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_phone_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_phone_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_point_earning_rules: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          points_amount: number
          rule_name: string
          rule_type: string
          updated_at: string | null
          valid_days: number | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          points_amount: number
          rule_name: string
          rule_type: string
          updated_at?: string | null
          valid_days?: number | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          points_amount?: number
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
          valid_days?: number | null
        }
        Relationships: []
      }
      saas_point_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          points_change: number
          source_id: string | null
          source_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          points_change: number
          source_id?: string | null
          source_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          points_change?: number
          source_id?: string | null
          source_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      saas_story_library: {
        Row: {
          created_at: string | null
          created_by: string | null
          emotional_themes: string[] | null
          id: string
          is_ai_generated: boolean | null
          is_public: boolean | null
          learning_objectives: string[] | null
          story_content: string
          story_tags: string[] | null
          story_title: string
          story_type: string
          target_age_max: number | null
          target_age_min: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          emotional_themes?: string[] | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          story_content: string
          story_tags?: string[] | null
          story_title: string
          story_type: string
          target_age_max?: number | null
          target_age_min?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          emotional_themes?: string[] | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          story_content?: string
          story_tags?: string[] | null
          story_title?: string
          story_type?: string
          target_age_max?: number | null
          target_age_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_story_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_story_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_story_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_subscription_plans: {
        Row: {
          created_at: string | null
          features: Json
          hk_payment_plan_id: string | null
          id: string
          is_active: boolean | null
          plan_name: string
          plan_type: string
          price_monthly: number | null
          price_yearly: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          usage_limit: number
        }
        Insert: {
          created_at?: string | null
          features: Json
          hk_payment_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          plan_name: string
          plan_type: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          usage_limit: number
        }
        Update: {
          created_at?: string | null
          features?: Json
          hk_payment_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          plan_name?: string
          plan_type?: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          usage_limit?: number
        }
        Relationships: []
      }
      saas_task_definitions: {
        Row: {
          created_at: string | null
          difficulty_level: number | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          required_abilities: string[] | null
          rewards: Json | null
          success_criteria: Json | null
          task_description: string
          task_name: string
          task_type: string
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          required_abilities?: string[] | null
          rewards?: Json | null
          success_criteria?: Json | null
          task_description: string
          task_name: string
          task_type: string
        }
        Update: {
          created_at?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          required_abilities?: string[] | null
          rewards?: Json | null
          success_criteria?: Json | null
          task_description?: string
          task_name?: string
          task_type?: string
        }
        Relationships: []
      }
      saas_usage_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          session_duration: number | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_duration?: number | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_duration?: number | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_usage_records: {
        Row: {
          id: string
          recorded_at: string | null
          subscription_id: string
          usage_amount: number
          usage_metadata: Json | null
          usage_type: string
          user_id: string
        }
        Insert: {
          id?: string
          recorded_at?: string | null
          subscription_id: string
          usage_amount?: number
          usage_metadata?: Json | null
          usage_type: string
          user_id: string
        }
        Update: {
          id?: string
          recorded_at?: string | null
          subscription_id?: string
          usage_amount?: number
          usage_metadata?: Json | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_user_learning_paths: {
        Row: {
          child_student_id: string | null
          completed_at: string | null
          created_at: string | null
          current_node_id: string | null
          id: string
          path_id: string | null
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          child_student_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          id?: string
          path_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          child_student_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          id?: string
          path_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_user_learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_user_learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_user_points: {
        Row: {
          available_points: number
          created_at: string | null
          expired_points: number
          id: string
          total_points: number
          updated_at: string | null
          used_points: number
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string | null
          expired_points?: number
          id?: string
          total_points?: number
          updated_at?: string | null
          used_points?: number
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string | null
          expired_points?: number
          id?: string
          total_points?: number
          updated_at?: string | null
          used_points?: number
          user_id?: string
        }
        Relationships: []
      }
      saas_user_rewards: {
        Row: {
          created_at: string | null
          delivery_address: Json | null
          delivery_status: string | null
          draw_history_id: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          obtained_at: string | null
          reward_code: string | null
          reward_id: string
          status: string
          tracking_number: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: Json | null
          delivery_status?: string | null
          draw_history_id?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          obtained_at?: string | null
          reward_code?: string | null
          reward_id: string
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: Json | null
          delivery_status?: string | null
          draw_history_id?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          obtained_at?: string | null
          reward_code?: string | null
          reward_id?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_user_rewards_draw_history_id_fkey"
            columns: ["draw_history_id"]
            isOneToOne: false
            referencedRelation: "saas_gacha_draw_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "saas_gacha_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_user_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          end_date: string | null
          hk_payment_id: string | null
          id: string
          invoice_url: string | null
          payment_method: string | null
          payment_method_id: string | null
          plan_id: string | null
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          usage_stats: Json
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          end_date?: string | null
          hk_payment_id?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          plan_id?: string | null
          start_date: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          usage_stats?: Json
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          end_date?: string | null
          hk_payment_id?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          plan_id?: string | null
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          usage_stats?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_user_tasks: {
        Row: {
          assigned_at: string | null
          assigned_by_character: string | null
          child_student_id: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          id: string
          performance_rating: number | null
          started_at: string | null
          task_definition_id: string | null
          task_status: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_character?: string | null
          child_student_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          id?: string
          performance_rating?: number | null
          started_at?: string | null
          task_definition_id?: string | null
          task_status?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by_character?: string | null
          child_student_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          id?: string
          performance_rating?: number | null
          started_at?: string | null
          task_definition_id?: string | null
          task_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_user_tasks_assigned_by_character_fkey"
            columns: ["assigned_by_character"]
            isOneToOne: false
            referencedRelation: "saas_3d_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_tasks_task_definition_id_fkey"
            columns: ["task_definition_id"]
            isOneToOne: false
            referencedRelation: "saas_task_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_learning_progress_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saas_user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "saas_users"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean | null
          last_login: string | null
          phone: string | null
          subscription_end_date: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          user_role: Database["public"]["Enums"]["saas_user_role"]
          verification_method: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_role?: Database["public"]["Enums"]["saas_user_role"]
          verification_method?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_role?: Database["public"]["Enums"]["saas_user_role"]
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_users_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_age_verification: {
        Row: {
          age_verified: boolean | null
          birth_date: string | null
          created_at: string | null
          id: string
          parent_consent: boolean | null
          parent_email: string | null
          parent_verified_at: string | null
          updated_at: string | null
          user_id: string
          verification_method: string | null
        }
        Insert: {
          age_verified?: boolean | null
          birth_date?: string | null
          created_at?: string | null
          id?: string
          parent_consent?: boolean | null
          parent_email?: string | null
          parent_verified_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_method?: string | null
        }
        Update: {
          age_verified?: boolean | null
          birth_date?: string | null
          created_at?: string | null
          id?: string
          parent_consent?: boolean | null
          parent_email?: string | null
          parent_verified_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_method?: string | null
        }
        Relationships: []
      }
      user_food_balance: {
        Row: {
          created_at: string | null
          current_balance: number | null
          daily_usage: number | null
          id: string
          last_monthly_reset: string | null
          monthly_allowance: number | null
          monthly_usage: number | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
          weekly_usage: number | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          daily_usage?: number | null
          id?: string
          last_monthly_reset?: string | null
          monthly_allowance?: number | null
          monthly_usage?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
          weekly_usage?: number | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          daily_usage?: number | null
          id?: string
          last_monthly_reset?: string | null
          monthly_allowance?: number | null
          monthly_usage?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_usage?: number | null
        }
        Relationships: []
      }
      user_role_settings: {
        Row: {
          created_at: string | null
          guidance_override: string | null
          id: string
          is_active: boolean | null
          model_config_id: string | null
          model_override: string | null
          role_id: string
          tone_override: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guidance_override?: string | null
          id?: string
          is_active?: boolean | null
          model_config_id?: string | null
          model_override?: string | null
          role_id: string
          tone_override?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          guidance_override?: string | null
          id?: string
          is_active?: boolean | null
          model_config_id?: string | null
          model_override?: string | null
          role_id?: string
          tone_override?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_settings_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "available_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_settings_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "model_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_settings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ai_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_models: {
        Row: {
          capabilities: Json | null
          context_window: number | null
          description: string | null
          display_name: string | null
          id: string | null
          input_cost_usd: number | null
          is_free: boolean | null
          model_id: string | null
          model_name: string | null
          model_type: string | null
          output_cost_usd: number | null
          price_tier: string | null
          provider: string | null
        }
        Insert: {
          capabilities?: Json | null
          context_window?: number | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          input_cost_usd?: number | null
          is_free?: boolean | null
          model_id?: string | null
          model_name?: string | null
          model_type?: string | null
          output_cost_usd?: number | null
          price_tier?: never
          provider?: string | null
        }
        Update: {
          capabilities?: Json | null
          context_window?: number | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          input_cost_usd?: number | null
          is_free?: boolean | null
          model_id?: string | null
          model_name?: string | null
          model_type?: string | null
          output_cost_usd?: number | null
          price_tier?: never
          provider?: string | null
        }
        Relationships: []
      }
      hanami_task_stats: {
        Row: {
          avg_actual_duration: number | null
          avg_progress: number | null
          blocked_tasks: number | null
          cancelled_tasks: number | null
          completed_tasks: number | null
          important_not_urgent_tasks: number | null
          in_progress_tasks: number | null
          not_urgent_not_important_tasks: number | null
          pending_tasks: number | null
          total_tasks: number | null
          urgent_important_tasks: number | null
          urgent_not_important_tasks: number | null
        }
        Relationships: []
      }
      hanami_user_task_stats: {
        Row: {
          avg_progress: number | null
          completed_tasks: number | null
          in_progress_tasks: number | null
          pending_tasks: number | null
          phone: string | null
          total_tasks: number | null
          total_time_spent: number | null
        }
        Relationships: []
      }
      payment_statistics: {
        Row: {
          average_amount: number | null
          count: number | null
          date: string | null
          payment_method: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      saas_character_interaction_stats: {
        Row: {
          avg_duration: number | null
          character_name: string | null
          character_type: string | null
          interaction_date: string | null
          total_interactions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      saas_learning_progress_overview: {
        Row: {
          avg_performance_rating: number | null
          child_student_id: string | null
          completed_at: string | null
          completed_nodes: number | null
          full_name: string | null
          path_id: string | null
          path_status: string | null
          progress_percentage: number | null
          started_at: string | null
          total_nodes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      saas_user_overview: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          last_login: string | null
          monthly_usage: number | null
          plan_name: string | null
          plan_type: string | null
          subscription_status: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Relationships: []
      }
      v_message_queue_stats: {
        Row: {
          assigned_role_id: string | null
          avg_processing_seconds: number | null
          completed_count: number | null
          error_count: number | null
          oldest_queued: string | null
          processing_count: number | null
          queued_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_food_cost:
        | {
            Args: {
              input_tokens: number
              model_id: string
              output_tokens: number
            }
            Returns: number
          }
        | {
            Args: {
              p_input_tokens: number
              p_model_name: string
              p_model_provider: string
              p_output_tokens: number
            }
            Returns: {
              food_amount: number
              food_cost_usd: number
              total_cost_usd: number
            }[]
          }
      check_age_access: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_rls_status: {
        Args: never
        Returns: {
          policies: string[]
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      check_room_access: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      check_room_admin: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { action_type: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_orphaned_message_costs: {
        Args: never
        Returns: {
          cleaned_count: number
          orphaned_count: number
        }[]
      }
      create_room_with_member: {
        Args: {
          p_description: string
          p_room_type: string
          p_selected_roles: string[]
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      generate_invite_code: { Args: never; Returns: string }
      get_active_payme_fps_accounts: {
        Args: never
        Returns: {
          created_at: string
          fps_link: string
          fps_name: string
          fps_phone: string
          id: string
          institution_code: string
          institution_name: string
          is_primary: boolean
          notes: string
          payme_link: string
          payme_name: string
          payme_phone: string
        }[]
      }
      get_current_hanami_user_id: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: string }
      get_parent_bound_students: {
        Args: { p_parent_id: string }
        Returns: {
          access_count: number
          binding_date: string
          binding_id: string
          binding_status: string
          binding_type: string
          institution: string
          last_accessed: string
          notes: string
          student_id: string
          student_name: string
          student_oid: string
        }[]
      }
      get_payment_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          failed_payments: number
          pending_payments: number
          successful_payments: number
          total_amount: number
          total_payments: number
        }[]
      }
      get_primary_payme_fps_account: {
        Args: { p_institution_name: string }
        Returns: {
          fps_link: string
          fps_name: string
          fps_phone: string
          id: string
          institution_name: string
          notes: string
          payme_link: string
          payme_name: string
          payme_phone: string
        }[]
      }
      get_room_messages: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_room_id: string
          p_user_id: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          reply_to_id: string
          role_avatar: string
          role_name: string
          sender_role_instance_id: string
          sender_type: Database["public"]["Enums"]["sender_type"]
          sender_user_id: string
        }[]
      }
      get_saas_user_by_phone: {
        Args: { p_phone: string }
        Returns: {
          email: string
          full_name: string
          saas_phone: string
          saas_user_id: string
          subscription_status: string
          user_role: Database["public"]["Enums"]["saas_user_role"]
        }[]
      }
      get_task_completion_stats: {
        Args: { user_phone_param?: string }
        Returns: {
          avg_progress: number
          completed_tasks: number
          completion_rate: number
          total_tasks: number
          total_time_spent: number
        }[]
      }
      get_user_age: { Args: { user_id: string }; Returns: number }
      get_user_payment_records: {
        Args: { p_user_id: string }
        Returns: {
          airwallex_intent_id: string
          amount: number
          created_at: string
          currency: string
          description: string
          id: string
          payment_method: string
          screenshot_url: string
          status: string
        }[]
      }
      get_user_rooms: {
        Args: { user_uuid: string }
        Returns: {
          access_level: string
          created_by: string
          description: string
          last_message_at: string
          room_id: string
          room_type: string
          title: string
        }[]
      }
      get_user_tasks: {
        Args: { user_phone_param: string }
        Returns: {
          actual_duration: number
          assigned_to: string
          category: string[]
          created_at: string
          description: string
          difficulty_level: number
          due_date: string
          estimated_duration: number
          id: string
          is_public: boolean
          phone: string
          priority: string
          progress_percentage: number
          project_id: string
          status: string
          time_block_end: string
          time_block_start: string
          title: string
          updated_at: string
        }[]
      }
      handle_n8n_callback: {
        Args: {
          p_content: string
          p_input_tokens?: number
          p_message_id: string
          p_model_name?: string
          p_model_provider?: string
          p_output_tokens?: number
          p_processing_time_ms?: number
          p_status?: string
          p_thread_id: string
          p_user_id: string
        }
        Returns: {
          cost_id: string
          cost_inserted: boolean
          message_updated: boolean
        }[]
      }
      insert_message_cost_safely: {
        Args: {
          p_input_cost_usd?: number
          p_input_tokens?: number
          p_message_id: string
          p_model_name?: string
          p_model_provider?: string
          p_output_cost_usd?: number
          p_output_tokens?: number
          p_thread_id: string
          p_user_id: string
        }
        Returns: string
      }
      is_admin:
        | { Args: { user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_room_member: { Args: { room_uuid: string }; Returns: boolean }
      is_room_member_flexible: { Args: { room_uuid: string }; Returns: boolean }
      is_room_member_hanami:
        | { Args: { p_room_id: string; p_user_id: string }; Returns: boolean }
        | { Args: { p_room_id: string }; Returns: boolean }
      is_room_owner: { Args: { room_uuid: string }; Returns: boolean }
      lease_messages_batch: {
        Args: { p_batch_size?: number; p_role_id: string; p_worker_id: string }
        Returns: {
          client_msg_id: string
          content: string
          message_id: string
          thread_id: string
          user_id: string
        }[]
      }
      migrate_available_models_to_uuids: { Args: never; Returns: undefined }
      release_locks_by_worker: {
        Args: { p_worker_id: string }
        Returns: number
      }
      release_message_lock: {
        Args: { p_final_status?: string; p_message_id: string }
        Returns: boolean
      }
      safe_update_message_status: {
        Args: { p_message_id: string; p_new_status: string }
        Returns: {
          id: string
          status: string
          thread_id: string
          updated_at: string
        }[]
      }
      scan_stuck_messages: {
        Args: { p_timeout_minutes?: number }
        Returns: {
          assigned_role_id: string
          client_msg_id: string
          message_id: string
          retry_count: number
          stuck_duration: unknown
          thread_id: string
        }[]
      }
      test_rls_policies: {
        Args: never
        Returns: {
          is_enabled: boolean
          policy_count: number
          table_name: string
        }[]
      }
      update_payment_status: {
        Args: { p_metadata?: Json; p_payment_id: string; p_status: string }
        Returns: boolean
      }
      update_student_access: {
        Args: { p_binding_id: string }
        Returns: undefined
      }
      upsert_model_config: {
        Args: {
          p_capabilities: Json
          p_context_window: number
          p_description: string
          p_display_name: string
          p_input_cost: number
          p_is_free: boolean
          p_metadata: Json
          p_model_id: string
          p_model_name: string
          p_model_type: string
          p_output_cost: number
          p_provider: string
        }
        Returns: string
      }
      use_promo_code_unified: {
        Args: {
          p_discount_amount: number
          p_order_amount: number
          p_promo_code_id: string
          p_user_email: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_can_access_room: {
        Args: { room_uuid: string; user_uuid: string }
        Returns: boolean
      }
      validate_promo_code_unified: {
        Args: {
          p_code: string
          p_order_amount: number
          p_user_email: string
          p_user_id: string
        }
        Returns: {
          discount_amount: number
          error_message: string
          final_amount: number
          institution_name: string
          is_valid: boolean
          promo_code_id: string
        }[]
      }
    }
    Enums: {
      memory_scope: "global" | "role" | "user" | "room" | "session" | "task"
      role_status: "active" | "inactive" | "archived"
      saas_user_role:
        | "super_admin"
        | "admin"
        | "user"
        | "staff"
        | "moderator"
        | "billing_manager"
        | "auditor"
      sender_type: "user" | "role" | "system"
      task_status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      memory_scope: ["global", "role", "user", "room", "session", "task"],
      role_status: ["active", "inactive", "archived"],
      saas_user_role: [
        "super_admin",
        "admin",
        "user",
        "staff",
        "moderator",
        "billing_manager",
        "auditor",
      ],
      sender_type: ["user", "role", "system"],
      task_status: ["queued", "running", "succeeded", "failed", "cancelled"],
    },
  },
} as const
