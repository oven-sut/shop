import { LoadingBlock } from '@/components/ui/spinner';

/**
 * Navigation fallback for every route that does not define its own.
 *
 * This covers the server-side wait — the root layout reads the session before it
 * can render anything — which is a gap the client-side skeletons cannot fill
 * because none of that code is running yet.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LoadingBlock label="กำลังเปิดหน้า..." />
    </div>
  );
}
