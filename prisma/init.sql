-- Web3 Forum Database Schema for Neon PostgreSQL
-- Run this in Neon SQL Editor

-- Posts table
CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,
    "authorWallet" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isPrediction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- Comments table
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorWallet" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "isPrediction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Votes table
CREATE TABLE IF NOT EXISTS "Vote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "voterWallet" TEXT NOT NULL,
    "voteType" INTEGER NOT NULL,
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- UserTrust table
CREATE TABLE IF NOT EXISTS "UserTrust" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserTrust_pkey" PRIMARY KEY ("id")
);

-- Prediction table
CREATE TABLE IF NOT EXISTS "Prediction" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorWallet" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "correctVotes" INTEGER NOT NULL DEFAULT 0,
    "incorrectVotes" INTEGER NOT NULL DEFAULT 0,
    "totalVerifiers" INTEGER NOT NULL DEFAULT 0,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- Verification table
CREATE TABLE IF NOT EXISTS "Verification" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "verifierWallet" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "verifierTrust" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- Category table
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📁',
    "color" TEXT NOT NULL DEFAULT 'gray',
    "authorWallet" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Post_category_idx" ON "Post"("category");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "Post_score_idx" ON "Post"("score");
CREATE INDEX IF NOT EXISTS "Post_isPrediction_idx" ON "Post"("isPrediction");

CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment"("createdAt");
CREATE INDEX IF NOT EXISTS "Comment_isPrediction_idx" ON "Comment"("isPrediction");

CREATE UNIQUE INDEX IF NOT EXISTS "Vote_postId_voterWallet_key" ON "Vote"("postId", "voterWallet");
CREATE INDEX IF NOT EXISTS "Vote_postId_idx" ON "Vote"("postId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserTrust_wallet_key" ON "UserTrust"("wallet");
CREATE INDEX IF NOT EXISTS "UserTrust_wallet_idx" ON "UserTrust"("wallet");
CREATE INDEX IF NOT EXISTS "UserTrust_trustLevel_idx" ON "UserTrust"("trustLevel");
CREATE INDEX IF NOT EXISTS "UserTrust_totalPoints_idx" ON "UserTrust"("totalPoints");

CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_postId_key" ON "Prediction"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_commentId_key" ON "Prediction"("commentId");
CREATE INDEX IF NOT EXISTS "Prediction_authorWallet_idx" ON "Prediction"("authorWallet");
CREATE INDEX IF NOT EXISTS "Prediction_status_idx" ON "Prediction"("status");
CREATE INDEX IF NOT EXISTS "Prediction_createdAt_idx" ON "Prediction"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Verification_predictionId_verifierWallet_key" ON "Verification"("predictionId", "verifierWallet");
CREATE INDEX IF NOT EXISTS "Verification_predictionId_idx" ON "Verification"("predictionId");
CREATE INDEX IF NOT EXISTS "Verification_verifierWallet_idx" ON "Verification"("verifierWallet");

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Category_authorWallet_idx" ON "Category"("authorWallet");
CREATE INDEX IF NOT EXISTS "Category_postCount_idx" ON "Category"("postCount");

-- Foreign keys
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_authorWallet_fkey" FOREIGN KEY ("authorWallet") REFERENCES "UserTrust"("wallet") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_verifierWallet_fkey" FOREIGN KEY ("verifierWallet") REFERENCES "UserTrust"("wallet") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default categories
INSERT INTO "Category" ("id", "name", "label", "description", "icon", "color", "authorWallet", "isDefault", "postCount", "createdAt", "updatedAt")
VALUES
  ('cat_001', 'General', '一般', '一般的な話題・議論', '💬', 'gray', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_002', 'Crypto', '暗号資産', 'ビットコイン・アルトコイン等', '₿', 'orange', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_003', 'NFT', 'NFT', 'NFTアート・コレクション', '🎨', 'purple', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_004', 'DeFi', 'DeFi', '分散型金融・イールド', '💰', 'green', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_005', 'Gaming', 'GameFi', 'ブロックチェーンゲーム', '🎮', 'blue', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_006', 'Trading', 'トレード', '相場予測・テクニカル分析', '📈', 'cyan', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_007', 'Technology', 'テクノロジー', '技術議論・開発', '⚙️', 'slate', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_008', 'Airdrop', 'エアドロップ', 'エアドロップ情報・戦略', '🎁', 'pink', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_009', 'Layer2', 'Layer2', 'L2・スケーリングソリューション', '⚡', 'yellow', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_010', 'DAO', 'DAO', 'DAO・ガバナンス', '🏛️', 'indigo', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_011', 'Security', 'セキュリティ', 'セキュリティ・詐欺警告', '🛡️', 'red', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_012', 'News', 'ニュース', '速報・ニュース共有', '📰', 'emerald', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_013', 'Q&A', '質問', '質問・回答', '❓', 'violet', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_014', 'Tutorial', 'チュートリアル', '使い方・ガイド', '📚', 'amber', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_015', 'OffTopic', '雑談', '雑談・オフトピック', '🎯', 'teal', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_016', 'ZEN', 'ZEN', 'ZEN・禅・マインドフルネス', '🧘', 'lime', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_017', 'ZEN_STATE', 'ZEN STATE', 'ZEN STATE・意識状態', '🌟', 'fuchsia', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_018', 'NETWORK_STATE', 'NETWORK STATE', 'ネットワーク国家・分散型社会', '🌐', 'sky', 'system', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
