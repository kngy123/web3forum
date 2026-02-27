'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImagePlus, X, Loader2, Target, Info } from 'lucide-react';
import type { Category } from '@/types';
import { getCategoryColorClass } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PostFormProps {
  authorWallet: string;
  categories: Category[];
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function PostForm({ authorWallet, categories, onSubmitSuccess, onCancel }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPrediction, setIsPrediction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!category) {
      setError('カテゴリを選択してください');
      return;
    }

    if (!authorWallet) {
      setError('ウォレットを接続してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || null,
          imageUrl,
          category,
          authorWallet,
          isPrediction,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTitle('');
        setContent('');
        setCategory('');
        setImageUrl(null);
        setIsPrediction(false);
        onSubmitSuccess?.();
      } else {
        setError(data.error || '投稿に失敗しました');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">
          タイトル <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="投稿のタイトルを入力"
          className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-gray-300">
          カテゴリ <span className="text-red-400">*</span>
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
            {categories.map((cat) => (
              <SelectItem
                key={cat.id}
                value={cat.name}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-gray-500 text-xs">- {cat.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-gray-300">
          内容
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="投稿の内容を入力（任意）"
          className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 min-h-[120px]"
          maxLength={5000}
        />
      </div>

      {/* Prediction Checkbox */}
      <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <Checkbox
          id="prediction"
          checked={isPrediction}
          onCheckedChange={(checked) => setIsPrediction(checked as boolean)}
          className="border-purple-500 data-[state=checked]:bg-purple-600"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="prediction"
              className="text-purple-300 font-medium cursor-pointer flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              予測・主張として投稿
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <p className="text-sm">
                    予測・主張として投稿すると、他のユーザーが「正解」「不正解」で判定できます。
                    正解判定されると信頼性スコアが上がり、不正解だと下がります。
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            チェックすると、この投稿は予測として扱われ、信頼性スコアに影響します。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">画像</Label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            画像を追加
          </Button>
          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="プレビュー"
                className="h-16 w-16 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">最大5MB、JPG/PNG/GIF対応</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              投稿中...
            </>
          ) : (
            '投稿する'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
