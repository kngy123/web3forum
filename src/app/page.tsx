'use client';

import { useEffect, useState, useCallback } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { PostCard } from '@/components/PostCard';
import { PostForm } from '@/components/PostForm';
import { PostDetail } from '@/components/PostDetail';
import { TrustBadge, TrustProgress } from '@/components/TrustBadge';
import { SBTMigration } from '@/components/SBTMigration';
import { CreateCategoryDialog } from '@/components/CreateCategoryDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  MessageSquare,
  TrendingUp,
  Clock,
  Flame,
  Target,
  Trophy,
} from 'lucide-react';
import { useWalletStore } from '@/lib/wallet-store';
import type { Post, UserTrust, Category } from '@/types';
import { getCategoryColorClass } from '@/types';

export default function Home() {
  const { address, isConnected } = useWalletStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'new' | 'hot' | 'top'>('hot');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [userTrust, setUserTrust] = useState<UserTrust | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const response = await fetch(`/api/posts?wallet=${address || ''}${categoryParam}`);
      const data = await response.json();

      if (data.success) {
        let sortedPosts = data.data;

        // Sort posts
        if (sortBy === 'new') {
          sortedPosts = sortedPosts.sort(
            (a: Post, b: Post) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (sortBy === 'hot') {
          // Hot = recent + engagement
          sortedPosts = sortedPosts.sort((a: Post, b: Post) => {
            const scoreA = a.score + (a.comments?.length || 0) * 2;
            const scoreB = b.score + (b.comments?.length || 0) * 2;
            const ageA = Date.now() - new Date(a.createdAt).getTime();
            const ageB = Date.now() - new Date(b.createdAt).getTime();
            // Hot algorithm: score / (age in hours + 2)^1.5
            const hotA = scoreA / Math.pow(ageA / 3600000 + 2, 1.5);
            const hotB = scoreB / Math.pow(ageB / 3600000 + 2, 1.5);
            return hotB - hotA;
          });
        } else if (sortBy === 'top') {
          sortedPosts = sortedPosts.sort((a: Post, b: Post) => b.score - a.score);
        }

        setPosts(sortedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortBy, address]);

  const fetchUserTrust = useCallback(async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/trust?wallet=${address}`);
      const data = await response.json();
      if (data.success) {
        setUserTrust(data.data);
      }
    } catch (error) {
      console.error('Error fetching user trust:', error);
    }
  }, [address]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchUserTrust();
  }, [fetchUserTrust]);

  const handleVoteUpdate = (postId: string, upvotes: number, downvotes: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, upvotes, downvotes, score: upvotes - downvotes } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-500" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Web3 Forum
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowPostForm(true)}
                disabled={!isConnected}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規投稿
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* User Trust Card */}
        {isConnected && userTrust && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 p-4 h-full">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      <span className="font-medium text-white">あなたの信頼性スコア</span>
                      <TrustBadge
                        trustLevel={userTrust.trustLevel}
                        totalPoints={userTrust.totalPoints}
                        showPoints
                      />
                    </div>
                    <TrustProgress currentPoints={userTrust.totalPoints} />
                  </div>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{userTrust.correctCount}</div>
                      <div className="text-xs text-gray-500">正解</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{userTrust.incorrectCount}</div>
                      <div className="text-xs text-gray-500">不正解</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{userTrust.pendingCount}</div>
                      <div className="text-xs text-gray-500">判定待ち</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <SBTMigration
                userWallet={address || ''}
                userTrust={userTrust}
                onMigrationComplete={fetchUserTrust}
              />
            </div>
          </div>
        )}

        {/* Category & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={
                selectedCategory === 'all'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }
            >
              🌐 すべて
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className={
                  selectedCategory === cat.name
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }
              >
                {cat.icon} {cat.label}
              </Button>
            ))}
            {/* Create Category Button */}
            {isConnected && (
              <CreateCategoryDialog
                userWallet={address || ''}
                onCategoryCreated={() => {
                  fetchCategories();
                }}
              />
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <TabsList className="bg-gray-800/50 border border-gray-700">
                <TabsTrigger
                  value="hot"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Flame className="h-3 w-3 mr-1" />
                  人気
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  新着
                </TabsTrigger>
                <TabsTrigger
                  value="top"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  トップ
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 p-4 mb-6">
            <p className="text-gray-300 text-sm">
              💡 投稿や投票を行うには、右上の「ウォレット接続」ボタンからMetaMask等のウォレットを接続してください。
            </p>
          </Card>
        )}

        {/* System Info */}
        <Card className="bg-gray-800/30 border-gray-700/50 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">信頼性スコアシステム</h3>
              <p className="text-sm text-gray-400">
                「予測・主張」として投稿すると、他のユーザーが「正解」「不正解」で判定できます。
                正解判定されると信頼性スコアが上昇し、レベルアップ！
                あなたの発言の信頼性をSBT（Soulbound Token）風に記録します。
              </p>
            </div>
          </div>
        </Card>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700/50 p-4">
                <div className="animate-pulse flex gap-4">
                  <div className="w-12 h-20 bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700/50 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              投稿がありません
            </h3>
            <p className="text-gray-500 text-sm">
              {isConnected
                ? '最初の投稿をしてみましょう！'
                : 'ウォレットを接続して投稿を始めましょう'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                categories={categories}
                voterWallet={address}
                onClick={() => setSelectedPostId(post.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Post Form Dialog */}
      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">新しい投稿を作成</DialogTitle>
          </DialogHeader>
          <PostForm
            authorWallet={address || ''}
            categories={categories}
            onSubmitSuccess={() => {
              setShowPostForm(false);
              fetchPosts();
            }}
            onCancel={() => setShowPostForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <PostDetail
        postId={selectedPostId}
        userWallet={address}
        categories={categories}
        onClose={() => setSelectedPostId(null)}
        onVoteUpdate={handleVoteUpdate}
      />
    </div>
  );
}
