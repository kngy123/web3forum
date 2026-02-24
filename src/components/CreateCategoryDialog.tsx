'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, FolderPlus } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

interface CreateCategoryDialogProps {
  userWallet: string;
  onCategoryCreated?: () => void;
}

const AVAILABLE_COLORS = [
  { name: 'グレー', value: 'gray' },
  { name: 'オレンジ', value: 'orange' },
  { name: 'パープル', value: 'purple' },
  { name: 'グリーン', value: 'green' },
  { name: 'ブルー', value: 'blue' },
  { name: 'シアン', value: 'cyan' },
  { name: 'ピンク', value: 'pink' },
  { name: 'イエロー', value: 'yellow' },
  { name: 'インディゴ', value: 'indigo' },
  { name: 'レッド', value: 'red' },
  { name: 'バイオレット', value: 'violet' },
  { name: 'ライム', value: 'lime' },
  { name: 'フクシア', value: 'fuchsia' },
  { name: 'スカイ', value: 'sky' },
];

const AVAILABLE_ICONS = [
  '📁', '💬', '💡', '🔥', '⭐', '🚀', '🎯', '💎', '🌟', '✨',
  '🔮', '🌈', '🎨', '🎵', '📚', '🔬', '🌍', '🧘', '🌸', '🍀',
];

export function CreateCategoryDialog({ userWallet, onCategoryCreated }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('gray');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }

    if (!label.trim()) {
      setError('表示名を入力してください');
      return;
    }

    if (!description.trim()) {
      setError('説明を入力してください');
      return;
    }

    if (!userWallet) {
      setError('ウォレットを接続してください');
      return;
    }

    // 名前の形式チェック
    const nameRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!nameRegex.test(name)) {
      setError('カテゴリ名は大文字英数字とアンダースコアのみ使用可能で、大文字で始める必要があります（例: MY_CATEGORY）');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          label: label.trim(),
          description: description.trim(),
          icon,
          color,
          authorWallet: userWallet,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setName('');
        setLabel('');
        setDescription('');
        setIcon('📁');
        setColor('gray');
        setOpen(false);
        onCategoryCreated?.();
      } else {
        setError(data.error || 'カテゴリの作成に失敗しました');
      }
    } catch (err) {
      console.error('Create category error:', err);
      setError('カテゴリの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <FolderPlus className="h-4 w-4 mr-1" />
          新規カテゴリ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">新しいカテゴリを作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-300">カテゴリ名（英語）<span className="text-red-400">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="例: MY_CATEGORY"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              maxLength={30}
            />
            <p className="text-xs text-gray-500">大文字英数字とアンダースコアのみ</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">表示名（日本語）<span className="text-red-400">*</span></Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: マイカテゴリ"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">説明<span className="text-red-400">*</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="カテゴリの説明を入力"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px]"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">アイコン</Label>
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 text-lg rounded ${
                      icon === ic ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">色</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {AVAILABLE_COLORS.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded ${CATEGORY_COLORS[c.value]?.split(' ')[0]}`}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* プレビュー */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">プレビュー:</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-sm ${CATEGORY_COLORS[color]}`}>
                {icon} {label || 'カテゴリ名'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{description || '説明がここに表示されます'}</p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  作成する
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
