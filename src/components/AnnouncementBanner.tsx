'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AnnouncementBanner: React.FC = () => {
  const { settings } = useShop();
  const text = settings.announcementText.trim();
  const link = settings.announcementLink.trim();

  if (!settings.announcementEnabled || !text) return null;

  return (
    <div className="mt-6 border border-neutral-200 rounded-md p-4 flex items-start gap-3 bg-white">
      <div className="w-9 h-9 shrink-0 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
        <Megaphone className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-900 text-sm">ประกาศ</span>
          <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            NEW
          </span>
        </div>
        <p className="text-sm text-neutral-700 mt-1 break-words">
          {text}
          {link && (
            <>
              {' '}
              <a
                href={link}
                target={link.startsWith('http') ? '_blank' : undefined}
                rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="underline underline-offset-2 font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                {link}
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
