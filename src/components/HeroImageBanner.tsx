'use client';

import React from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';

export const HeroImageBanner: React.FC = () => {
  const { settings } = useShop();
  const image = settings.heroBannerImage.trim();
  const link = settings.heroBannerLink.trim();

  if (!image) return null;

  // Fixed aspect ratio so the banner stays a wide, short strip no matter what
  // dimensions the uploaded image itself has — object-cover crops the rest.
  const banner = (
    <div className="w-full aspect-3/1 sm:aspect-7/2 rounded-md overflow-hidden bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="w-full h-full object-cover" />
    </div>
  );

  if (!link) return banner;

  const isExternal = link.startsWith('http');

  return isExternal ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block">
      {banner}
    </a>
  ) : (
    <Link href={link} className="block">
      {banner}
    </Link>
  );
};
