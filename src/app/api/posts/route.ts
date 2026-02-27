import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPrediction, getOrCreateUserTrust } from '@/lib/trust';

// GET /api/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const wallet = searchParams.get('wallet');

    const where = {
      ...(category && category !== 'all' ? { category } : {}),
    };

    const posts = await db.post.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
    });

    // Get all unique author wallets
    const authorWallets = [...new Set(posts.map(p => p.authorWallet))];

    // Fetch trust info for all authors
    const trustMap: Record<string, { trustLevel: number; totalPoints: number }> = {};
    for (const walletAddr of authorWallets) {
      const trust = await getOrCreateUserTrust(walletAddr);
      trustMap[walletAddr] = {
        trustLevel: trust.trustLevel,
        totalPoints: trust.totalPoints,
      };
    }

    // Transform posts to include user's vote and trust info
    const transformedPosts = posts.map(post => ({
      ...post,
      userVote: post.votes?.[0]?.voteType ?? 0,
      userTrust: trustMap[post.authorWallet],
      prediction: post.prediction ? {
        ...post.prediction,
        userVerification: post.prediction.verifications?.[0] || null,
        verifications: undefined,
      } : null,
      votes: undefined,
    }));

    return NextResponse.json({ success: true, data: transformedPosts });
  } catch (error: unknown) {
    console.error('Error fetching posts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: '投稿の取得に失敗しました', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, imageUrl, category, authorWallet, isPrediction } = body;

    console.log('Creating post:', { title, category, authorWallet, isPrediction });

    if (!title || !category || !authorWallet) {
      return NextResponse.json(
        { success: false, error: 'タイトル、カテゴリ、ウォレットアドレスは必須です' },
        { status: 400 }
      );
    }

    // Create post
    const post = await db.post.create({
      data: {
        title,
        content: content || null,
        imageUrl: imageUrl || null,
        category,
        authorWallet,
        isPrediction: isPrediction || false,
        upvotes: 0,
        downvotes: 0,
        score: 0,
      },
    });

    // If it's a prediction, create prediction record
    if (isPrediction) {
      await createPrediction(
        title + (content ? `\n\n${content}` : ''),
        authorWallet,
        post.id,
        undefined,
        undefined
      );
    }

    // Ensure user trust record exists
    await getOrCreateUserTrust(authorWallet);

    console.log('Post created successfully:', post.id);
    return NextResponse.json({ success: true, data: post });
  } catch (error: unknown) {
    console.error('Error creating post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: '投稿の作成に失敗しました', details: errorMessage },
      { status: 500 }
    );
  }
}
