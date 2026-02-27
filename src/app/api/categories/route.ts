import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/types';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    // データベースからカテゴリを取得
    let categories = await db.category.findMany({
      orderBy: [{ isDefault: 'desc' }, { postCount: 'desc' }, { createdAt: 'asc' }],
    });

    // カテゴリが存在しない場合はデフォルトカテゴリを作成
    if (categories.length === 0) {
      console.log('No categories found, seeding default categories...');
      const defaultCategories = DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        label: cat.label,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        authorWallet: 'system',
        isDefault: true,
      }));

      await db.category.createMany({
        data: defaultCategories,
      });

      categories = await db.category.findMany({
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'カテゴリの取得に失敗しました', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, label, description, icon, color, authorWallet } = body;

    console.log('Creating category:', { name, label, description, authorWallet });

    if (!name || !label || !description || !authorWallet) {
      return NextResponse.json(
        { success: false, error: '名前、ラベル、説明、ウォレットアドレスは必須です' },
        { status: 400 }
      );
    }

    // 名前の形式チェック（英数字とアンダースコアのみ）
    const nameRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        {
          success: false,
          error: 'カテゴリ名は大文字英数字とアンダースコアのみ使用可能で、大文字で始める必要があります',
        },
        { status: 400 }
      );
    }

    // 既存カテゴリチェック
    const existing = await db.category.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'このカテゴリ名は既に使用されています' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        label,
        description,
        icon: icon || '📁',
        color: color || 'gray',
        authorWallet,
        isDefault: false,
      },
    });

    console.log('Category created successfully:', category.id);
    return NextResponse.json({ success: true, data: category });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'カテゴリの作成に失敗しました', details: errorMessage },
      { status: 500 }
    );
  }
}
