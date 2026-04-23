import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import { User, Student, Admin, getUserById, updateStudent, seedDemoDataForUser } from '@/services/backend';

const supabase = getSupabaseClient();

// Hard-coded admin credentials (admin signs in via Supabase Auth with a known account)
const ADMIN_EMAIL = 'admin@campus.edu';
const ADMIN_PASSWORD = 'Admin@123456';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; usn: string; password: string }) => Promise<Student>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user && event === 'TOKEN_REFRESHED') {
        const profile = await getUserById(session.user.id);
        if (profile) setUser(profile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function bootstrap() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getUserById(session.user.id);
        if (profile) setUser(profile);
      }
    } catch (e) {
      console.log('Bootstrap error:', e);
    } finally {
      setIsInitialized(true);
    }
  }

  async function ensureAdminAccount() {
    // Try signing in with admin credentials; if it fails, create the account
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (signInData.session) return signInData;

    // Create admin auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: { data: { username: 'Campus Admin' } },
    });
    if (signUpError) throw signUpError;

    // Set role to admin in profile
    if (signUpData.user) {
      await supabase
        .from('user_profiles')
        .update({ role: 'admin', username: 'Campus Admin' })
        .eq('id', signUpData.user.id);
    }

    // Sign in again after creation
    return supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  }

  async function login(email: string, password: string): Promise<User> {
    setIsLoading(true);
    try {
      // Detect admin login attempt
      const isAdminLogin = email.trim().toLowerCase() === ADMIN_EMAIL;

      if (isAdminLogin) {
        // Use hard-coded admin password regardless of what was typed (for demo)
        const result = await ensureAdminAccount();
        if (!result.data?.session) throw new Error('Admin login failed. Please try again.');
        const profile = await getUserById(result.data.session.user.id);
        if (!profile) throw new Error('Admin profile not found');
        setUser(profile);
        return profile;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Invalid email or password');

      const profile = await getUserById(data.user.id);
      if (!profile) throw new Error('User profile not found');
      setUser(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(data: { name: string; email: string; usn: string; password: string }): Promise<Student> {
    setIsLoading(true);
    try {
      // Check USN uniqueness
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('usn', data.usn.toUpperCase())
        .limit(1);
      if (existing && existing.length > 0) throw new Error('USN already registered');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: { data: { username: data.name.trim() } },
      });
      if (signUpError) {
        if (signUpError.message.includes('already registered')) throw new Error('Email already registered');
        throw new Error(signUpError.message);
      }
      if (!signUpData.user) throw new Error('Registration failed');

      // Update profile with student fields
      await supabase.from('user_profiles').update({
        username: data.name.trim(),
        usn: data.usn.toUpperCase(),
        role: 'student',
        trust_score: 100,
        reward_points: 0,
        is_flagged: false,
      }).eq('id', signUpData.user.id);

      // Sign in immediately
      const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });
      if (signInErr) throw new Error(signInErr.message);

      const profile = await getUserById(signUpData.user.id);
      if (!profile) throw new Error('Profile not found after registration');

      // Seed demo marketplace items and notes on first user registration
      try { await seedDemoDataForUser(signUpData.user.id, data.name.trim()); } catch (_) {}

      setUser(profile);
      return profile as Student;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function refreshUser() {
    if (!user) return;
    const updated = await getUserById(user.id);
    if (updated) setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
