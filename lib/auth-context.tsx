'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, Database } from './supabase';
import { useRouter } from 'next/navigation';

type User = Database['public']['Tables']['users']['Row'] & {
  role: Database['public']['Tables']['roles']['Row'];
  additional_fields?: Record<string, string>;
};

type Permission = {
  resource_name: string;
  action_name: string;
  scope: 'all' | 'own' | 'department' | 'class' | 'children';
};

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  permissions: Permission[];
  loading: boolean;
  signIn: (uniqueId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  can: (resource: string, action: string) => boolean;
  getScope: (resource: string, action: string) => string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserData = async (authUser: SupabaseUser) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('id', authUser.id)
      .maybeSingle();

    if (userError || !userData) {
      console.error('Error loading user data:', userError);
      return;
    }

    const { data: additionalFields } = await supabase
      .from('user_additional_fields')
      .select('field_name, field_value')
      .eq('user_id', authUser.id);

    const fieldsMap: Record<string, string> = {};
    if (additionalFields) {
      additionalFields.forEach((field) => {
        if (field.field_value) {
          fieldsMap[field.field_name] = field.field_value;
        }
      });
    }

    const { data: perms } = await supabase
      .from('role_resource_permissions')
      .select(`
        resource:resource_permissions(resource_name),
        action:resource_permission_actions(action_name),
        scope
      `)
      .eq('role_id', userData.role_id);

    const permissionsList: Permission[] = [];
    if (perms) {
      perms.forEach((perm: any) => {
        if (perm.resource && perm.action) {
          permissionsList.push({
            resource_name: perm.resource.resource_name,
            action_name: perm.action.action_name,
            scope: perm.scope,
          });
        }
      });
    }

    setUser({
      ...userData,
      role: userData.role as any,
      additional_fields: fieldsMap,
    });
    setPermissions(permissionsList);
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserData(authUser);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setSupabaseUser(session.user);
          await loadUserData(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session?.user) {
            setSupabaseUser(session.user);
            await loadUserData(session.user);
          } else {
            setSupabaseUser(null);
            setUser(null);
            setPermissions([]);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (uniqueId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: userData, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .eq('unique_id', uniqueId)
        .maybeSingle();

      if (lookupError || !userData) {
        return { success: false, error: 'Invalid unique ID or password' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (signInError) {
        return { success: false, error: 'Invalid unique ID or password' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setPermissions([]);
    router.push('/login');
  };

  const can = (resource: string, action: string): boolean => {
    if (user?.role.role_code === 'AD') return true;
    return permissions.some(
      (p) => p.resource_name === resource && p.action_name === action
    );
  };

  const getScope = (resource: string, action: string): string | null => {
    if (user?.role.role_code === 'AD') return 'all';
    const permission = permissions.find(
      (p) => p.resource_name === resource && p.action_name === action
    );
    return permission?.scope || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        permissions,
        loading,
        signIn,
        signOut,
        can,
        getScope,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
