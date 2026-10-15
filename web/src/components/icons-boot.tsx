"use client";

import { useEffect } from "react";

/**
 * 客户端加载 icons.js（IIFE，注入图标 sprite + 主题记忆 + reveal 观察）。
 * icons.js 依赖 document，必须避免在服务端执行，因此放进 effect 里动态 import。
 * <html> 的 class="js" 在根布局上静态给出（.reveal 进场依赖它）。
 */
export function IconsBoot() {
  useEffect(() => {
    void import("@/styles/icons.js");
  }, []);
  return null;
}
