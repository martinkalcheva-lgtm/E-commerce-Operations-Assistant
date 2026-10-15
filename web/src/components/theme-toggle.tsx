"use client";

import { useEffect, useState } from "react";

/**
 * 明暗主题切换按钮。
 * 与 icons.js 的 bootTheme 约定同一存储键（hzj-theme）、同一开关属性（data-theme），
 * 但不占用 id="themeBtn"，避免与 icons.js 内置绑定叠加成双次切换。
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("hzj-theme", next ? "dark" : "light");
    } catch {
      // localStorage 不可用（隐私模式等）时静默降级为仅本次会话生效。
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={toggleTheme} aria-label="切换明暗主题">
      <svg className="ic ic-sm" aria-hidden="true" focusable="false">
        <use href="#i-chev" />
      </svg>
      主题
    </button>
  );
}
