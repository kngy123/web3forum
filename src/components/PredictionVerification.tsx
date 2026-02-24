'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Loader2,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { Prediction, Verification } from '@/types';

interface PredictionVerificationProps {
  prediction: Prediction;
  userWallet: string | null;
  onVerificationComplete?: () => void;
}

const statusConfig = {
  pending: {
    label: '判定待ち',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: Clock,
  },
  correct: {
    label: '正解',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: CheckCircle,
  },
  incorrect: {
    label: '不正解',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: XCircle,
  },
};

export function PredictionVerification({
  prediction,
  userWallet,
  onVerificationComplete,
}: PredictionVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVerification, setUserVerification] = useState<Verification | null>(
    prediction.userVerification || null
  );
  const [correctVotes, setCorrectVotes] = useState(prediction.correctVotes);
  const [incorrectVotes, setIncorrectVotes] = useState(prediction.incorrectVotes);

  const status = statusConfig[prediction.status];
  const StatusIcon = status.icon;
  const isAuthor = userWallet === prediction.authorWallet;
  const canVerify = userWallet && !isAuthor && prediction.status === 'pending';

  const handleVerify = async (result: 'correct' | 'incorrect') => {
    if (!userWallet) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: prediction.id,
          verifierWallet: userWallet,
          result,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserVerification(data.data.userVerification);
        setCorrectVotes(data.data.prediction.correctVotes);
        setIncorrectVotes(data.data.prediction.incorrectVotes);
        onVerificationComplete?.();
      } else {
        alert(data.error || '検証に失敗しました');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('検証に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = correctVotes + incorrectVotes;
  const correctPercentage = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">予測・主張</span>
          </div>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-300">{prediction.content}</p>

        {/* Vote Stats */}
        {prediction.status === 'pending' && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>正解 {correctVotes}</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-3 w-3" />
              <span>不正解 {incorrectVotes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 ml-auto">
              <Users className="h-3 w-3" />
              <span>{prediction.totalVerifiers}人が判定</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalVotes > 0 && prediction.status === 'pending' && (
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${correctPercentage}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${100 - correctPercentage}%` }}
            />
          </div>
        )}

        {/* Verification Buttons */}
        {canVerify && (
          <div className="pt-2">
            {userVerification ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">あなたの判定:</span>
                <Badge
                  variant="outline"
                  className={
                    userVerification.result === 'correct'
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }
                >
                  {userVerification.result === 'correct' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      正解
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      不正解
                    </>
                  )}
                </Badge>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleVerify('correct')}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      正解
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleVerify('incorrect')}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      不正解
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Author Notice */}
        {isAuthor && prediction.status === 'pending' && (
          <p className="text-xs text-gray-500">
            ※ 自分の予測には判定できません。他のユーザーからの判定を待ちます。
          </p>
        )}

        {/* Result Message */}
        {prediction.status !== 'pending' && (
          <div
            className={`text-sm font-medium ${
              prediction.status === 'correct' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {prediction.status === 'correct'
              ? '✨ この予測は正解と判定されました！'
              : '❌ この予測は不正解と判定されました'}
          </div>
        )}
      </div>
    </Card>
  );
}
