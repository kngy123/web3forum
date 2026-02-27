'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { MessageSquare, Reply, ImagePlus, X, Loader2, Send } from 'lucide-react';
import { shortenAddress } from '@/lib/web3';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  userWallet: string | null;
  onCommentAdded?: () => void;
}

export function CommentSection({
  postId,
  comments: initialComments,
  userWallet,
  onCommentAdded,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [replyImageUrl, setReplyImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('画像サイズは5MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (isReply) {
        setReplyImageUrl(base64);
      } else {
        setImageUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitComment = async (parentId: string | null = null) => {
    const content = parentId ? replyContent : newComment;
    const image = parentId ? replyImageUrl : imageUrl;

    if (!content.trim()) {
      alert('コメントを入力してください');
      return;
    }

    if (!userWallet) {
      alert('コメントするにはウォレットを接続してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: image,
          authorWallet: userWallet,
          postId,
          parentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments([...comments, data.data]);
        if (parentId) {
          setReplyContent('');
          setReplyImageUrl(null);
          setReplyTo(null);
        } else {
          setNewComment('');
          setImageUrl(null);
        }
        onCommentAdded?.();
      } else {
        alert(data.error || 'コメントの投稿に失敗しました');
      }
    } catch (err) {
      console.error('Comment error:', err);
      alert('コメントの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group comments by parent
  const parentComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-300">
        <MessageSquare className="h-5 w-5" />
        <span className="font-medium">コメント ({comments.length})</span>
      </div>

      {/* New Comment Form */}
      {userWallet ? (
        <Card className="bg-gray-800/50 border-gray-700/50 p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 min-h-[80px] mb-3"
          />
          <div className="flex items-center gap-4 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, false)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              画像
            </Button>
            {imageUrl && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="プレビュー"
                  className="h-12 w-12 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="h-2 w-2 text-white" />
                </button>
              </div>
            )}
          </div>
          <Button
            onClick={() => handleSubmitComment()}
            disabled={isSubmitting || !newComment.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                コメントする
              </>
            )}
          </Button>
        </Card>
      ) : (
        <p className="text-sm text-gray-500">
          コメントするにはウォレットを接続してください
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {parentComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Parent Comment */}
            <Card className="bg-gray-800/30 border-gray-700/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-purple-400">
                  {shortenAddress(comment.authorWallet)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
              {comment.imageUrl && (
                <img
                  src={comment.imageUrl}
                  alt="コメント画像"
                  className="max-h-32 rounded object-cover mb-2"
                />
              )}
              {userWallet && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-gray-400 hover:text-purple-400 h-7"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  返信
                </Button>
              )}
            </Card>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="ml-6 mt-2">
                <Card className="bg-gray-800/30 border-gray-700/30 p-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="返信を入力..."
                    className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 min-h-[60px] mb-2"
                  />
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, true)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="border-gray-700 text-gray-300 hover:bg-gray-700 h-7"
                    >
                      <ImagePlus className="h-3 w-3 mr-1" />
                      画像
                    </Button>
                    {replyImageUrl && (
                      <div className="relative">
                        <img
                          src={replyImageUrl}
                          alt="プレビュー"
                          className="h-10 w-10 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setReplyImageUrl(null)}
                          className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="h-2 w-2 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white h-7"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        '返信'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                        setReplyImageUrl(null);
                      }}
                      className="border-gray-700 text-gray-300 hover:bg-gray-700 h-7"
                    >
                      キャンセル
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Replies */}
            {getReplies(comment.id).map((reply) => (
              <Card
                key={reply.id}
                className="ml-6 bg-gray-800/20 border-gray-700/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-400">
                    {shortenAddress(reply.authorWallet)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{reply.content}</p>
                {reply.imageUrl && (
                  <img
                    src={reply.imageUrl}
                    alt="返信画像"
                    className="max-h-24 rounded object-cover mt-2"
                  />
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
