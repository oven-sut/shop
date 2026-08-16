'use client';

import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

/**
 * บันทึกระบบ — อ่านอย่างเดียว
 *
 * There is no edit and no delete here, and that is the point: a log with a
 * delete button is a draft. Entries are written server-side with the service
 * key and read back under an admin-only RLS policy.
 */

interface AuditRow {
  id: string;
  action: string;
  summary: string;
  actorEmail: string | null;
  actorRole: string | null;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

/** กรองเป็นกลุ่ม ไม่ใช่ทีละ action — ตรงกับที่คนมองหาจริง */
const FILTERS: { label: string; value: string }[] = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'เงินเข้า', value: 'topup.' },
  { label: 'คำสั่งซื้อ', value: 'order.' },
  { label: 'ผู้ใช้', value: 'user.' },
  { label: 'สินค้า', value: 'product.' },
  { label: 'ตั้งค่า', value: 'settings.' },
  { label: 'สำรองข้อมูล', value: 'backup.' },
];

const when = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });

export const AdminAuditLog: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const query = (before?: string | null) => {
    const params = new URLSearchParams({ limit: '50' });
    if (action) params.set('action', action);
    if (search.trim()) params.set('q', search.trim());
    if (before) params.set('before', before);
    return `/api/audit?${params}`;
  };

  const load = async () => {
    setIsLoading(true);
    const body = await (await fetch(query())).json().catch(() => ({}));
    setRows(body.success ? (body.data as AuditRow[]) : []);
    setNextBefore(body.nextBefore ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // ค้นหาใช้ปุ่ม/Enter ไม่ยิงทุกตัวอักษร — จึงไม่อยู่ใน deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const loadMore = async () => {
    if (!nextBefore) return;
    setIsPaging(true);
    const body = await (await fetch(query(nextBefore))).json().catch(() => ({}));
    if (body.success) {
      setRows((prev) => [...prev, ...(body.data as AuditRow[])]);
      setNextBefore(body.nextBefore ?? null);
    }
    setIsPaging(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-neutral-900" />
        <h2 className="text-lg font-bold text-neutral-900">บันทึกระบบ</h2>
        <span className="text-[11px] text-neutral-400">
          ใครทำอะไรกับอะไร — อ่านได้อย่างเดียว แก้หรือลบไม่ได้
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setAction(filter.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
              action === filter.value
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            {filter.label}
          </button>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2 ml-auto"
        >
          <Input
            type="search"
            placeholder="ค้นหาในข้อความ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-48 bg-white border-neutral-200 text-xs"
          />
          <Button type="submit" variant="outline" className="h-9 px-3 text-xs border-neutral-300">
            ค้นหา
          </Button>
        </form>
      </div>

      {isLoading ? (
        <SkeletonRegion label="กำลังโหลดบันทึกระบบ" className="space-y-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-md" />
          ))}
        </SkeletonRegion>
      ) : rows.length === 0 ? (
        <p className="text-xs text-neutral-400 py-12 text-center border border-neutral-200 rounded-md">
          ไม่มีบันทึกที่ตรงกับเงื่อนไข
        </p>
      ) : (
        <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 bg-white">
          {rows.map((row) => (
            <div key={row.id} className="p-3 text-xs">
              <button
                type="button"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-neutral-900 block">{row.summary}</span>
                  <span className="text-[11px] text-neutral-400">
                    <span className="font-mono">{row.action}</span>
                    {' · '}
                    {row.actorEmail ?? 'ระบบ'}
                    {row.actorRole ? ` (${row.actorRole})` : ''}
                    {row.targetType ? ` · ${row.targetType}` : ''}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 shrink-0">{when(row.createdAt)}</span>
              </button>

              {expanded === row.id && (
                <div className="mt-2 pt-2 border-t border-neutral-100 space-y-1">
                  {row.targetId && (
                    <p className="text-[11px] text-neutral-500 font-mono break-all">
                      target: {row.targetId}
                    </p>
                  )}
                  {row.ip && <p className="text-[11px] text-neutral-500">IP: {row.ip}</p>}
                  <pre className="text-[11px] text-neutral-600 bg-neutral-50 rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(row.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nextBefore && (
        <Button
          type="button"
          variant="outline"
          onClick={loadMore}
          disabled={isPaging}
          className="w-full h-10 text-xs border-neutral-300"
        >
          {isPaging && <Spinner className="mr-2" />}
          {isPaging ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
        </Button>
      )}
    </div>
  );
};
