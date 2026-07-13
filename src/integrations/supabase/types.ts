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
      images: {
        Row: {
          created_at: string | null
          file_size: number | null
          filename: string
          id: string
          original_name: string | null
          post_id: string | null
          slot: string
          wp_url: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          filename: string
          id?: string
          original_name?: string | null
          post_id?: string | null
          slot: string
          wp_url?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          original_name?: string | null
          post_id?: string | null
          slot?: string
          wp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_guides: {
        Row: {
          abschluss: string | null
          created_at: string
          generated_at: string | null
          generated_by: string | null
          hauptfragen: Json
          id: string
          intro: string | null
          ki_instruktionen: string | null
          kritische_fragen: Json
          model_used: string | null
          notes: string | null
          post_id: string
          prompt_version: number | null
          raw_json: Json | null
          redaktionelle_hinweise: string | null
          speaker_id: string | null
          speaker_profile_id: string | null
          status: string
          updated_at: string
          vertiefungsfragen: Json
        }
        Insert: {
          abschluss?: string | null
          created_at?: string
          generated_at?: string | null
          generated_by?: string | null
          hauptfragen?: Json
          id?: string
          intro?: string | null
          ki_instruktionen?: string | null
          kritische_fragen?: Json
          model_used?: string | null
          notes?: string | null
          post_id: string
          prompt_version?: number | null
          raw_json?: Json | null
          redaktionelle_hinweise?: string | null
          speaker_id?: string | null
          speaker_profile_id?: string | null
          status?: string
          updated_at?: string
          vertiefungsfragen?: Json
        }
        Update: {
          abschluss?: string | null
          created_at?: string
          generated_at?: string | null
          generated_by?: string | null
          hauptfragen?: Json
          id?: string
          intro?: string | null
          ki_instruktionen?: string | null
          kritische_fragen?: Json
          model_used?: string | null
          notes?: string | null
          post_id?: string
          prompt_version?: number | null
          raw_json?: Json | null
          redaktionelle_hinweise?: string | null
          speaker_id?: string | null
          speaker_profile_id?: string | null
          status?: string
          updated_at?: string
          vertiefungsfragen?: Json
        }
        Relationships: [
          {
            foreignKeyName: "interview_guides_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_speaker_profile_id_fkey"
            columns: ["speaker_profile_id"]
            isOneToOne: false
            referencedRelation: "speaker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_banned_words: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          legal_basis: string | null
          replacement_suggestion: string | null
          severity: string
          term: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          legal_basis?: string | null
          replacement_suggestion?: string | null
          severity?: string
          term: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          legal_basis?: string | null
          replacement_suggestion?: string | null
          severity?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_compliance_rules: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          industry: string
          legal_basis: string | null
          question_text: string
          risk_response_text: string | null
          severity: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          industry?: string
          legal_basis?: string | null
          question_text: string
          risk_response_text?: string | null
          severity?: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          industry?: string
          legal_basis?: string | null
          question_text?: string
          risk_response_text?: string | null
          severity?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      knowledge_email_templates: {
        Row: {
          active: boolean
          body_markdown: string
          created_at: string
          id: string
          key: string
          subject: string
          updated_at: string
          variables: Json
        }
        Insert: {
          active?: boolean
          body_markdown: string
          created_at?: string
          id?: string
          key: string
          subject: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          active?: boolean
          body_markdown?: string
          created_at?: string
          id?: string
          key?: string
          subject?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      knowledge_guides: {
        Row: {
          active: boolean
          body_md: string
          created_at: string
          id: string
          key: string
          quick_tips: Json
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          body_md: string
          created_at?: string
          id?: string
          key: string
          quick_tips?: Json
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          body_md?: string
          created_at?: string
          id?: string
          key?: string
          quick_tips?: Json
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      knowledge_moderation_tips: {
        Row: {
          active: boolean
          created_at: string
          id: string
          industry: string | null
          source: string | null
          tip_text: string
          topic: string
          trigger_text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          industry?: string | null
          source?: string | null
          tip_text: string
          topic: string
          trigger_text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          industry?: string | null
          source?: string | null
          tip_text?: string
          topic?: string
          trigger_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_prompts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key: string
          model: string
          system_prompt: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key: string
          model?: string
          system_prompt: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          model?: string
          system_prompt?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      post_scans: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_text: string | null
          findings: Json
          id: string
          model_used: string | null
          post_id: string
          prompt_key_used: string | null
          prompt_version_used: number | null
          score: number | null
          status: string
          summary: string | null
          tokens_in: number | null
          tokens_out: number | null
          triggered_by: string | null
          updated_at: string
          verdict: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_text?: string | null
          findings?: Json
          id?: string
          model_used?: string | null
          post_id: string
          prompt_key_used?: string | null
          prompt_version_used?: number | null
          score?: number | null
          status?: string
          summary?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          triggered_by?: string | null
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_text?: string | null
          findings?: Json
          id?: string
          model_used?: string | null
          post_id?: string
          prompt_key_used?: string | null
          prompt_version_used?: number | null
          score?: number | null
          status?: string
          summary?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          triggered_by?: string | null
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_scans_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          blocks: Json | null
          created_at: string
          critical_voices: string | null
          guest_image_url: string | null
          guest_name: string
          guest_short_bio: string | null
          guest_website_url: string | null
          hub_last_error: string | null
          hub_post_id: string | null
          hub_pushed_at: string | null
          hub_slug: string | null
          id: string
          interview_title: string
          interview_topic: string | null
          newsletter_text: string | null
          post_slug: string | null
          prettylink_shortcodes: string | null
          previous_interviews: string | null
          product: string | null
          product_market_since: string | null
          selected_affiliate_indices: number[]
          speaker_id: string | null
          status: string
          telegram_text: string | null
          updated_at: string
          video_transcript: string | null
          youtube_url: string | null
        }
        Insert: {
          blocks?: Json | null
          created_at?: string
          critical_voices?: string | null
          guest_image_url?: string | null
          guest_name: string
          guest_short_bio?: string | null
          guest_website_url?: string | null
          hub_last_error?: string | null
          hub_post_id?: string | null
          hub_pushed_at?: string | null
          hub_slug?: string | null
          id?: string
          interview_title: string
          interview_topic?: string | null
          newsletter_text?: string | null
          post_slug?: string | null
          prettylink_shortcodes?: string | null
          previous_interviews?: string | null
          product?: string | null
          product_market_since?: string | null
          selected_affiliate_indices?: number[]
          speaker_id?: string | null
          status?: string
          telegram_text?: string | null
          updated_at?: string
          video_transcript?: string | null
          youtube_url?: string | null
        }
        Update: {
          blocks?: Json | null
          created_at?: string
          critical_voices?: string | null
          guest_image_url?: string | null
          guest_name?: string
          guest_short_bio?: string | null
          guest_website_url?: string | null
          hub_last_error?: string | null
          hub_post_id?: string | null
          hub_pushed_at?: string | null
          hub_slug?: string | null
          id?: string
          interview_title?: string
          interview_topic?: string | null
          newsletter_text?: string | null
          post_slug?: string | null
          prettylink_shortcodes?: string | null
          previous_interviews?: string | null
          product?: string | null
          product_market_since?: string | null
          selected_affiliate_indices?: number[]
          speaker_id?: string | null
          status?: string
          telegram_text?: string | null
          updated_at?: string
          video_transcript?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_interview_calls: {
        Row: {
          clarifications: Json
          created_at: string
          flow_notes: string | null
          id: string
          internal_notes: string | null
          meeting_link: string | null
          post_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clarifications?: Json
          created_at?: string
          flow_notes?: string | null
          id?: string
          internal_notes?: string | null
          meeting_link?: string | null
          post_id: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clarifications?: Json
          created_at?: string
          flow_notes?: string | null
          id?: string
          internal_notes?: string | null
          meeting_link?: string | null
          post_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_interview_calls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_sessions: {
        Row: {
          accumulated_seconds: number
          asked_question_ids: Json
          created_at: string
          id: string
          interviewer_notiz: string | null
          post_id: string
          question_order: Json
          recording_markers: Json
          resumed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accumulated_seconds?: number
          asked_question_ids?: Json
          created_at?: string
          id?: string
          interviewer_notiz?: string | null
          post_id: string
          question_order?: Json
          recording_markers?: Json
          resumed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accumulated_seconds?: number
          asked_question_ids?: Json
          created_at?: string
          id?: string
          interviewer_notiz?: string | null
          post_id?: string
          question_order?: Json
          recording_markers?: Json
          resumed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_sessions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_profiles: {
        Row: {
          created_at: string
          expertise_score: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          kernaussagen: string[]
          kritische_punkte: string[]
          kurzbio: string | null
          langbio: string | null
          mediale_hooks: string[]
          model: string | null
          notes: string | null
          positionierung: string | null
          post_id: string
          prompt_version: number | null
          raw_json: Json | null
          speaker_id: string
          status: string
          themen: string[]
          updated_at: string
          zielgruppe: string | null
        }
        Insert: {
          created_at?: string
          expertise_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          kernaussagen?: string[]
          kritische_punkte?: string[]
          kurzbio?: string | null
          langbio?: string | null
          mediale_hooks?: string[]
          model?: string | null
          notes?: string | null
          positionierung?: string | null
          post_id: string
          prompt_version?: number | null
          raw_json?: Json | null
          speaker_id: string
          status?: string
          themen?: string[]
          updated_at?: string
          zielgruppe?: string | null
        }
        Update: {
          created_at?: string
          expertise_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          kernaussagen?: string[]
          kritische_punkte?: string[]
          kurzbio?: string | null
          langbio?: string | null
          mediale_hooks?: string[]
          model?: string | null
          notes?: string | null
          positionierung?: string | null
          post_id?: string
          prompt_version?: number | null
          raw_json?: Json | null
          speaker_id?: string
          status?: string
          themen?: string[]
          updated_at?: string
          zielgruppe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_profiles_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_profiles_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_scans: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_text: string | null
          findings: Json
          id: string
          model_used: string | null
          prompt_key_used: string | null
          prompt_version_used: number | null
          score: number | null
          speaker_id: string
          status: string
          summary: string | null
          tokens_in: number | null
          tokens_out: number | null
          triggered_by: string | null
          updated_at: string
          verdict: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_text?: string | null
          findings?: Json
          id?: string
          model_used?: string | null
          prompt_key_used?: string | null
          prompt_version_used?: number | null
          score?: number | null
          speaker_id: string
          status?: string
          summary?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          triggered_by?: string | null
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_text?: string | null
          findings?: Json
          id?: string
          model_used?: string | null
          prompt_key_used?: string | null
          prompt_version_used?: number | null
          score?: number | null
          speaker_id?: string
          status?: string
          summary?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          triggered_by?: string | null
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_scans_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          affiliate_available: boolean | null
          affiliate_registration_url: string | null
          agb_accepted_at: string | null
          avatar_url: string | null
          bio_third_person: string | null
          created_at: string
          email: string
          email_list_size: number | null
          first_name: string
          has_newsletter: boolean | null
          hot_topics: Json | null
          id: string
          industry: string | null
          last_name: string
          phone: string | null
          privacy_accepted_at: string | null
          salutation: string | null
          short_vita: string | null
          slogan: string | null
          social_links: Json | null
          title_role: string | null
          top_affiliate_products: Json | null
          topic_suggestions: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          affiliate_available?: boolean | null
          affiliate_registration_url?: string | null
          agb_accepted_at?: string | null
          avatar_url?: string | null
          bio_third_person?: string | null
          created_at?: string
          email: string
          email_list_size?: number | null
          first_name: string
          has_newsletter?: boolean | null
          hot_topics?: Json | null
          id?: string
          industry?: string | null
          last_name: string
          phone?: string | null
          privacy_accepted_at?: string | null
          salutation?: string | null
          short_vita?: string | null
          slogan?: string | null
          social_links?: Json | null
          title_role?: string | null
          top_affiliate_products?: Json | null
          topic_suggestions?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          affiliate_available?: boolean | null
          affiliate_registration_url?: string | null
          agb_accepted_at?: string | null
          avatar_url?: string | null
          bio_third_person?: string | null
          created_at?: string
          email?: string
          email_list_size?: number | null
          first_name?: string
          has_newsletter?: boolean | null
          hot_topics?: Json | null
          id?: string
          industry?: string | null
          last_name?: string
          phone?: string | null
          privacy_accepted_at?: string | null
          salutation?: string | null
          short_vita?: string | null
          slogan?: string | null
          social_links?: Json | null
          title_role?: string | null
          top_affiliate_products?: Json | null
          topic_suggestions?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "speaker"
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
      app_role: ["admin", "speaker"],
    },
  },
} as const
