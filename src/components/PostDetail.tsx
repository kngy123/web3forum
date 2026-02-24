'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import { CommentSection } from './CommentSection';
import { TrustBadge } from './TrustBadge';
import { PredictionVerification } from './PredictionVerification';
import { shortenAddress } from '@/lib/web3';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Post, Category } from '@/types';
import { getCategoryColorClass } from '@/types';

interface PostDetailProps {
  postId: string | null;
  userWallet: string | null;
  categories: Category[];
  onClose: () => void;
  onVoteUpdate?: (postId: string, upvotes: number, downvotes: number) => void;
}

export function PostDetail({
  postId,
  userWallet,
  categories,
  onClose,
  onVoteUpdate,
}: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    } else {
      setPost(null);
    }
  }, [postId]);

  const fetchPost = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${id}?wallet=${userWallet || ''}`);
      const data = await response.json();
      if (data.success) {
        setPost(data.data);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSuccess = (upvotes: number, downvotes: number, userVote: number) => {
    if (post) {
      setPost({ ...post, upvotes, downvotes, userVote });
      onVoteUpdate?.(post.id, upvotes, downvotes);
    }
  };

  if (!postId) return null;

  const createdAt = post ? new Date(post.createdAt) : null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true, locale: ja })
    : '';

  // カテゴリ情報を取得
  const categoryInfo = post ? categories.find(c => c.name === post.category) : null;
  const categoryLabel = categoryInfo ? `${categoryInfo.icon} ${categoryInfo.label}` : post?.category;
  const categoryColor = categoryInfo?.color || 'gray';

  return (
    <Dialog open={!!postId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : post ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={getCategoryColorClass(categoryColor)}
                >
                  {categoryLabel}
                </Badge>
                <span className="text-xs text-gray-500">
                  投稿者: {shortenAddress(post.authorWallet)}
                </span>
                {post.userTrust && (
                  <TrustBadge
                    trustLevel={post.userTrust.trustLevel}
                    totalPoints={post.userTrust.totalPoints}
                    size="sm"
                  />
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
              <DialogTitle className="text-xl text-white">{post.title}</DialogTitle>
            </DialogHeader>

            <div className="flex gap-4 mt-4">
              {/* Vote Section */}
              <div className="flex flex-col items-center bg-gray-800/50 rounded-lg p-3 h-fit">
                <VoteButtons
                  postId={post.id}
                  upvotes={post.upvotes}
                  downvotes={post.downvotes}
                  userVote={post.userVote ?? 0}
                  voterWallet={userWallet}
                  onVoteSuccess={handleVoteSuccess}
                />
              </div>

              {/* Content Section */}
              <div className="flex-1">
                {post.content && (
                  <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>
                )}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="投稿画像"
                    className="max-w-full rounded-lg mb-4"
                  />
                )}
              </div>
            </div>

            {/* Prediction Section */}
            {post.isPrediction && post.prediction && (
              <div className="mt-4">
                <PredictionVerification
                  prediction={post.prediction}
                  userWallet={userWallet}
                  onVerificationComplete={() => fetchPost(post.id)}
                />
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <CommentSection
                postId={post.id}
                comments={post.comments || []}
                userWallet={userWallet}
                onCommentAdded={() => fetchPost(post.id)}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            投稿が見つかりません
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
