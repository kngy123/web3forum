import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserTrustStats } from '@/lib/trust';

// GET /api/predictions - Get predictions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (wallet) where.authorWallet = wallet;
    if (status && ['pending', 'correct', 'incorrect'].includes(status)) {
      where.status = status;
    }

    const predictions = await db.prediction.findMany({
      where,
      include: {
        post: {
          select: { id: true, title: true },
        },
        verifications: wallet
          ? { where: { verifierWallet: wallet } }
          : false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform to include user verification status
    const transformed = predictions.map((p) => ({
      ...p,
      userVerification: p.verifications?.[0] || null,
      verifications: undefined,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { success: false, error: '予測の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/predictions - Get user trust stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'ウォレットアドレスが必要です' },
        { status: 400 }
      );
    }

    const stats = await getUserTrustStats(wallet);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching trust stats:', error);
    return NextResponse.json(
      { success: false, error: '統計の取得に失敗しました' },
      { status: 500 }
    );
  }
}
