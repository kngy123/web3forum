-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('pending', 'correct', 'incorrect');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('correct', 'incorrect');

-- CreateTable
CREATE TABLE "Post" (
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

-- CreateTable
CREATE TABLE "Comment" (
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

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "voterWallet" TEXT NOT NULL,
    "voteType" INTEGER NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrust" (
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

-- CreateTable
CREATE TABLE "Prediction" (
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

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "verifierWallet" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "verifierTrust" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
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

-- CreateIndex
CREATE INDEX "Post_category_idx" ON "Post"("category");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_score_idx" ON "Post"("score");

-- CreateIndex
CREATE INDEX "Post_isPrediction_idx" ON "Post"("isPrediction");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_isPrediction_idx" ON "Comment"("isPrediction");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_postId_voterWallet_key" ON "Vote"("postId", "voterWallet");

-- CreateIndex
CREATE INDEX "Vote_postId_idx" ON "Vote"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrust_wallet_key" ON "UserTrust"("wallet");

-- CreateIndex
CREATE INDEX "UserTrust_wallet_idx" ON "UserTrust"("wallet");

-- CreateIndex
CREATE INDEX "UserTrust_trustLevel_idx" ON "UserTrust"("trustLevel");

-- CreateIndex
CREATE INDEX "UserTrust_totalPoints_idx" ON "UserTrust"("totalPoints");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_postId_key" ON "Prediction"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_commentId_key" ON "Prediction"("commentId");

-- CreateIndex
CREATE INDEX "Prediction_authorWallet_idx" ON "Prediction"("authorWallet");

-- CreateIndex
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_predictionId_verifierWallet_key" ON "Verification"("predictionId", "verifierWallet");

-- CreateIndex
CREATE INDEX "Verification_predictionId_idx" ON "Verification"("predictionId");

-- CreateIndex
CREATE INDEX "Verification_verifierWallet_idx" ON "Verification"("verifierWallet");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_authorWallet_idx" ON "Category"("authorWallet");

-- CreateIndex
CREATE INDEX "Category_postCount_idx" ON "Category"("postCount");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_authorWallet_fkey" FOREIGN KEY ("authorWallet") REFERENCES "UserTrust"("wallet") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_verifierWallet_fkey" FOREIGN KEY ("verifierWallet") REFERENCES "UserTrust"("wallet") ON DELETE SET NULL ON UPDATE CASCADE;
