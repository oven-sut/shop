'use client';

import React from 'react';
import { useShop } from '../context/ShopContext';
import { Check, AlertCircle, Info } from 'lucide-react';

/**
 * Toast severity is carried by fill rather than hue: confirmations are solid
 * black, warnings invert to a heavy outline so they still pull the eye first.
 */
export const ToastContainer: React.FC = () => {
  const { toasts } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-200 animate-in slide-in-from-bottom-3 ${
            toast.type === 'warning'
              ? 'bg-white text-neutral-900 border-2 border-neutral-900'
              : 'bg-neutral-900 text-white border border-neutral-900'
          }`}
        >
          {toast.type === 'success' && <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
          <span className="flex-1 leading-snug">{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
