import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

/** 品牌标志《收束》：1 主核 + 4 子模块（与 icons.js 的 OD.MARK 同一图形，SSR 内联）。 */
export function BrandMark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="12" y="12" width="8" height="8" rx="2" />
      <rect x="4" y="4" width="4" height="4" rx="1" />
      <rect x="24" y="4" width="4" height="4" rx="1" />
      <rect x="4" y="24" width="4" height="4" rx="1" />
      <rect x="24" y="24" width="4" height="4" rx="1" />
    </svg>
  );
}

type AppHeaderProps = {
  /** 当前导航项；登录页传 null 隐藏产品导航 */
  current: "workspace" | "imports" | "settings" | "agent" | null;
  /** 品牌名右侧的等宽小字 */
  sub: string;
  /** 登录用户显示名；null 表示未登录 */
  userName?: string | null;
  /** 品牌名是否渲染为 h1（workspace 设计稿把页面主标题放在顶栏品牌位） */
  brandAsH1?: boolean;
  /** 顶栏右侧的额外内容（如登录页的「公开入口」徽标） */
  children?: ReactNode;
};

const navItems = [
  { key: "workspace", href: "/", label: "工作台" },
  { key: "imports", href: "/imports", label: "导入中心" },
  { key: "settings", href: "/settings", label: "模型配置" },
  { key: "agent", href: "/agent", label: "Agent 中心" },
] as const;

/** 渲染 AppHeader 组件，集中展示应用顶栏所需的数据、状态和操作入口。 */
export function AppHeader({ current, sub, userName, brandAsH1 = false, children }: AppHeaderProps) {
  const BrandName = brandAsH1 ? "h1" : "span";
  return (
    <header className="app-top">
      <div className="brand">
        <BrandMark />
        <BrandName>运营智能体</BrandName>
        <span className="sub">{sub}</span>
      </div>

      {current !== null ? (
        <nav aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={current === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="top-actions">
        {children}
        {userName ? (
          <form action="/logout" method="post" className="flex items-center gap-2">
            <span className="badge">{userName}</span>
            <button type="submit" className="btn btn-sm">
              退出
            </button>
          </form>
        ) : (
          <Link href="/login" className="btn btn-sm">
            登录
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
