'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react';
import { TrustProgress } from './TrustBadge';
import type { UserTrust } from '@/types';

interface SBTMigrationProps {
  userWallet: string;
  userTrust: UserTrust | null;
  onMigrationComplete?: () => void;
}

type MigrationStatus = 'none' | 'pending' | 'migrated';

interface MigrationData {
  status: MigrationStatus;
  canMigrate: boolean;
  dbData: {
    trustLevel: number;
    totalPoints: number;
    correctCount: number;
    incorrectCount: number;
  } | null;
  blockchainData: unknown | null;
}

export function SBTMigration({ userWallet, userTrust, onMigrationComplete }: SBTMigrationProps) {
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    txHash?: string;
    tokenId?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (userWallet) {
      fetchMigrationStatus();
    }
  }, [userWallet]);

  const fetchMigrationStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sbt/migrate?wallet=${userWallet}`);
      const data = await response.json();
      if (data.success) {
        setMigrationData(data.data);
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/sbt/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: userWallet }),
      });

      const data = await response.json();
      setMigrationResult(data.data);

      if (data.success) {
        onMigrationComplete?.();
        fetchMigrationStatus();
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        error: '移行リクエストに失敗しました',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      </Card>
    );
  }

  // まだレベル2未満
  if (!migrationData?.canMigrate && migrationData?.dbData) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Lock className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-400">SBT移行ロック中</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          レベル2以上になると、あなたの信頼性スコアを本物のSBTとして発行できます。
        </p>
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <TrustProgress currentPoints={userTrust?.totalPoints || 0} />
        </div>
      </Card>
    );
  }

  // 既に移行済み
  if (migrationData?.status === 'migrated') {
    return (
      <Card className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500/30 p-4">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="font-medium text-green-300">SBT移行完了</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              あなたの信頼性スコアはブロックチェーン上で証明可能です。
            </p>
            {migrationResult?.txHash && (
              <a
                href={`https://basescan.org/tx/${migrationResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1"
              >
                トランザクションを見る <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <Shield className="h-12 w-12 text-green-500/50" />
        </div>
      </Card>
    );
  }

  // 移行可能
  return (
    <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Shield className="h-5 w-5 text-purple-400" />
        <span className="font-medium text-purple-300">SBT移行可能</span>
        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          条件達成
        </Badge>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        あなたの信頼性スコアを本物のSBTとして発行できます。
        一度発行すると移転不可能で、永続的に記録されます。
      </p>

      {/* スコア概要 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <div className="text-xs text-gray-500">総ポイント</div>
          <div className="text-xl font-bold text-white">
            {userTrust?.totalPoints.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <div className="text-xs text-gray-500">信頼レベル</div>
          <div className="text-xl font-bold text-purple-400">
            Lv.{userTrust?.trustLevel || 1}
          </div>
        </div>
      </div>

      {/* 移行結果 */}
      {migrationResult && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            migrationResult.success
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-yellow-500/10 border border-yellow-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {migrationResult.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">移行リクエストを記録しました</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-300">{migrationResult.error}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 移行ボタン */}
      <Button
        onClick={handleMigrate}
        disabled={isMigrating}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        {isMigrating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            処理中...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            SBTとして発行する
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        ※ 現在は準備中です。ブロックチェーン移行機能が有効になった際に通知されます。
      </p>
    </Card>
  );
}
