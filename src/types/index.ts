export interface Post {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  category: string;
  authorWallet: string;
  upvotes: number;
  downvotes: number;
  score: number;
  isPrediction: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  votes?: Vote[];
  prediction?: Prediction;
  userTrust?: UserTrust;
}

export interface Comment {
  id: string;
  content: string;
  imageUrl: string | null;
  authorWallet: string;
  postId: string;
  parentId: string | null;
  isPrediction: boolean;
  createdAt: string;
  updatedAt: string;
  prediction?: Prediction;
  userTrust?: UserTrust;
}

export interface Vote {
  id: string;
  postId: string;
  voterWallet: string;
  voteType: number;
}

export interface UserTrust {
  id: string;
  wallet: string;
  totalPoints: number;
  correctCount: number;
  incorrectCount: number;
  pendingCount: number;
  trustLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  content: string;
  authorWallet: string;
  postId: string | null;
  commentId: string | null;
  deadline: string | null;
  status: 'pending' | 'correct' | 'incorrect';
  correctVotes: number;
  incorrectVotes: number;
  totalVerifiers: number;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userVerification?: Verification;
}

export interface Verification {
  id: string;
  predictionId: string;
  verifierWallet: string;
  result: 'correct' | 'incorrect';
  verifierTrust: number;
  createdAt: string;
}

// カテゴリインターフェース
export interface Category {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  authorWallet: string;
  isDefault: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

// デフォルトカテゴリ定義
export const DEFAULT_CATEGORIES = [
  { name: 'General', label: '一般', description: '一般的な話題・議論', icon: '💬', color: 'gray' },
  { name: 'Crypto', label: '暗号資産', description: 'ビットコイン・アルトコイン等', icon: '₿', color: 'orange' },
  { name: 'NFT', label: 'NFT', description: 'NFTアート・コレクション', icon: '🎨', color: 'purple' },
  { name: 'DeFi', label: 'DeFi', description: '分散型金融・イールド', icon: '💰', color: 'green' },
  { name: 'Gaming', label: 'GameFi', description: 'ブロックチェーンゲーム', icon: '🎮', color: 'blue' },
  { name: 'Trading', label: 'トレード', description: '相場予測・テクニカル分析', icon: '📈', color: 'cyan' },
  { name: 'Technology', label: 'テクノロジー', description: '技術議論・開発', icon: '⚙️', color: 'slate' },
  { name: 'Airdrop', label: 'エアドロップ', description: 'エアドロップ情報・戦略', icon: '🎁', color: 'pink' },
  { name: 'Layer2', label: 'Layer2', description: 'L2・スケーリングソリューション', icon: '⚡', color: 'yellow' },
  { name: 'DAO', label: 'DAO', description: 'DAO・ガバナンス', icon: '🏛️', color: 'indigo' },
  { name: 'Security', label: 'セキュリティ', description: 'セキュリティ・詐欺警告', icon: '🛡️', color: 'red' },
  { name: 'News', label: 'ニュース', description: '速報・ニュース共有', icon: '📰', color: 'emerald' },
  { name: 'Q&A', label: '質問', description: '質問・回答', icon: '❓', color: 'violet' },
  { name: 'Tutorial', label: 'チュートリアル', description: '使い方・ガイド', icon: '📚', color: 'amber' },
  { name: 'OffTopic', label: '雑談', description: '雑談・オフトピック', icon: '🎯', color: 'teal' },
  { name: 'ZEN', label: 'ZEN', description: 'ZEN・禅・マインドフルネス', icon: '🧘', color: 'lime' },
  { name: 'ZEN_STATE', label: 'ZEN STATE', description: 'ZEN STATE・意識状態', icon: '🌟', color: 'fuchsia' },
  { name: 'NETWORK_STATE', label: 'NETWORK STATE', description: 'ネットワーク国家・分散型社会', icon: '🌐', color: 'sky' },
] as const;

export type DefaultCategoryName = typeof DEFAULT_CATEGORIES[number]['name'];

export interface CreatePostRequest {
  title: string;
  content?: string;
  imageUrl?: string;
  category: string;
  authorWallet: string;
  isPrediction?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  imageUrl?: string;
  authorWallet: string;
  postId: string;
  parentId?: string;
  isPrediction?: boolean;
}

export interface VoteRequest {
  postId: string;
  voterWallet: string;
  voteType: 1 | -1;
}

export interface CreatePredictionRequest {
  content: string;
  authorWallet: string;
  postId?: string;
  commentId?: string;
  deadline?: string;
}

export interface VerifyPredictionRequest {
  predictionId: string;
  verifierWallet: string;
  result: 'correct' | 'incorrect';
}

export interface CreateCategoryRequest {
  name: string;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  authorWallet: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Trust Level definitions
export const TRUST_LEVELS = {
  1: { name: '新規ユーザー', minPoints: 0, maxPoints: 99, color: 'gray', icon: '🌱' },
  2: { name: '見習い', minPoints: 100, maxPoints: 499, color: 'bronze', icon: '🥉' },
  3: { name: '信頼できる', minPoints: 500, maxPoints: 999, color: 'silver', icon: '🥈' },
  4: { name: '専門家', minPoints: 1000, maxPoints: 2499, color: 'gold', icon: '🥇' },
  5: { name: '予言者', minPoints: 2500, maxPoints: Infinity, color: 'purple', icon: '👑' },
} as const;

export type TrustLevelInfo = typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS];

// Calculate trust level from points
export function calculateTrustLevel(points: number): number {
  if (points >= 2500) return 5;
  if (points >= 1000) return 4;
  if (points >= 500) return 3;
  if (points >= 100) return 2;
  return 1;
}

// Get trust level info
export function getTrustLevelInfo(level: number): TrustLevelInfo {
  return TRUST_LEVELS[level as keyof typeof TRUST_LEVELS] || TRUST_LEVELS[1];
}

// カテゴリの色マッピング
export const CATEGORY_COLORS: Record<string, string> = {
  gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  slate: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  lime: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

export function getCategoryColorClass(color: string): string {
  return CATEGORY_COLORS[color] || CATEGORY_COLORS.gray;
}
