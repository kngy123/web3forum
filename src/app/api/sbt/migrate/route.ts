import { NextRequest, NextResponse } from 'next/server';
import { sbtMigrationService } from '@/lib/sbt-migration';

// GET /api/sbt/migrate - 移行ステータス取得
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

    const status = await sbtMigrationService.getMigrationStatus(wallet);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting migration status:', error);
    return NextResponse.json(
      { success: false, error: 'ステータスの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/sbt/migrate - SBT移行実行
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

    const result = await sbtMigrationService.migrateToSBT(wallet);

    return NextResponse.json({
      success: result.success,
      data: {
        status: result.status,
        txHash: result.txHash,
        tokenId: result.tokenId,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: '移行に失敗しました' },
      { status: 500 }
    );
  }
}
