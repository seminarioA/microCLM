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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          sector: string | null
          size: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          sector?: string | null
          size?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          sector?: string | null
          size?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          contact_reason: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          phone: string | null
          reports_to: string | null
          role_title: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          contact_reason?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          reports_to?: string | null
          role_title?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          contact_reason?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          reports_to?: string | null
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body_html: string
          clicked_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          error: string | null
          from_email: string
          id: string
          lead_id: string | null
          opened_at: string | null
          provider_message_id: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          body_html: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          from_email: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          body_html?: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          from_email?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_modules: {
        Row: {
          enabled: boolean
          module_key: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          module_key: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          module_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_synthetic_insights: {
        Row: {
          created_by: string | null
          generated_at: string
          id: string
          lead_id: string
          metrics: Json
          persona_summary: string
          preferences: Json
          raw_response: Json | null
          recommended_product_id: string | null
          recommended_product_reason: string | null
          score: number
          success_probability: number
        }
        Insert: {
          created_by?: string | null
          generated_at?: string
          id?: string
          lead_id: string
          metrics?: Json
          persona_summary: string
          preferences?: Json
          raw_response?: Json | null
          recommended_product_id?: string | null
          recommended_product_reason?: string | null
          score: number
          success_probability: number
        }
        Update: {
          created_by?: string | null
          generated_at?: string
          id?: string
          lead_id?: string
          metrics?: Json
          persona_summary?: string
          preferences?: Json
          raw_response?: Json | null
          recommended_product_id?: string | null
          recommended_product_reason?: string | null
          score?: number
          success_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_synthetic_insights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_synthetic_insights_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_synthetic_insights_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closed: boolean
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          lost: boolean
          owner_id: string | null
          sector: string | null
          source: string | null
          stage_id: string
          updated_at: string
          value: number | null
        }
        Insert: {
          closed?: boolean
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lost?: boolean
          owner_id?: string | null
          sector?: string | null
          source?: string | null
          stage_id: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          closed?: boolean
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lost?: boolean
          owner_id?: string | null
          sector?: string | null
          source?: string | null
          stage_id?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          lead_id: string | null
          message: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          id: string
          key: string
          label: string
          position: number
          variant: string | null
        }
        Insert: {
          id?: string
          key: string
          label: string
          position: number
          variant?: string | null
        }
        Update: {
          id?: string
          key?: string
          label?: string
          position?: number
          variant?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number | null
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: string
          role_title: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          role?: string
          role_title?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          role_title?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      tenant_settings: {
        Row: {
          color_accent: string
          color_accent_deep: string
          color_amber: string
          color_legado: string
          color_moss: string
          color_moss_light: string
          color_terracotta: string
          id: number
          updated_at: string
        }
        Insert: {
          color_accent?: string
          color_accent_deep?: string
          color_amber?: string
          color_legado?: string
          color_moss?: string
          color_moss_light?: string
          color_terracotta?: string
          id?: number
          updated_at?: string
        }
        Update: {
          color_accent?: string
          color_accent_deep?: string
          color_amber?: string
          color_legado?: string
          color_moss?: string
          color_moss_light?: string
          color_terracotta?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          email_id: string | null
          id: string
          lead_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_id?: string | null
          id?: string
          lead_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email_id?: string | null
          id?: string
          lead_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
