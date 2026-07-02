export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string;
          id: string;
          location: string | null;
          name: string;
          sector: string | null;
          size: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          location?: string | null;
          name: string;
          sector?: string | null;
          size?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          location?: string | null;
          name?: string;
          sector?: string | null;
          size?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          company_id: string | null;
          contact_reason: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          linkedin_url: string | null;
          phone: string | null;
          reports_to: string | null;
          role_title: string | null;
        };
        Insert: {
          company_id?: string | null;
          contact_reason?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          linkedin_url?: string | null;
          phone?: string | null;
          reports_to?: string | null;
          role_title?: string | null;
        };
        Update: {
          company_id?: string | null;
          contact_reason?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          linkedin_url?: string | null;
          phone?: string | null;
          reports_to?: string | null;
          role_title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_reports_to_fkey";
            columns: ["reports_to"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          closed: boolean;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          id: string;
          lost: boolean;
          owner_id: string | null;
          sector: string | null;
          source: string | null;
          stage_id: string;
          updated_at: string;
          value: number | null;
        };
        Insert: {
          closed?: boolean;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          lost?: boolean;
          owner_id?: string | null;
          sector?: string | null;
          source?: string | null;
          stage_id: string;
          updated_at?: string;
          value?: number | null;
        };
        Update: {
          closed?: boolean;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          lost?: boolean;
          owner_id?: string | null;
          sector?: string | null;
          source?: string | null;
          stage_id?: string;
          updated_at?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          lead_id: string | null;
          message: string | null;
          read: boolean;
          title: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          lead_id?: string | null;
          message?: string | null;
          read?: boolean;
          title: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          lead_id?: string | null;
          message?: string | null;
          read?: boolean;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          id: string;
          key: string;
          label: string;
          position: number;
          variant: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          position: number;
          variant?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          position?: number;
          variant?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          role: string;
          role_title: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          role?: string;
          role_title?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: string;
          role_title?: string;
        };
        Relationships: [];
      };
      sectors: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          label: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          label: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          label?: string;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          lead_id: string;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          lead_id: string;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          lead_id?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
