'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { AdminUser, UserRole } from '../../types/auth';
import {
  Ban,
  CircleCheck,
  Coins,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 25;
const COLUMNS = 7;

const money = (value: number) => `฿${value.toLocaleString('th-TH')}`;

/** Buddhist-era short dates, the way every other date in the back office reads. */
const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—';

const ROLE_FILTERS: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'customer', label: 'ลูกค้า' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
];

/**
 * Controls shared by the table (lg and up) and the card list (below it).
 *
 * Written once each because the two layouts are the same actions in a different
 * shape — duplicating them is how a "ระงับ" button ends up working on a laptop
 * and doing nothing on a phone.
 */
interface RowProps {
  account: AdminUser;
  isSelf: boolean;
  isBusy: boolean;
  onRole: (role: UserRole) => void;
  onToggleBan: () => void;
  onAdjust: () => void;
  onDelete: () => void;
}

const RoleSelect: React.FC<Pick<RowProps, 'account' | 'isSelf' | 'isBusy' | 'onRole'>> = ({
  account,
  isSelf,
  isBusy,
  onRole,
}) => (
  <select
    value={account.role}
    disabled={isSelf || isBusy}
    onChange={(e) => onRole(e.target.value as UserRole)}
    title={isSelf ? 'เปลี่ยนสิทธิ์ของตัวเองไม่ได้' : undefined}
    aria-label={`สิทธิ์ของ ${account.email}`}
    className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-neutral-50 text-neutral-700 border-neutral-200 focus:outline-none disabled:opacity-50"
  >
    <option value="customer">ลูกค้า</option>
    <option value="admin">ผู้ดูแลระบบ</option>
  </select>
);

const StatusBadge: React.FC<{ account: AdminUser }> = ({ account }) =>
  account.isBanned ? (
    <Badge className="bg-neutral-900 text-white border-0 text-[10px] font-bold">
      ระงับการใช้งาน
    </Badge>
  ) : (
    <Badge variant="outline" className="border-neutral-200 text-neutral-600 text-[10px] font-bold">
      ปกติ
    </Badge>
  );

const RowActions: React.FC<Omit<RowProps, 'onRole' | 'onAdjust'>> = ({
  account,
  isSelf,
  isBusy,
  onToggleBan,
  onDelete,
}) => (
  <>
    <Button
      variant="outline"
      size="xs"
      disabled={isSelf || isBusy}
      onClick={onToggleBan}
      title={
        isSelf
          ? 'ระงับบัญชีของตัวเองไม่ได้'
          : account.isBanned
            ? 'ให้กลับมาเข้าสู่ระบบได้'
            : 'ห้ามบัญชีนี้เข้าสู่ระบบ'
      }
      className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 text-[10px] font-bold"
    >
      {account.isBanned ? (
        <CircleCheck className="w-3.5 h-3.5 mr-1" />
      ) : (
        <Ban className="w-3.5 h-3.5 mr-1" />
      )}
      {account.isBanned ? 'ปลดระงับ' : 'ระงับ'}
    </Button>

    <Button
      variant="outline"
      size="icon-xs"
      disabled={isSelf || isBusy}
      onClick={onDelete}
      title={isSelf ? 'ลบบัญชีของตัวเองไม่ได้' : 'ลบบัญชีถาวร'}
      aria-label={`ลบบัญชี ${account.email}`}
      className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </>
);

