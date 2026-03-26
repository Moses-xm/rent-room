import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "雅阁租房 - 客户端",
  description: "雅阁租房客户端平台，轻松找到心仪房源",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
