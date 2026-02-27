import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
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
];

async function main() {
  console.log('Seeding categories...');

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        label: category.label,
        description: category.description,
        icon: category.icon,
        color: category.color,
        authorWallet: 'system',
        isDefault: true,
      },
    });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
