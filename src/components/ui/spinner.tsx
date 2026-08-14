import { cn } from '@/lib/utils';

/**
 * Inline busy indicator for buttons and small controls.
 *
 * Drawn in `currentColor` so it works on both the dark primary buttons and the
 * light secondary ones without a variant for each. The track is the same stroke
 * at low opacity, which reads as a ring rather than a lone spinning tick.
 */
export function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('animate-spin size-4 shrink-0', className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Centred spinner with a caption, for the middle of a panel that has no
 * meaningful shape to skeleton — a short list, a modal body, a tab that has not
 * been opened before.
 */
export function LoadingBlock({
  label = 'กำลังโหลด...',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2.5 py-16 text-xs text-neutral-400',
        className
      )}
    >
      <Spinner className="text-neutral-900" />
      <span>{label}</span>
    </div>
  );
}
