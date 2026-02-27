import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3 Forum - Reddit風フォーラム",
  description: "ウォレット接続で参加できるWeb3フォーラム。投稿、コメント、投票機能を備えた分散型コミュニティ。",
  keywords: ["Web3", "Forum", "Reddit", "Crypto", "NFT", "DeFi", "Blockchain"],
  authors: [{ name: "Web3 Forum Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
