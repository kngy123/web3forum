import { db } from './db';
import { calculateTrustLevel } from '@/types';

// 信頼性レベルの設定
export const TRUST_CONFIG = {
  // 判定に必要な最小検証者数
  MIN_VERIFIERS: 3,
  // 正解判定時のポイント加算
  CORRECT_POINTS: 50,
  // 不正解判定時のポイント減算
  INCORRECT_POINTS: -30,
  // 検証者へのポイント（正しい判定をした場合）
  VERIFIER_BONUS: 10,
  // レベルアップボーナス
  LEVEL_BONUSES: {
    2: 50,  // 見習い達成
    3: 100, // 信頼できる達成
    4: 200, // 専門家達成
    5: 500, // 予言者達成
  },
};

/**
 * ユーザーの信頼性スコアを取得または作成
 */
export async function getOrCreateUserTrust(wallet: string) {
  try {
    let userTrust = await db.userTrust.findUnique({
      where: { wallet },
    });

    if (!userTrust) {
      userTrust = await db.userTrust.create({
        data: { wallet },
      });
    }

    return userTrust;
  } catch (error) {
    console.error('Error in getOrCreateUserTrust:', error);
    throw error;
  }
}

/**
 * 予測の判定を確定する
 * 一定数以上の検証者が集まったら、多数決で判定
 */
export async function finalizePredictionIfNeeded(predictionId: string) {
  try {
    const prediction = await db.prediction.findUnique({
      where: { id: predictionId },
      include: { verifications: true },
    });

    if (!prediction || prediction.status !== 'pending') {
      return null;
    }

    // 最小検証者数に達していない場合は何もしない
    if (prediction.totalVerifiers < TRUST_CONFIG.MIN_VERIFIERS) {
      return null;
    }

    // 多数決で判定
    const isCorrect = prediction.correctVotes > prediction.incorrectVotes;
    const newStatus = isCorrect ? 'correct' : 'incorrect';

    // 予測者にポイント加算/減算
    const points = isCorrect ? TRUST_CONFIG.CORRECT_POINTS : TRUST_CONFIG.INCORRECT_POINTS;
    const authorTrust = await getOrCreateUserTrust(prediction.authorWallet);

    // ユーザーの信頼性スコア更新
    const newTotalPoints = Math.max(0, authorTrust.totalPoints + points);
    const newTrustLevel = calculateTrustLevel(newTotalPoints);

    await db.$transaction([
      // 予測ステータス更新
      db.prediction.update({
        where: { id: predictionId },
        data: {
          status: newStatus,
          finalizedAt: new Date(),
        },
      }),
      // ユーザーの信頼性更新
      db.userTrust.update({
        where: { wallet: prediction.authorWallet },
        data: {
          totalPoints: newTotalPoints,
          trustLevel: newTrustLevel,
          correctCount: isCorrect ? { increment: 1 } : undefined,
          incorrectCount: !isCorrect ? { increment: 1 } : undefined,
          pendingCount: { decrement: 1 },
        },
      }),
    ]);

    // 正しい判定をした検証者にボーナスポイント
    if (isCorrect) {
      const correctVerifiers = prediction.verifications.filter(v => v.result === 'correct');
      for (const verifier of correctVerifiers) {
        await addVerifierBonus(verifier.verifierWallet);
      }
    } else {
      const incorrectVerifiers = prediction.verifications.filter(v => v.result === 'incorrect');
      for (const verifier of incorrectVerifiers) {
        await addVerifierBonus(verifier.verifierWallet);
      }
    }

    return { status: newStatus, points };
  } catch (error) {
    console.error('Error in finalizePredictionIfNeeded:', error);
    throw error;
  }
}

/**
 * 検証者にボーナスポイントを加算
 */
async function addVerifierBonus(wallet: string) {
  try {
    const userTrust = await getOrCreateUserTrust(wallet);
    const newTotalPoints = userTrust.totalPoints + TRUST_CONFIG.VERIFIER_BONUS;
    const newTrustLevel = calculateTrustLevel(newTotalPoints);

    await db.userTrust.update({
      where: { wallet },
      data: {
        totalPoints: newTotalPoints,
        trustLevel: newTrustLevel,
      },
    });
  } catch (error) {
    console.error('Error in addVerifierBonus:', error);
    throw error;
  }
}

/**
 * 予測を作成
 */
export async function createPrediction(
  content: string,
  authorWallet: string,
  postId?: string,
  commentId?: string,
  deadline?: Date
) {
  try {
    // ユーザーの信頼性レコードを確保
    await getOrCreateUserTrust(authorWallet);

    // 予測作成
    const prediction = await db.prediction.create({
      data: {
        content,
        authorWallet,
        postId: postId || null,
        commentId: commentId || null,
        deadline: deadline || null,
      },
    });

    // 保留中の予測数を増やす
    await db.userTrust.update({
      where: { wallet: authorWallet },
      data: { pendingCount: { increment: 1 } },
    });

    return prediction;
  } catch (error) {
    console.error('Error in createPrediction:', error);
    throw error;
  }
}

/**
 * 予測に検証を追加
 */
export async function addVerification(
  predictionId: string,
  verifierWallet: string,
  result: 'correct' | 'incorrect'
) {
  try {
    // 既に検証済みかチェック
    const existing = await db.verification.findUnique({
      where: {
        predictionId_verifierWallet: { predictionId, verifierWallet },
      },
    });

    if (existing) {
      throw new Error('Already verified');
    }

    // 検証者の信頼レベルを取得
    const verifierTrust = await getOrCreateUserTrust(verifierWallet);

    // 検証を追加
    const verification = await db.verification.create({
      data: {
        predictionId,
        verifierWallet,
        result,
        verifierTrust: verifierTrust.trustLevel,
      },
    });

    // 予測の投票数を更新
    const updateData =
      result === 'correct'
        ? { correctVotes: { increment: 1 }, totalVerifiers: { increment: 1 } }
        : { incorrectVotes: { increment: 1 }, totalVerifiers: { increment: 1 } };

    await db.prediction.update({
      where: { id: predictionId },
      data: updateData,
    });

    // 判定確定を試みる
    await finalizePredictionIfNeeded(predictionId);

    return verification;
  } catch (error) {
    console.error('Error in addVerification:', error);
    throw error;
  }
}

/**
 * ユーザーの信頼性統計を取得
 */
export async function getUserTrustStats(wallet: string) {
  try {
    const userTrust = await getOrCreateUserTrust(wallet);

    const predictions = await db.prediction.count({
      where: { authorWallet: wallet },
    });

    const verifications = await db.verification.count({
      where: { verifierWallet: wallet },
    });

    const correctPredictions = await db.prediction.count({
      where: { authorWallet: wallet, status: 'correct' },
    });

    const incorrectPredictions = await db.prediction.count({
      where: { authorWallet: wallet, status: 'incorrect' },
    });

    const accuracy =
      correctPredictions + incorrectPredictions > 0
        ? Math.round((correctPredictions / (correctPredictions + incorrectPredictions)) * 100)
        : null;

    return {
      ...userTrust,
      totalPredictions: predictions,
      totalVerifications: verifications,
      accuracy,
    };
  } catch (error) {
    console.error('Error in getUserTrustStats:', error);
    throw error;
  }
}
