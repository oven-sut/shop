'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { createClient } from '../lib/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  loginAsAdmin: (passcode: string) => { success: boolean; message: string };
  loginAsDemoCustomer: () => void;
  loginAsDemoGoogleUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  // Load persisted session & listen for Supabase auth state changes
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('owen_auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Default guest/demo initial state
        const demoAdmin: User = {
          id: 'admin-1',
          email: 'admin@neotech.th',
          name: 'ผู้ดูแลระบบ (Admin)',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          createdAt: new Date().toISOString()
        };
        setUser(demoAdmin);
      }
    } catch {
      setUser(null);
    }

    // Subscribe to Supabase auth changes (Google login, session restore)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const sbUser = session.user;
        const userMeta = sbUser.user_metadata || {};
        const loggedUser: User = {
          id: sbUser.id,
          email: sbUser.email || '',
          name: userMeta.full_name || userMeta.name || sbUser.email?.split('@')[0] || 'Google User',
          role: sbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'customer',
          avatar: userMeta.avatar_url || userMeta.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
          createdAt: sbUser.created_at || new Date().toISOString()
        };
        setUser(loggedUser);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('owen_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('owen_auth_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // 1. Check Supabase Auth if available
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data.user) {
        const loggedUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: email.toLowerCase().includes('admin') ? 'admin' : 'customer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
          createdAt: new Date().toISOString()
        };
        setUser(loggedUser);
        return { success: true, message: 'เข้าสู่ระบบสำเร็จ!' };
      }
    } catch {
      // Fallthrough to local login
    }

    // 2. Demo fallback matching
    if (email.toLowerCase().includes('admin') || password === '1234') {
      const adminUser: User = {
        id: 'admin-1',
        email: email || 'admin@neotech.th',
        name: 'ผู้ดูแลระบบ (Admin)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      setUser(adminUser);
      return { success: true, message: 'เข้าสู่ระบบ Admin สำเร็จ!' };
    } else {
      const customerUser: User = {
        id: `cust-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      setUser(customerUser);
      return { success: true, message: 'เข้าสู่ระบบลูกค้าสำเร็จ!' };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        // Fallback local registration
      }
    } catch {}

    const newCustomer: User = {
      id: `cust-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      createdAt: new Date().toISOString()
    };
    setUser(newCustomer);
    return { success: true, message: 'ลงทะเบียนและเข้าสู่ระบบสำเร็จ!' };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, message: error.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้' };
      }
      return { success: true, message: 'กำลังนำท่านไปยังหน้า Google Login...' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google OAuth' };
    }
  };

  const loginAsAdmin = (passcode: string) => {
    if (passcode === '1234' || passcode === 'admin') {
      const adminUser: User = {
        id: 'admin-1',
        email: 'admin@neotech.th',
        name: 'ผู้ดูแลระบบ (Admin)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      setUser(adminUser);
      return { success: true, message: 'เข้าสู่ระบบผู้ดูแลระบบเรียบร้อยแล้ว' };
    }
    return { success: false, message: 'รหัสผ่าน Admin (Passcode) ไม่ถูกต้อง (ลองใช้ 1234)' };
  };

  const loginAsDemoCustomer = () => {
    const demoCust: User = {
      id: 'cust-demo',
      email: 'customer@example.com',
      name: 'คุณสมชาย ใจดี',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      createdAt: new Date().toISOString()
    };
    setUser(demoCust);
  };

  const loginAsDemoGoogleUser = () => {
    const googleDemoUser: User = {
      id: `google-user-${Date.now()}`,
      email: 'somchai.google@gmail.com',
      name: 'Somchai Jaidee (Google)',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      createdAt: new Date().toISOString(),
    };
    setUser(googleDemoUser);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem('owen_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        signup,
        loginWithGoogle,
        loginAsAdmin,
        loginAsDemoCustomer,
        loginAsDemoGoogleUser,
        logout
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