/** One account as a block — the layout below `lg`, where seven columns cannot fit. */
const UserCard: React.FC<RowProps> = (props) => {
  const { account, isSelf, isBusy, onAdjust } = props;

  return (
    <li className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-bold text-neutral-900 block truncate">
            {account.name}
            {isSelf && (
              <Badge className="ml-2 bg-neutral-900 text-white border-0 text-[10px] font-bold">
                บัญชีของคุณ
              </Badge>
            )}
          </span>
          <span className="text-[11px] text-neutral-500 block break-all">{account.email}</span>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <StatusBadge account={account} />
          <RoleSelect {...props} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] border-y border-neutral-100 py-3">
        <div>
          <dt className="text-neutral-400">กระเป๋าเงิน</dt>
          <dd className="font-bold text-neutral-900">{money(account.balance)}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">คำสั่งซื้อ</dt>
          <dd className="font-semibold text-neutral-800">
            {account.ordersCount.toLocaleString()} รายการ · {money(account.totalSpent)}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400">สมัคร</dt>
          <dd className="text-neutral-700">{formatDate(account.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">เข้าใช้ล่าสุด</dt>
          <dd className="text-neutral-700">
            {formatDate(account.lastSignInAt)}
            {!account.emailConfirmedAt && (
              <span className="block text-neutral-400">ยังไม่ยืนยันอีเมล</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-end gap-1.5">
        {isBusy && <Spinner className="size-3.5 text-neutral-900 mr-auto" />}
        <Button
          variant="outline"
          size="xs"
          disabled={isBusy}
          onClick={onAdjust}
          className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 text-[10px] font-bold"
        >
          <Coins className="w-3 h-3 mr-1" />
          ปรับยอด
        </Button>
        <RowActions {...props} />
      </div>
    </li>
  );
};

/**
 * จัดการผู้ใช้งาน — ค้นหา ปรับสิทธิ์ ระงับบัญชี ปรับยอดเงิน และลบบัญชี
 *
 * ข้อมูลทั้งหน้าอ่านผ่าน /api/users ซึ่งใช้ service key หลังผ่าน requireAdmin()
 * แล้ว ไม่ได้อ่านผ่าน session ของแอดมิน เพราะไม่มี RLS policy ไหนเปิดให้เห็น
 * บัญชีของคนอื่น — และไม่ควรมีด้วย
 */
export const AdminUsers: React.FC = () => {
  const { showToast } = useShop();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /** Bumped after every write so the list — and the totals on it — reload. */
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey((key) => key + 1);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Typing in the search box must not fire a request per keystroke, and a slow
  // reply for "so" must not land on top of the results for "somchai" — hence
  // both the delay and the cancelled flag.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);

      setIsLoading(true);
      const response = await fetch(`/api/users?${params}`);
      const body = await response.json().catch(() => ({}));
      if (cancelled) return;

      setIsLoading(false);

      if (!body.success) {
        setError(body.message || 'โหลดรายชื่อผู้ใช้งานไม่สำเร็จ');
        setUsers([]);
        setTotal(0);
        return;
      }

      setError('');
      setUsers(body.data as AdminUser[]);
      setTotal(Number(body.total) || 0);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, roleFilter, offset, reloadKey]);

  /** Every write goes through here so the toast and the reload are never forgotten. */
  const send = async (url: string, init: RequestInit, userId: string) => {
    setBusyId(userId);
    const response = await fetch(url, init);
    const body = await response.json().catch(() => ({}));
    setBusyId(null);

    showToast(
      body.message || (body.success ? 'บันทึกเรียบร้อย' : 'ทำรายการไม่สำเร็จ'),
      body.success ? 'success' : 'warning'
    );

    if (body.success) refresh();
    return Boolean(body.success);
  };

  const patchUser = (target: AdminUser, patch: Record<string, unknown>) =>
    send(
      `/api/users/${target.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      },
      target.id
    );

  const removeUser = async (target: AdminUser) => {
    const ok = await send(`/api/users/${target.id}`, { method: 'DELETE' }, target.id);
    if (ok) setDeleteTarget(null);
  };

  const from = total === 0 ? 0 : offset + 1;
  const to = offset + users.length;

  /** Everything a row needs, built once and handed to whichever layout is on. */
  const rowProps = (account: AdminUser): RowProps => ({
    account,
    isSelf: account.id === currentUser?.id,
    isBusy: busyId === account.id,
    onRole: (role) => patchUser(account, { role }),
    onToggleBan: () => patchUser(account, { banned: !account.isBanned }),
    onAdjust: () => setAdjustTarget(account),
    onDelete: () => setDeleteTarget(account),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toolbar */}
      <Card className="bg-white border-neutral-200 rounded-md p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900">จัดการผู้ใช้งาน</h2>
              <p className="text-xs text-neutral-500">
                {isLoading && !users.length
                  ? 'กำลังโหลด...'
                  : `${total.toLocaleString()} บัญชี${
                      search.trim() || roleFilter !== 'all' ? ' (ตามที่กรอง)' : 'ในระบบ'
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={refresh}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-xs font-bold border-neutral-300 rounded-md"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              รีเฟรช
            </Button>
            <Button
              onClick={() => setIsCreating(true)}
              className="flex-1 sm:flex-none bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-bold rounded-md border-0"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              สร้างบัญชีใหม่
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="ค้นหาด้วยอีเมล ชื่อ หรือ user id..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // A new search starts from the first page — otherwise page 4 of
                // the old result set silently shows nothing.
                setOffset(0);
              }}
              className="w-full bg-neutral-50 border-neutral-200 rounded-md py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setRoleFilter(filter.value);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  roleFilter === filter.value
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="bg-neutral-50 border-neutral-400 rounded-md p-4 text-xs text-neutral-700">
          <p className="font-semibold text-neutral-900">{error}</p>
        </Card>
      )}

      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
        {/* Below lg: one card per account. Seven columns cannot be made to fit a
            phone, and a sideways-scrolling table hides the actions off the right
            edge — which is where every button on this page lives. */}
        <ul className="lg:hidden divide-y divide-neutral-100">
          {isLoading && !users.length ? (
            Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="p-4 space-y-3">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-12 w-full" />
              </li>
            ))
          ) : users.length === 0 ? (
            <li className="p-8 text-center text-neutral-400">ไม่พบผู้ใช้งานที่ค้นหา</li>
          ) : (
            users.map((account) => <UserCard key={account.id} {...rowProps(account)} />)
          )}
        </ul>

        {/* Users table */}
        <div className="hidden lg:block overflow-x-auto">
          <Table className="w-full text-left text-xs text-neutral-700">
            <TableHeader className="bg-neutral-50 text-neutral-600 uppercase font-semibold">
              <TableRow className="border-b border-neutral-200 hover:bg-transparent">
                <TableHead className="p-3.5 text-neutral-600">ผู้ใช้งาน</TableHead>
                <TableHead className="p-3.5 text-neutral-600">สิทธิ์</TableHead>
                <TableHead className="p-3.5 text-neutral-600">กระเป๋าเงิน</TableHead>
                <TableHead className="p-3.5 text-neutral-600">คำสั่งซื้อ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">สมัคร / เข้าใช้ล่าสุด</TableHead>
                <TableHead className="p-3.5 text-neutral-600">สถานะ</TableHead>
                <TableHead className="p-3.5 text-right text-neutral-600">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-neutral-100">
              {isLoading && !users.length ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index} className="border-b border-neutral-100">
                    {Array.from({ length: COLUMNS }, (_, cell) => (
                      <TableCell key={cell} className="p-3.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS} className="p-8 text-center text-neutral-400">
                    ไม่พบผู้ใช้งานที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                users.map((account) => {
                  const props = rowProps(account);
                  const { isSelf, isBusy } = props;

                  return (
                    <TableRow
                      key={account.id}
                      className="hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      <TableCell className="p-3.5">
                        <span className="font-bold text-neutral-900 block">
                          {account.name}
                          {isSelf && (
                            <Badge className="ml-2 bg-neutral-900 text-white border-0 text-[10px] font-bold">
                              บัญชีของคุณ
                            </Badge>
                          )}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate max-w-50">
                          {account.email}
                        </span>
                        <span className="text-[10px] text-neutral-300 font-mono block truncate max-w-50">
                          {account.id}
                        </span>
                      </TableCell>

                      {/* สิทธิ์ — ตัวเองแก้ไม่ได้ กันล็อกตัวเองออกจากหลังบ้าน */}
                      <TableCell className="p-3.5">
                        <RoleSelect {...props} />
                      </TableCell>

                      <TableCell className="p-3.5">
                        <span className="font-bold text-neutral-900 block">
                          {money(account.balance)}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          เติมสะสม {money(account.totalTopup)}
                        </span>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={isBusy}
                          onClick={props.onAdjust}
                          className="mt-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 text-[10px] font-bold"
                        >
                          <Coins className="w-3 h-3 mr-1" />
                          ปรับยอด
                        </Button>
                      </TableCell>

                      <TableCell className="p-3.5">
                        <span className="font-semibold text-neutral-800 block">
                          {account.ordersCount.toLocaleString()} รายการ
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ใช้จ่าย {money(account.totalSpent)}
                        </span>
                      </TableCell>

                      <TableCell className="p-3.5">
                        <span className="block text-neutral-700">{formatDate(account.createdAt)}</span>
                        <span className="block text-[10px] text-neutral-400">
                          ล่าสุด {formatDate(account.lastSignInAt)}
                        </span>
                      </TableCell>

                      <TableCell className="p-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge account={account} />
                          {!account.emailConfirmedAt && (
                            <span className="text-[10px] text-neutral-400">ยังไม่ยืนยันอีเมล</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="p-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBusy && <Spinner className="size-3.5 text-neutral-900" />}
                          <RowActions {...props} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pager */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <span className="text-[11px] text-neutral-500">
            แสดง {from.toLocaleString()}–{to.toLocaleString()} จาก {total.toLocaleString()} บัญชี
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={offset === 0 || isLoading}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="text-[11px] font-bold border-neutral-300"
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={to >= total || isLoading}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="text-[11px] font-bold border-neutral-300"
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>

      {adjustTarget && (
        <AdjustWalletModal
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onDone={(amount, note) =>
            send(
              `/api/users/${adjustTarget.id}/wallet`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, note }),
              },
              adjustTarget.id
            )
          }
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          target={deleteTarget}
          isBusy={busyId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => removeUser(deleteTarget)}
        />
      )}

      {isCreating && (
        <CreateUserModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            refresh();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

/** Frame shared by the three dialogs on this page. */
const Modal: React.FC<{
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
    {/* Scrolls inside itself — the adjust and delete dialogs are taller than a
        phone screen once the warning list and the form are both on it. */}
    <div className="relative bg-white border border-neutral-200 rounded-md max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4 space-y-4 text-xs">{children}</div>
    </div>
  </div>
);

const QUICK_AMOUNTS = [50, 100, 300, 500, 1000];

/**
 * Adjusting a balance by hand is the one action here that moves money, so the
 * dialog shows the resulting balance before the admin commits, and refuses a
 * deduction the wallet cannot cover instead of letting the server say no.
 */
const AdjustWalletModal: React.FC<{
  target: AdminUser;
  onClose: () => void;
  onDone: (amount: number, note: string) => Promise<boolean>;
}> = ({ target, onClose, onDone }) => {
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const value = Math.round((Number(amount) || 0) * 100) / 100;
  const signed = mode === 'add' ? value : -value;
  const nextBalance = target.balance + signed;
  const tooMuch = nextBalance < 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 || tooMuch) return;

    setIsSaving(true);
    const ok = await onDone(signed, note);
    setIsSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      title="ปรับยอดเงินในกระเป๋า"
      subtitle={`${target.name} · ${target.email}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 flex items-center justify-between">
          <span className="text-neutral-500">ยอดปัจจุบัน</span>
          <span className="font-bold text-neutral-900">{money(target.balance)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: 'add', label: 'เพิ่มเงิน' },
              { key: 'deduct', label: 'หักเงิน' },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={`px-3 py-2 rounded-md text-xs font-bold border transition-all ${
                mode === option.key
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block font-semibold text-neutral-700 mb-1">จำนวนเงิน (฿)</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setAmount(String(quick))}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
              >
                {quick.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-neutral-700 mb-1">
            เหตุผล (ลูกค้าเห็นในประวัติกระเป๋าเงิน)
          </label>
          <Input
            type="text"
            placeholder="เช่น ชดเชยสินค้าส่งมอบช้า"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
          />
        </div>

        <div
          className={`rounded-md p-3 flex items-center justify-between border ${
            tooMuch ? 'bg-neutral-100 border-neutral-400' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <span className="text-neutral-500">ยอดหลังปรับ</span>
          <span className="font-bold text-neutral-900">
            {tooMuch ? 'ติดลบไม่ได้' : money(nextBalance)}
          </span>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-neutral-300 rounded-md"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={value <= 0 || tooMuch || isSaving}
            className="bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-bold rounded-md border-0 disabled:opacity-50"
          >
            {isSaving ? <Spinner className="mr-1.5" /> : <Coins className="w-4 h-4 mr-1.5" />}
            ยืนยันการปรับยอด
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/** Deletion cascades through every table keyed on the user, so say so plainly. */
const DeleteUserModal: React.FC<{
  target: AdminUser;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ target, isBusy, onClose, onConfirm }) => {
  const [confirmation, setConfirmation] = useState('');
  const matches = confirmation.trim().toLowerCase() === target.email.toLowerCase();

  return (
    <Modal
      title="ลบบัญชีถาวร"
      subtitle={`${target.name} · ${target.email}`}
      onClose={onClose}
    >
      <div className="bg-neutral-50 border border-neutral-400 rounded-md p-3 space-y-2">
        <div className="flex items-center gap-2 font-bold text-neutral-900">
          <TriangleAlert className="w-4 h-4" />
          ย้อนกลับไม่ได้
        </div>
        <ul className="list-disc pl-4 space-y-1 text-neutral-600 text-[11px]">
          <li>
            คำสั่งซื้อ {target.ordersCount.toLocaleString()} รายการ (ใช้จ่ายรวม{' '}
            {money(target.totalSpent)}) จะหายไปจากรายงานยอดขายด้วย
          </li>
          <li>เงินในกระเป๋า {money(target.balance)} และประวัติการเติมเงินจะถูกลบทิ้ง</li>
          <li>
            บัญชี/รหัสที่ส่งมอบให้ลูกค้ารายนี้จะถูกลบตามไปด้วย
            และรหัสในคลังที่เคยขายให้เขาจะกลับมาเป็นของพร้อมขายอีกครั้ง
          </li>
        </ul>
        <p className="text-[11px] text-neutral-500">
          แค่อยากห้ามไม่ให้เข้าใช้งาน ให้กด &quot;ระงับ&quot; แทน — เก็บประวัติไว้ครบและปลดคืนได้
        </p>
      </div>

      <div>
        <label className="block font-semibold text-neutral-700 mb-1">
          พิมพ์อีเมลของบัญชีเพื่อยืนยัน
        </label>
        <Input
          type="text"
          autoFocus
          value={confirmation}
          placeholder={target.email}
          onChange={(e) => setConfirmation(e.target.value)}
          className="w-full bg-neutral-50 border-neutral-200 text-neutral-900 font-mono"
        />
      </div>

      <div className="pt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="text-xs font-bold border-neutral-300 rounded-md"
        >
          ยกเลิก
        </Button>
        <Button
          type="button"
          disabled={!matches || isBusy}
          onClick={onConfirm}
          className="bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-bold rounded-md border-0 disabled:opacity-50"
        >
          {isBusy ? <Spinner className="mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
          ลบบัญชีนี้
        </Button>
      </div>
    </Modal>
  );
};

/**
 * Hand-made accounts land confirmed, because the admin typing the address is
 * the confirmation — see the POST handler. New accounts are always customers;
 * promoting is a separate, visible step.
 */
const CreateUserModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}> = ({ onClose, onCreated, showToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await response.json().catch(() => ({}));
    setIsSaving(false);

    showToast(
      body.message || (body.success ? 'สร้างบัญชีแล้ว' : 'สร้างบัญชีไม่สำเร็จ'),
      body.success ? 'success' : 'warning'
    );

    if (body.success) onCreated();
  };

  return (
    <Modal
      title="สร้างบัญชีผู้ใช้ใหม่"
      subtitle="สำหรับลูกค้าที่รับอีเมลยืนยันไม่ได้ หรือเปิดบัญชีทีมงานเพิ่ม"
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block font-semibold text-neutral-700 mb-1">ชื่อที่แสดง</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
          />
        </div>
        <div>
          <label className="block font-semibold text-neutral-700 mb-1">อีเมล</label>
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
          />
        </div>
        <div>
          <label className="block font-semibold text-neutral-700 mb-1">
            รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร)
          </label>
          <Input
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-50 border-neutral-200 text-neutral-900 font-mono"
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            ส่งรหัสนี้ให้เจ้าของบัญชีแล้วให้เปลี่ยนเองที่หน้า &quot;ลืมรหัสผ่าน&quot;
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 flex items-center gap-2 text-[11px] text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
          บัญชีใหม่เป็น &quot;ลูกค้า&quot; เสมอ ต้องมาปรับสิทธิ์เป็นผู้ดูแลระบบทีหลังในตาราง
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-neutral-300 rounded-md"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-bold rounded-md border-0 disabled:opacity-50"
          >
            {isSaving ? <Spinner className="mr-1.5" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
            สร้างบัญชี
          </Button>
        </div>
      </form>
    </Modal>
  );
};
