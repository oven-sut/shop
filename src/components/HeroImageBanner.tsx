'use client';

import React from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';

export const HeroImageBanner: React.FC = () => {
  const { settings } = useShop();
  const image = settings.heroBannerImage.trim();
  const link = settings.heroBannerLink.trim();

  if (!image) return null;

  const banner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className="w-full h-auto rounded-md" />
  );

  if (!link) return <div className="mt-6">{banner}</div>;

  const isExternal = link.startsWith('http');

  return (
    <div className="mt-6">
      {isExternal ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block">
          {banner}
        </a>
      ) : (
        <Link href={link} className="block">
          {banner}
        </Link>
      )}
    </div>
  );
};
