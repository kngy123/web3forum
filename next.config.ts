import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // React設定
  reactStrictMode: false,
  
  // Turbopack設定（空でOK）
  turbopack: {},
  
  // 実験的機能
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // 画像最適化（無効化）
  images: {
    unoptimized: true,
  },
  
  // ヘッダー設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
