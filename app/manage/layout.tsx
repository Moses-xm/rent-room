import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "雅阁租房 - 管理平台",
  description: "雅阁租房系统管理后台，房源、租客与合同一站式管理",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
