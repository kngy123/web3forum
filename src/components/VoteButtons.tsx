'use client';

import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface VoteButtonsProps {
  postId: string;
  upvotes: number;
  downvotes: number;
  userVote: number;
  voterWallet: string | null;
  onVoteSuccess?: (upvotes: number, downvotes: number, userVote: number) => void;
}

export function VoteButtons({
  postId,
  upvotes,
  downvotes,
  userVote,
  voterWallet,
  onVoteSuccess,
}: VoteButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [localUserVote, setLocalUserVote] = useState(userVote);

  const handleVote = async (voteType: 1 | -1) => {
    if (!voterWallet) {
      alert('投票するにはウォレットを接続してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          voterWallet,
          voteType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLocalUpvotes(data.data.post.upvotes);
        setLocalDownvotes(data.data.post.downvotes);
        setLocalUserVote(data.data.userVote);
        onVoteSuccess?.(
          data.data.post.upvotes,
          data.data.post.downvotes,
          data.data.userVote
        );
      } else {
        alert(data.error || '投票に失敗しました');
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('投票に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const score = localUpvotes - localDownvotes;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={`h-8 w-8 p-0 ${
          localUserVote === 1
            ? 'text-orange-500 bg-orange-500/10'
            : 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10'
        }`}
      >
        <ArrowBigUp className="h-5 w-5" fill={localUserVote === 1 ? 'currentColor' : 'none'} />
      </Button>
      <span
        className={`min-w-[2rem] text-center text-sm font-medium ${
          score > 0
            ? 'text-orange-400'
            : score < 0
            ? 'text-blue-400'
            : 'text-gray-400'
        }`}
      >
        {score}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={`h-8 w-8 p-0 ${
          localUserVote === -1
            ? 'text-blue-500 bg-blue-500/10'
            : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
        }`}
      >
        <ArrowBigDown className="h-5 w-5" fill={localUserVote === -1 ? 'currentColor' : 'none'} />
      </Button>
    </div>
  );
}
