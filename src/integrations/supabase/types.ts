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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clarity_state: {
        Row: {
          alignment_score: number | null
          checkins_score: number | null
          consistency_score: number | null
          created_at: string | null
          fog_value: number
          id: string
          recovery_score: number | null
          reflection_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alignment_score?: number | null
          checkins_score?: number | null
          consistency_score?: number | null
          created_at?: string | null
          fog_value?: number
          id?: string
          recovery_score?: number | null
          reflection_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alignment_score?: number | null
          checkins_score?: number | null
          consistency_score?: number | null
          created_at?: string | null
          fog_value?: number
          id?: string
          recovery_score?: number | null
          reflection_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emotions: {
        Row: {
          created_at: string
          emotion: string
          entry_date: string
          id: string
          notes: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotion: string
          entry_date?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotion?: string
          entry_date?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          created_at: string
          feed_event_id: string
          id: string
          is_edited: boolean | null
          parent_comment_id: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_event_id: string
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_event_id?: string
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_feed_event_id_fkey"
            columns: ["feed_event_id"]
            isOneToOne: false
            referencedRelation: "feed_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_events: {
        Row: {
          content_preview: string | null
          created_at: string
          id: string
          media: Json | null
          metadata: Json | null
          source_id: string | null
          source_module: string
          summary: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          id?: string
          media?: Json | null
          metadata?: Json | null
          source_id?: string | null
          source_module: string
          summary?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          id?: string
          media?: Json | null
          metadata?: Json | null
          source_id?: string | null
          source_module?: string
          summary?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_reactions: {
        Row: {
          created_at: string
          emoji: string
          feed_event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          feed_event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          feed_event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_feed_event_id_fkey"
            columns: ["feed_event_id"]
            isOneToOne: false
            referencedRelation: "feed_events"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_saves: {
        Row: {
          created_at: string
          feed_event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_saves_feed_event_id_fkey"
            columns: ["feed_event_id"]
            isOneToOne: false
            referencedRelation: "feed_events"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          frequency: string | null
          habit_days: number | null
          id: string
          name: string
          start_date: string | null
          target_days: number[] | null
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          habit_days?: number | null
          id?: string
          name: string
          start_date?: string | null
          target_days?: number[] | null
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          habit_days?: number | null
          id?: string
          name?: string
          start_date?: string | null
          target_days?: number[] | null
          user_id?: string
        }
        Relationships: []
      }
      hero_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          page_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          page_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          page_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_answers: {
        Row: {
          answer_text: string | null
          created_at: string
          id: string
          journal_entry_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          id?: string
          journal_entry_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          id?: string
          journal_entry_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_answers_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          daily_feeling: string | null
          daily_gratitude: string | null
          daily_kindness: string | null
          entry_date: string
          id: string
          images_data: Json | null
          page_settings: Json | null
          scribble_data: string | null
          tags: string[] | null
          text_formatting: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_feeling?: string | null
          daily_gratitude?: string | null
          daily_kindness?: string | null
          entry_date?: string
          id?: string
          images_data?: Json | null
          page_settings?: Json | null
          scribble_data?: string | null
          tags?: string[] | null
          text_formatting?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_feeling?: string | null
          daily_gratitude?: string | null
          daily_kindness?: string | null
          entry_date?: string
          id?: string
          images_data?: Json | null
          page_settings?: Json | null
          scribble_data?: string | null
          tags?: string[] | null
          text_formatting?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          prompt_text: string
          segment: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prompt_text: string
          segment: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prompt_text?: string
          segment?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_settings: {
        Row: {
          created_at: string
          id: string
          page_size: string
          sections_config: Json
          skin_id: string
          text_formatting: Json
          updated_at: string
          user_id: string
          zoom: number
        }
        Insert: {
          created_at?: string
          id?: string
          page_size?: string
          sections_config?: Json
          skin_id?: string
          text_formatting?: Json
          updated_at?: string
          user_id: string
          zoom?: number
        }
        Update: {
          created_at?: string
          id?: string
          page_size?: string
          sections_config?: Json
          skin_id?: string
          text_formatting?: Json
          updated_at?: string
          user_id?: string
          zoom?: number
        }
        Relationships: []
      }
      life_proofs: {
        Row: {
          created_at: string | null
          id: string
          module: string
          short_text: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module: string
          short_text: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module?: string
          short_text?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      manifest_goals: {
        Row: {
          affirmations: string[] | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          feeling_when_achieved: string | null
          id: string
          is_completed: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affirmations?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          feeling_when_achieved?: string | null
          id?: string
          is_completed?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affirmations?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          feeling_when_achieved?: string | null
          id?: string
          is_completed?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manifest_journal: {
        Row: {
          created_at: string
          entry_date: string
          goal_id: string
          gratitude: string | null
          id: string
          user_id: string
          visualization: string | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          goal_id: string
          gratitude?: string | null
          id?: string
          user_id: string
          visualization?: string | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          goal_id?: string
          gratitude?: string | null
          id?: string
          user_id?: string
          visualization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manifest_journal_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manifest_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          has_checklist: boolean | null
          id: string
          scribble_data: string | null
          skin: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          voice_transcript: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          has_checklist?: boolean | null
          id?: string
          scribble_data?: string | null
          skin?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
          voice_transcript?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          has_checklist?: boolean | null
          id?: string
          scribble_data?: string | null
          skin?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          voice_transcript?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          focus_areas: string[] | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          focus_areas?: string[] | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          focus_areas?: string[] | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          alarm_enabled: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          end_time: string | null
          id: string
          importance: string | null
          is_completed: boolean | null
          priority: string | null
          reminder_at: string | null
          started_at: string | null
          subtasks: Json | null
          tags: string[] | null
          time_of_day: string | null
          title: string
          total_focus_minutes: number | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          alarm_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          end_time?: string | null
          id?: string
          importance?: string | null
          is_completed?: boolean | null
          priority?: string | null
          reminder_at?: string | null
          started_at?: string | null
          subtasks?: Json | null
          tags?: string[] | null
          time_of_day?: string | null
          title: string
          total_focus_minutes?: number | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          alarm_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          end_time?: string | null
          id?: string
          importance?: string | null
          is_completed?: boolean | null
          priority?: string | null
          reminder_at?: string | null
          started_at?: string | null
          subtasks?: Json | null
          tags?: string[] | null
          time_of_day?: string | null
          title?: string
          total_focus_minutes?: number | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_reset_time: string | null
          date_format: string | null
          default_home_screen: string | null
          id: string
          note_skin_preference: string | null
          notification_diary_prompt: boolean | null
          notification_emotion_checkin: boolean | null
          notification_task_reminder: boolean | null
          privacy_blur_sensitive: boolean | null
          privacy_passcode_enabled: boolean | null
          start_of_week: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_reset_time?: string | null
          date_format?: string | null
          default_home_screen?: string | null
          id?: string
          note_skin_preference?: string | null
          notification_diary_prompt?: boolean | null
          notification_emotion_checkin?: boolean | null
          notification_task_reminder?: boolean | null
          privacy_blur_sensitive?: boolean | null
          privacy_passcode_enabled?: boolean | null
          start_of_week?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_reset_time?: string | null
          date_format?: string | null
          default_home_screen?: string | null
          id?: string
          note_skin_preference?: string | null
          notification_diary_prompt?: boolean | null
          notification_emotion_checkin?: boolean | null
          notification_task_reminder?: boolean | null
          privacy_blur_sensitive?: boolean | null
          privacy_passcode_enabled?: boolean | null
          start_of_week?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
