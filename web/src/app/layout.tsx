import type { Metadata } from "next";
import "./globals.css";

import { IconsBoot } from "@/components/icons-boot";

export const metadata: Metadata = {
  title: "电商运营助手",
  description: "AI 单品运营工作台",
};

/** 首帧前同步主题：读取 icons.js 约定的 hzj-theme 键，避免深色用户看到浅色闪烁。 */
const themeBootScript = `try{var t=localStorage.getItem('hzj-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

/** 渲染 RootLayout 组件，集中展示根布局所需的数据、状态和操作入口。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="js h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* 主题预置脚本必须先于页面内容执行，避免明暗主题首帧闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
        <IconsBoot />
      </body>
    </html>
  );
}
