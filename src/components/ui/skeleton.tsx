import { cn } from '@/lib/utils';

/**
 * A placeholder block that holds the shape of content that has not arrived.
 *
 * Deliberately a flat grey pulse rather than a sweeping shimmer: the rest of the
 * interface carries emphasis with hairlines and weight, and a gradient sliding
 * across the page would be the loudest thing on it.
 *
 * Use it to trace the real layout — same widths, same row heights — so nothing
 * jumps when the data lands.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      // aria-hidden: a screen reader should hear the region's own busy state,
      // not a pile of empty boxes.
      aria-hidden
      className={cn('animate-pulse rounded-md bg-neutral-100', className)}
      {...props}
    />
  );
}

/**
 * Wraps a skeleton block so assistive tech is told the region is loading.
 * `aria-busy` on a live region is what actually gets announced.
 */
export function SkeletonRegion({
  label = 'กำลังโหลดข้อมูล',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
