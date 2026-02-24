import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, imageUrl, authorWallet, postId, parentId } = body;

    if (!content || !authorWallet || !postId) {
      return NextResponse.json(
        { success: false, error: 'コメント内容、ウォレットアドレス、投稿IDは必須です' },
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

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: '親コメントが見つかりません' },
          { status: 404 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        authorWallet,
        postId,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'コメントの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// GET /api/comments - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '投稿IDは必須です' },
        { status: 400 }
      );
    }

    const comments = await db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'コメントの取得に失敗しました' },
      { status: 500 }
    );
  }
}
