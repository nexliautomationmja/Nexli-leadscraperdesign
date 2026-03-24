import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          profile_photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          profile_photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          profile_photo_url?: string | null;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          company: string;
          role: string;
          linkedin: string | null;
          location: string | null;
          score: number;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          company: string;
          role: string;
          linkedin?: string | null;
          location?: string | null;
          score: number;
          tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          company?: string;
          role?: string;
          linkedin?: string | null;
          location?: string | null;
          score?: number;
          tags?: string[] | null;
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          total_leads: number;
          emails_sent: number;
          opens: number;
          replies: number;
          follow_up_sequence: any | null;
          ab_test: any | null;
          scheduled_send: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          total_leads?: number;
          emails_sent?: number;
          opens?: number;
          replies?: number;
          follow_up_sequence?: any | null;
          ab_test?: any | null;
          scheduled_send?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
          total_leads?: number;
          emails_sent?: number;
          opens?: number;
          replies?: number;
          follow_up_sequence?: any | null;
          ab_test?: any | null;
          scheduled_send?: any | null;
          created_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          subject: string;
          body: string;
          variables: string[];
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          subject: string;
          body: string;
          variables?: string[];
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          subject?: string;
          body?: string;
          variables?: string[];
          usage_count?: number;
          created_at?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          lead_id: string;
          subject: string;
          body: string;
          status: 'sent' | 'opened' | 'replied' | 'bounced';
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id?: string | null;
          lead_id: string;
          subject: string;
          body: string;
          status?: 'sent' | 'opened' | 'replied' | 'bounced';
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string | null;
          lead_id?: string;
          subject?: string;
          body?: string;
          status?: 'sent' | 'opened' | 'replied' | 'bounced';
          sent_at?: string;
        };
      };
    };
  };
}
