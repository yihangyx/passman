import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassMan - 密码管理器",
  description: "安全的密码管理工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}