import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "奕涵mua",
  description: "奕涵mua - 安全密码管理",
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