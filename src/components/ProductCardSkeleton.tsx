import React from 'react';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';

/**
 * Traces ProductCard: 4:3 image, category line, two-line title, price row.
 *
 * Kept in step with the real card on purpose — the point of a skeleton is that
 * the page does not reflow when the data lands, and that only holds while the
 * two agree on the shape.
 */
function ProductCardSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-md overflow-hidden">
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-2.5 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** A grid of placeholder cards on the same breakpoints as the catalogue. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="กำลังโหลดสินค้า"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </SkeletonRegion>
  );
}
