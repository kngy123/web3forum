import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/vote - Vote on a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, voterWallet, voteType } = body;

    if (!postId || !voterWallet || voteType === undefined) {
      return NextResponse.json(
        { success: false, error: '投稿ID、ウォレットアドレス、投票タイプは必須です' },
        { status: 400 }
      );
    }

    // Validate voteType
    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json(
        { success: false, error: '投票タイプは1(upvote)または-1(downvote)である必要があります' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // Check for existing vote
    const existingVote = await db.vote.findUnique({
      where: {
        postId_voterWallet: {
          postId,
          voterWallet,
        },
      },
    });

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Remove vote if same vote type
          await tx.vote.delete({
            where: { id: existingVote.id },
          });

          // Update post counts
          const updatedPost = await tx.post.update({
            where: { id: postId },
            data: {
              upvotes: { decrement: voteType === 1 ? 1 : 0 },
              downvotes: { decrement: voteType === -1 ? 1 : 0 },
              score: { decrement: voteType },
            },
          });

          return { action: 'removed', post: updatedPost };
        } else {
          // Change vote type
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { voteType },
          });

          // Update post counts
          const updatedPost = await tx.post.update({
            where: { id: postId },
            data: {
              upvotes: { increment: voteType === 1 ? 1 : -1 },
              downvotes: { increment: voteType === -1 ? 1 : -1 },
              score: { increment: voteType * 2 }, // e.g., from -1 to 1 is +2
            },
          });

          return { action: 'changed', post: updatedPost };
        }
      } else {
        // Create new vote
        await tx.vote.create({
          data: {
            postId,
            voterWallet,
            voteType,
          },
        });

        // Update post counts
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: {
            upvotes: { increment: voteType === 1 ? 1 : 0 },
            downvotes: { increment: voteType === -1 ? 1 : 0 },
            score: { increment: voteType },
          },
        });

        return { action: 'created', post: updatedPost };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        action: result.action,
        post: result.post,
        userVote: result.action === 'removed' ? 0 : voteType,
      },
    });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { success: false, error: '投票に失敗しました' },
      { status: 500 }
    );
  }
}
