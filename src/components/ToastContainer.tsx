'use client';

import React from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium transition-all duration-300 transform animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-900/20'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-900/20'
              : 'bg-indigo-950/90 text-indigo-100 border-indigo-500/40 shadow-indigo-900/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
          <span className="flex-1 leading-snug">{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
