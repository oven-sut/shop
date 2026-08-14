'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '../types/auth';
import { siteOrigin, toAppUser } from '../lib/auth';
import { createClient } from '../lib/supabase/client';

export interface AuthResult {
  success: boolean;
  message: string;
  /** Signup only: the account exists but the confirmation email must be opened first. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (next?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Supabase returns English error strings; show something readable instead. */
function translateAuthError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes('provider is not enabled')) {
    return 'ยังไม่ได้เปิดใช้งาน Google ในโปรเจกต์ Supabase (Authentication → Providers → Google)';
  }
  if (text.includes('invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (text.includes('email not confirmed')) {
    return 'ยังไม่ได้ยืนยันอีเมล กรุณาเปิดลิงก์ยืนยันในกล่องจดหมายก่อน';
  }
  if (text.includes('user already registered') || text.includes('already been registered')) {
    return 'อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว';
  }
  if (text.includes('password should be at least')) {
    return 'รหัสผ่านสั้นเกินไป กรุณาตั้งอย่างน้อย 6 ตัวอักษร';
  }
  return message;
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  /** Verified server-side from the cookie session, so the first paint is correct. */
  initialUser?: User | null;
}> = ({ children, initialUser = null }) => {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const lastUserId = useRef<string | null>(initialUser?.id ?? null);

  // The cookie session is the single source of truth — nothing is kept in localStorage.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = toAppUser(session?.user);
      setUser(nextUser);

      // Server Components rendered with the previous session need to re-render.
      const nextId = nextUser?.id ?? null;
      if (nextId !== lastUserId.current) {
        lastUserId.current = nextId;
        router.refresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }

    setUser(toAppUser(data.user));
    return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
  };

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }

    // With email confirmation enabled, signUp returns a user but no session.
    if (!data.session) {
      return {
        success: true,
        needsEmailConfirmation: true,
        message: `ส่งลิงก์ยืนยันไปที่ ${email} แล้ว กรุณาเปิดอีเมลเพื่อยืนยันการสมัคร`,
      };
    }

    setUser(toAppUser(data.user));
    return { success: true, message: 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ' };
  };

  const loginWithGoogle = async (next = '/'): Promise<AuthResult> => {
    const redirectTo = new URL('/auth/callback', siteOrigin());
    redirectTo.searchParams.set('next', next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo.toString(),
        queryParams: {
          // Ask Google for a refresh token so the session can be renewed.
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, message: translateAuthError(error.message) };
    }

    return { success: true, message: 'กำลังนำท่านไปยังหน้าเข้าสู่ระบบของ Google...' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    lastUserId.current = null;
    router.refresh();
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
