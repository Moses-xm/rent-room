import type { Metadata } from "next";
import { DM_Sans, Cormorant } from "next/font/google";
import "@/styles/themes/manage.css";
import { ManageLayoutShell } from "@/components/ManageLayoutShell";

// DM Sans：manage 平台正文字体（拉丁字符），中文由 PingFang SC 兜底
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Cormorant：manage 平台衬线标题字体（拉丁字符），中文由 Noto Serif SC 兜底
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "雅阁后台管理",
  description: "雅阁租房系统后端支撑，处理房源分配、合约归档与账单。",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-platform 触发 manage.css 中 [data-platform="manage"] 作用域
    // font variable 类将 --font-dm-sans / --font-cormorant 注入此子树
    <div
      data-platform="manage"
      className={`${dmSans.variable} ${cormorant.variable}`}
    >
      <ManageLayoutShell>{children}</ManageLayoutShell>
    </div>
  );
}
