import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          role_name: string;
          role_code: string;
          description: string | null;
          is_system_role: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          unique_id: string;
          email: string;
          full_name: string;
          role_id: string;
          phone: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      resource_permissions: {
        Row: {
          id: string;
          resource_name: string;
          resource_label: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resource_permissions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['resource_permissions']['Insert']>;
      };
      resource_permission_actions: {
        Row: {
          id: string;
          action_name: string;
          action_label: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resource_permission_actions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['resource_permission_actions']['Insert']>;
      };
      role_resource_permissions: {
        Row: {
          id: string;
          role_id: string;
          resource_id: string;
          action_id: string;
          scope: 'all' | 'own' | 'department' | 'class' | 'children';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['role_resource_permissions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['role_resource_permissions']['Insert']>;
      };
      role_field_definitions: {
        Row: {
          id: string;
          role_id: string;
          field_name: string;
          field_label: string;
          field_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'phone' | 'textarea';
          field_options: any[];
          is_required: boolean;
          display_order: number;
          validation_rules: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['role_field_definitions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['role_field_definitions']['Insert']>;
      };
      user_additional_fields: {
        Row: {
          id: string;
          user_id: string;
          field_name: string;
          field_value: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_additional_fields']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_additional_fields']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          class_name: string;
          class_code: string;
          description: string | null;
          academic_year: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          subject_name: string;
          subject_code: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      marks: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          class_id: string;
          exam_type: string;
          marks_obtained: number;
          total_marks: number;
          percentage: number;
          exam_date: string | null;
          entered_by: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['marks']['Row'], 'id' | 'percentage' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['marks']['Insert']>;
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string | null;
          subject_id: string | null;
          attendance_date: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          marked_by: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>;
      };
      parent_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['parent_links']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['parent_links']['Insert']>;
      };
      student_classes: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          academic_year: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['student_classes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['student_classes']['Insert']>;
      };
    };
  };
};
