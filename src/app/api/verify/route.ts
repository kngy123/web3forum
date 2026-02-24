import { NextRequest, NextResponse } from 'next/server';
import { addVerification, getOrCreateUserTrust } from '@/lib/trust';
import { db } from '@/lib/db';

// POST /api/verify - Add verification to a prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, verifierWallet, result } = body;

    if (!predictionId || !verifierWallet || !result) {
      return NextResponse.json(
        { success: false, error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    if (!['correct', 'incorrect'].includes(result)) {
      return NextResponse.json(
        { success: false, error: '結果は correct または incorrect で指定してください' },
        { status: 400 }
      );
    }

    // 自分の予測には検証できない
    const prediction = await db.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return NextResponse.json(
        { success: false, error: '予測が見つかりません' },
        { status: 404 }
      );
    }

    if (prediction.authorWallet === verifierWallet) {
      return NextResponse.json(
        { success: false, error: '自分の予測を検証することはできません' },
        { status: 400 }
      );
    }

    if (prediction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'この予測は既に判定されています' },
        { status: 400 }
      );
    }

    // 検証を追加
    const verification = await addVerification(predictionId, verifierWallet, result);

    // 更新された予測を取得
    const updatedPrediction = await db.prediction.findUnique({
      where: { id: predictionId },
      include: {
        verifications: { where: { verifierWallet } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        verification,
        prediction: updatedPrediction,
        userVerification: updatedPrediction?.verifications[0] || null,
      },
    });
  } catch (error) {
    console.error('Error adding verification:', error);
    const errorMessage = error instanceof Error ? error.message : '検証の追加に失敗しました';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
