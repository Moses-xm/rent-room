import type { Metadata } from "next";
import { ManageLayoutShell } from "@/components/ManageLayoutShell";

export const metadata: Metadata = {
  title: "雅阁后台管理",
  description: "雅阁租房系统后端支撑，处理房源分配、合约归档与账单。",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManageLayoutShell>{children}</ManageLayoutShell>;
}
