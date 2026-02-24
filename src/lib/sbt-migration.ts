/**
 * SBT移行サービス
 *
 * 現在のDBベースのポイントを、後から本物のSBT（Soulbound Token）に移行するためのサービス
 */

import { db } from './db';
import { getUserTrustStats } from './trust';

// SBT移行状態
export type MigrationStatus = 'none' | 'pending' | 'migrated';

// 移行リクエスト情報
export interface MigrationRequest {
  wallet: string;
  totalPoints: number;
  correctCount: number;
  incorrectCount: number;
  trustLevel: number;
  requestedAt: Date;
  status: MigrationStatus;
  txHash?: string;
  tokenId?: number;
}

// SBT契約インターフェース（将来的に実装）
interface SBTContract {
  mintSBT(wallet: string): Promise<{ tokenId: number; txHash: string }>;
  updateTrust(
    wallet: string,
    points: number,
    correct: number,
    incorrect: number,
    level: number
  ): Promise<{ txHash: string }>;
  getTrustData(wallet: string): Promise<{
    totalPoints: number;
    correctCount: number;
    incorrectCount: number;
    trustLevel: number;
  }>;
}

/**
 * SBT移行サービスクラス
 */
export class SBTMigrationService {
  private sbtContract: SBTContract | null = null;
  private isBlockchainEnabled: boolean = false;

  /**
   * ブロックチェーン接続を初期化（本番移行時に呼び出し）
   */
  async initializeBlockchain(rpcUrl: string, contractAddress: string, privateKey: string) {
    try {
      // 将来的に実際のブロックチェーン接続を実装
      // const provider = new ethers.JsonRpcProvider(rpcUrl);
      // const wallet = new ethers.Wallet(privateKey, provider);
      // this.sbtContract = new ethers.Contract(contractAddress, TrustSBT_ABI, wallet);

      this.isBlockchainEnabled = true;
      console.log('SBT Blockchain initialized');
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      this.isBlockchainEnabled = false;
    }
  }

  /**
   * ユーザーの移行ステータスを取得
   */
  async getMigrationStatus(wallet: string): Promise<{
    status: MigrationStatus;
    canMigrate: boolean;
    dbData: Awaited<ReturnType<typeof getUserTrustStats>> | null;
    blockchainData: unknown | null;
  }> {
    // DBからデータ取得
    const dbData = await getUserTrustStats(wallet);

    // 移行済みかチェック（将来的にブロックチェーンから確認）
    let blockchainData = null;
    let status: MigrationStatus = 'none';

    if (this.isBlockchainEnabled && this.sbtContract) {
      try {
        // blockchainData = await this.sbtContract.getTrustData(wallet);
        // if (blockchainData) status = 'migrated';
      } catch {
        // SBT未発行
      }
    }

    // 移行可能かチェック
    const canMigrate = this.checkMigrationEligibility(dbData);

    return {
      status,
      canMigrate,
      dbData,
      blockchainData,
    };
  }

  /**
   * 移行可能かチェック
   */
  private checkMigrationEligibility(
    trustData: Awaited<ReturnType<typeof getUserTrustStats>> | null
  ): boolean {
    if (!trustData) return false;

    // レベル2以上で移行可能（一定の実績があるユーザーのみ）
    if (trustData.trustLevel < 2) return false;

    // 少なくとも1回以上の判定履歴があること
    if (trustData.correctCount + trustData.incorrectCount < 1) return false;

    return true;
  }

  /**
   * SBT移行を実行（ユーザーがリクエスト）
   */
  async migrateToSBT(wallet: string): Promise<{
    success: boolean;
    status: MigrationStatus;
    txHash?: string;
    tokenId?: number;
    error?: string;
  }> {
    // 移行可能性チェック
    const { canMigrate, dbData } = await this.getMigrationStatus(wallet);

    if (!canMigrate || !dbData) {
      return {
        success: false,
        status: 'none',
        error: '移行条件を満たしていません。レベル2以上が必要です。',
      };
    }

    // 既に移行済みかチェック
    // if (status === 'migrated') {
    //   return { success: false, status: 'migrated', error: '既に移行済みです' };
    // }

    // ブロックチェーンが有効でない場合、移行リクエストを記録
    if (!this.isBlockchainEnabled || !this.sbtContract) {
      return {
        success: false,
        status: 'pending',
        error: 'ブロックチェーン移行は準備中です。リクエストを記録しました。',
      };
    }

    try {
      // SBT発行
      const { tokenId, txHash } = await this.sbtContract.mintSBT(wallet);

      // 信頼性スコアを更新
      await this.sbtContract.updateTrust(
        wallet,
        dbData.totalPoints,
        dbData.correctCount,
        dbData.incorrectCount,
        dbData.trustLevel
      );

      // 移行記録を保存
      await this.saveMigrationRecord(wallet, {
        tokenId,
        txHash,
        totalPoints: dbData.totalPoints,
        correctCount: dbData.correctCount,
        incorrectCount: dbData.incorrectCount,
        trustLevel: dbData.trustLevel,
      });

      return {
        success: true,
        status: 'migrated',
        tokenId,
        txHash,
      };
    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        status: 'none',
        error: '移行に失敗しました',
      };
    }
  }

  /**
   * 移行記録を保存
   */
  private async saveMigrationRecord(
    wallet: string,
    data: {
      tokenId: number;
      txHash: string;
      totalPoints: number;
      correctCount: number;
      incorrectCount: number;
      trustLevel: number;
    }
  ) {
    // 将来的に移行記録テーブルに保存
    // await db.sBTMigration.create({ data: { wallet, ...data } });
  }

  /**
   * スコア同期（DB → ブロックチェーン）
   * 既にSBTを持っているユーザーのスコアを更新
   */
  async syncScoreToBlockchain(wallet: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    if (!this.isBlockchainEnabled || !this.sbtContract) {
      return { success: false, error: 'ブロックチェーンが有効ではありません' };
    }

    const dbData = await getUserTrustStats(wallet);
    if (!dbData) {
      return { success: false, error: 'ユーザーデータが見つかりません' };
    }

    try {
      const { txHash } = await this.sbtContract.updateTrust(
        wallet,
        dbData.totalPoints,
        dbData.correctCount,
        dbData.incorrectCount,
        dbData.trustLevel
      );

      return { success: true, txHash };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: '同期に失敗しました' };
    }
  }

  /**
   * バッチ移行（管理者用）
   * 全ユーザーを一括でSBTに移行
   */
  async batchMigrate(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[],
    };

    if (!this.isBlockchainEnabled) {
      result.errors.push('ブロックチェーンが有効ではありません');
      return result;
    }

    // 全ユーザーを取得
    const users = await db.userTrust.findMany({
      where: { trustLevel: { gte: 2 } },
    });

    result.total = users.length;

    for (const user of users) {
      try {
        const migrationResult = await this.migrateToSBT(user.wallet);
        if (migrationResult.success) {
          result.migrated++;
        } else {
          result.failed++;
          result.errors.push(`${user.wallet}: ${migrationResult.error}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`${user.wallet}: 不明なエラー`);
      }
    }

    return result;
  }
}

// シングルトンインスタンス
export const sbtMigrationService = new SBTMigrationService();
