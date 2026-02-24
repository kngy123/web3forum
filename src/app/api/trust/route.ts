import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserTrustStats, getOrCreateUserTrust } from '@/lib/trust';

// GET /api/trust - Get trust info for a wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'ウォレットアドレスが必要です' },
        { status: 400 }
      );
    }

    const stats = await getUserTrustStats(wallet);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching trust:', error);
    return NextResponse.json(
      { success: false, error: '信頼性情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/trust - Get or create trust for multiple wallets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallets } = body;

    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json(
        { success: false, error: 'ウォレットアドレスの配列が必要です' },
        { status: 400 }
      );
    }

    const trustMap: Record<string, Awaited<ReturnType<typeof getOrCreateUserTrust>>> = {};

    for (const wallet of wallets) {
      if (wallet) {
        trustMap[wallet] = await getOrCreateUserTrust(wallet);
      }
    }

    return NextResponse.json({ success: true, data: trustMap });
  } catch (error) {
    console.error('Error fetching trust map:', error);
    return NextResponse.json(
      { success: false, error: '信頼性情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
