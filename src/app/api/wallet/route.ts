import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { toWalletTransaction } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

/** Balance plus recent movements. RLS limits both to the calling user. */
export async function GET() {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();

    const [wallet, transactions] = await Promise.all([
      supabase.from('wallets').select('balance, updated_at').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (wallet.error) return dbError(wallet.error);

    return NextResponse.json({
      success: true,
      data: {
        // No row yet simply means the account has never had money in it.
        balance: Number(wallet.data?.balance ?? 0),
        updatedAt: wallet.data?.updated_at ?? null,
        transactions: (transactions.data ?? []).map(toWalletTransaction),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
