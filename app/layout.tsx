import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "雅阁租房系统",
  description: "专业的租房服务平台，为您提供高品质的租房体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
