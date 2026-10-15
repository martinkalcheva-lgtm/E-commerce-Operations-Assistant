"use client";

import { useEffect, useState } from "react";

import { X } from "lucide-react";

const STORAGE_PREFIX = "dismissed-error:";

/** 可关闭的红色错误提示：左上角 ✕ 点击后隐藏，并把关闭状态记入 localStorage，刷新页面后不再复活。 */
export function DismissibleError({ id, message }: { id: string; message: string }) {
  const [dismissed, setDismissed] = useState(false);

  // 挂载后读取本地记忆，保证服务端渲染与首屏水合不受影响。
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_PREFIX + id) === "1") {
        setDismissed(true);
      }
    } catch {
      // localStorage 不可用（隐私模式等）时降级为仅本次会话内隐藏。
    }
  }, [id]);

  if (dismissed) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_PREFIX + id, "1");
    } catch {
      // 同上，写入失败不影响界面关闭。
    }
  };

  return (
    <div className="relative rounded-md border border-rose-200 bg-rose-50 py-2 pl-8 pr-3 text-xs leading-5 text-rose-700">
      <button
        type="button"
        onClick={dismiss}
        aria-label="关闭错误提示"
        title="关闭（刷新后保持隐藏）"
        className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-rose-400 transition hover:bg-rose-100 hover:text-rose-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {message}
    </div>
  );
}
