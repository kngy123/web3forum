'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Target, CheckCircle, XCircle } from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import { TrustBadge } from './TrustBadge';
import { shortenAddress } from '@/lib/web3';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Post, Category } from '@/types';
import { getCategoryColorClass } from '@/types';

interface PostCardProps {
  post: Post;
  categories: Category[];
  voterWallet: string | null;
  onClick?: () => void;
}

const predictionStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  correct: 'bg-green-500/20 text-green-300 border-green-500/30',
  incorrect: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function PostCard({ post, categories, voterWallet, onClick }: PostCardProps) {
  const createdAt = new Date(post.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ja });

  // カテゴリ情報を取得
  const categoryInfo = categories.find(c => c.name === post.category);
  const categoryLabel = categoryInfo ? `${categoryInfo.icon} ${categoryInfo.label}` : post.category;
  const categoryColor = categoryInfo?.color || 'gray';

  return (
    <Card
      className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex">
        {/* Vote Section */}
        <div className="flex flex-col items-center justify-start p-4 bg-gray-900/30 rounded-l-lg">
          <VoteButtons
            postId={post.id}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            userVote={post.userVote ?? 0}
            voterWallet={voterWallet}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Prediction Badge */}
            {post.isPrediction && post.prediction && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                <Target className="h-3 w-3 mr-1" />
                予測
              </Badge>
            )}

            {/* Prediction Status */}
            {post.isPrediction && post.prediction && (
              <Badge
                variant="outline"
                className={predictionStatusColors[post.prediction.status]}
              >
                {post.prediction.status === 'pending' && (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {post.prediction.status === 'correct' && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {post.prediction.status === 'incorrect' && (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {post.prediction.status === 'pending' && '判定待ち'}
                {post.prediction.status === 'correct' && '正解'}
                {post.prediction.status === 'incorrect' && '不正解'}
              </Badge>
            )}

            {/* Category */}
            <Badge
              variant="outline"
              className={getCategoryColorClass(categoryColor)}
            >
              {categoryLabel}
            </Badge>

            {/* Author */}
            <span className="text-xs text-gray-500">
              投稿者: {shortenAddress(post.authorWallet)}
            </span>

            {/* Trust Badge */}
            {post.userTrust && (
              <TrustBadge
                trustLevel={post.userTrust.trustLevel}
                totalPoints={post.userTrust.totalPoints}
                size="sm"
              />
            )}

            {/* Time */}
            <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {post.title}
          </h3>

          {post.content && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-3">
              {post.content}
            </p>
          )}

          {post.imageUrl && (
            <div className="mb-3">
              <img
                src={post.imageUrl}
                alt="投稿画像"
                className="max-h-48 rounded-lg object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.comments?.length || 0} コメント
            </span>
            {post.isPrediction && post.prediction && (
              <span className="flex items-center gap-1 text-purple-400">
                <Target className="h-3 w-3" />
                {post.prediction.correctVotes + post.prediction.incorrectVotes}人が判定
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
