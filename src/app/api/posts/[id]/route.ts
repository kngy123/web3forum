import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrCreateUserTrust } from '@/lib/trust';

// GET /api/posts/[id] - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    const post = await db.post.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        votes: wallet
          ? { where: { voterWallet: wallet } }
          : false,
        prediction: {
          include: {
            verifications: wallet
              ? { where: { verifierWallet: wallet } }
              : false,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // Get trust info for author
    const authorTrust = await getOrCreateUserTrust(post.authorWallet);

    // Get trust info for comment authors
    const commentWallets = [...new Set(post.comments.map(c => c.authorWallet))];
    const trustMap: Record<string, { trustLevel: number; totalPoints: number }> = {};
    for (const w of commentWallets) {
      const trust = await getOrCreateUserTrust(w);
      trustMap[w] = {
        trustLevel: trust.trustLevel,
        totalPoints: trust.totalPoints,
      };
    }

    // Transform post to include user's vote and trust info
    const transformedPost = {
      ...post,
      userVote: post.votes?.[0]?.voteType ?? 0,
      userTrust: {
        trustLevel: authorTrust.trustLevel,
        totalPoints: authorTrust.totalPoints,
      },
      prediction: post.prediction ? {
        ...post.prediction,
        userVerification: post.prediction.verifications?.[0] || null,
        verifications: undefined,
      } : null,
      votes: undefined,
      comments: post.comments.map(c => ({
        ...c,
        userTrust: trustMap[c.authorWallet],
      })),
    };

    return NextResponse.json({ success: true, data: transformedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    const post = await db.post.findUnique({
      where: { id },
      select: { authorWallet: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    if (post.authorWallet !== wallet) {
      return NextResponse.json(
        { success: false, error: '削除権限がありません' },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}
