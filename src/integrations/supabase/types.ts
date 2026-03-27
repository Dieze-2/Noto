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
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_athlete_notes: {
        Row: {
          athlete_id: string
          coach_id: string
          content: string
          id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          content?: string
          id?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          content?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_athlete_visits: {
        Row: {
          athlete_id: string
          coach_id: string
          id: string
          last_visited_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          id?: string
          last_visited_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          id?: string
          last_visited_at?: string
        }
        Relationships: []
      }
      coach_athletes: {
        Row: {
          accepted_at: string | null
          athlete_id: string | null
          coach_id: string
          contract_date: string | null
          created_at: string | null
          id: string
          invite_email: string | null
          invite_token: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          athlete_id?: string | null
          coach_id: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          athlete_id?: string | null
          coach_id?: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          status?: string
        }
        Relationships: []
      }
      coach_notifications: {
        Row: {
          athlete_email: string | null
          athlete_id: string | null
          coach_id: string
          created_at: string | null
          id: string
          read: boolean | null
          request_id: string | null
          type: string
        }
        Insert: {
          athlete_email?: string | null
          athlete_id?: string | null
          coach_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          request_id?: string | null
          type: string
        }
        Update: {
          athlete_email?: string | null
          athlete_id?: string | null
          coach_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          request_id?: string | null
          type?: string
        }
        Relationships: []
      }
      coach_requests: {
        Row: {
          created_at: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_subscriptions: {
        Row: {
          cancel_at: string | null
          coach_id: string
          created_at: string | null
          id: string
          pending_cancellation: boolean | null
          plan: Database["public"]["Enums"]["coach_plan"]
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at?: string | null
          coach_id: string
          created_at?: string | null
          id?: string
          pending_cancellation?: boolean | null
          plan?: Database["public"]["Enums"]["coach_plan"]
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at?: string | null
          coach_id?: string
          created_at?: string | null
          id?: string
          pending_cancellation?: boolean | null
          plan?: Database["public"]["Enums"]["coach_plan"]
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          kcal: number | null
          note: string | null
          steps: number | null
          updated_at: string
          user_id: string
          weight_g: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          kcal?: number | null
          note?: string | null
          steps?: number | null
          updated_at?: string
          user_id: string
          weight_g?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kcal?: number | null
          note?: string | null
          steps?: number | null
          updated_at?: string
          user_id?: string
          weight_g?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          color: string | null
          created_at: string
          end_date: string
          id: string
          note: string | null
          start_date: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          end_date: string
          id?: string
          note?: string | null
          start_date: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          end_date?: string
          id?: string
          note?: string | null
          start_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_catalog: {
        Row: {
          body_region: string | null
          created_at: string
          difficulty_level: string | null
          grip: string | null
          id: string
          movement_pattern_1: string | null
          movement_pattern_2: string | null
          movement_pattern_3: string | null
          name: string
          note: string | null
          note_en: string | null
          note_es: string | null
          primary_equipment: string | null
          prime_mover_muscle: string | null
          secondary_equipment: string | null
          secondary_muscle: string | null
          target_muscle_group: string | null
          tertiary_muscle: string | null
          youtube_url: string | null
        }
        Insert: {
          body_region?: string | null
          created_at?: string
          difficulty_level?: string | null
          grip?: string | null
          id?: string
          movement_pattern_1?: string | null
          movement_pattern_2?: string | null
          movement_pattern_3?: string | null
          name: string
          note?: string | null
          note_en?: string | null
          note_es?: string | null
          primary_equipment?: string | null
          prime_mover_muscle?: string | null
          secondary_equipment?: string | null
          secondary_muscle?: string | null
          target_muscle_group?: string | null
          tertiary_muscle?: string | null
          youtube_url?: string | null
        }
        Update: {
          body_region?: string | null
          created_at?: string
          difficulty_level?: string | null
          grip?: string | null
          id?: string
          movement_pattern_1?: string | null
          movement_pattern_2?: string | null
          movement_pattern_3?: string | null
          name?: string
          note?: string | null
          note_en?: string | null
          note_es?: string | null
          primary_equipment?: string | null
          prime_mover_muscle?: string | null
          secondary_equipment?: string | null
          secondary_muscle?: string | null
          target_muscle_group?: string | null
          tertiary_muscle?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      pr_dismissals: {
        Row: {
          athlete_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          athlete_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          athlete_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id: string
          last_name?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
        }
        Relationships: []
      }
      program_exercises: {
        Row: {
          created_at: string | null
          exercise_catalog_id: string | null
          exercise_name: string
          id: string
          note: string | null
          reps: string | null
          rest: string | null
          session_id: string
          sets: string | null
          sort_order: number
          work_type: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_catalog_id?: string | null
          exercise_name: string
          id?: string
          note?: string | null
          reps?: string | null
          rest?: string | null
          session_id: string
          sets?: string | null
          sort_order?: number
          work_type?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_catalog_id?: string | null
          exercise_name?: string
          id?: string
          note?: string | null
          reps?: string | null
          rest?: string | null
          session_id?: string
          sets?: string | null
          sort_order?: number
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_exercise_catalog_id_fkey"
            columns: ["exercise_catalog_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "program_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_sessions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          program_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          program_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          athlete_id: string
          coach_id: string
          content: Json | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          content?: Json | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          target_kcal: number | null
          target_steps: number | null
          target_weight_g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          target_kcal?: number | null
          target_steps?: number | null
          target_weight_g?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          target_kcal?: number | null
          target_steps?: number | null
          target_weight_g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_exercise_sets: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          load_g: number | null
          load_text: string | null
          load_type: string
          reps: number
          sort_order: number
          updated_at: string
          user_id: string
          workout_exercise_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          load_g?: number | null
          load_text?: string | null
          load_type?: string
          reps?: number
          sort_order?: number
          updated_at?: string
          user_id: string
          workout_exercise_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          load_g?: number | null
          load_text?: string | null
          load_type?: string
          reps?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "v_workout_exercises_flat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          comment: string | null
          created_at: string
          exercise_name: string
          id: string
          load_g: number | null
          load_text: string | null
          load_type: string
          reps: number
          sort_order: number
          workout_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          exercise_name: string
          id?: string
          load_g?: number | null
          load_text?: string | null
          load_type: string
          reps?: number
          sort_order?: number
          workout_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          exercise_name?: string
          id?: string
          load_g?: number | null
          load_text?: string | null
          load_type?: string
          reps?: number
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_workout_exercises_flat: {
        Row: {
          created_at: string | null
          exercise_name: string | null
          id: string | null
          load_g: number | null
          load_type: string | null
          reps: number | null
          user_id: string | null
          workout_date: string | null
          workout_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_id_by_email: { Args: { email_input: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coach" | "athlete"
      coach_plan: "classic" | "pro" | "club"
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
      app_role: ["admin", "coach", "athlete"],
      coach_plan: ["classic", "pro", "club"],
    },
  },
} as const
