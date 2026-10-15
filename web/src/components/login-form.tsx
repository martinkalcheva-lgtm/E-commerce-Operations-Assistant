"use client";

import { useRef, useState } from "react";

type LoginFormProps = {
  /** 服务端凭据错误（?error=1）：两个字段标记无效，但不区分具体哪一项错 */
  failed?: boolean;
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** 渲染登录表单：本地字段校验 + 提交中态 + 字段级错误标注；提交仍是原生 POST /login/submit。 */
export function LoginForm({ failed = false }: LoginFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /** 处理提交：本地校验失败时阻止提交并聚焦第一个无效字段；通过后进入提交中态。 */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (submitting) {
      event.preventDefault();
      return;
    }
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = "请输入邮箱地址";
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = "请输入完整邮箱地址，例如 owner@example.com";
    }
    if (!password) {
      errors.password = "请输入密码";
    }
    setFieldErrors(errors);
    if (errors.email) {
      event.preventDefault();
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      event.preventDefault();
      passwordRef.current?.focus();
      return;
    }
    // 校验通过：放行原生表单提交（POST /login/submit），并点亮提交中态。
    setSubmitting(true);
  }

  const emailInvalid = Boolean(fieldErrors.email);
  const passwordInvalid = Boolean(fieldErrors.password);

  return (
    <form action="/login/submit" method="post" className="signin-form" noValidate aria-busy={submitting || undefined}>
      <div className="field">
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          ref={emailRef}
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          spellCheck={false}
          placeholder="owner@example.com"
          disabled={submitting}
          className={`input${emailInvalid || failed ? " is-bad" : ""}`}
          aria-invalid={emailInvalid || undefined}
          aria-describedby={emailInvalid ? "email-msg" : undefined}
        />
        {emailInvalid ? (
          <span className="field-msg is-bad" id="email-msg">{fieldErrors.email}</span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="password">密码</label>
        <div className="input-row">
          <input
            id="password"
            ref={passwordRef}
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="输入密码"
            disabled={submitting}
            className={`input${passwordInvalid || failed ? " is-bad" : ""}`}
            aria-invalid={passwordInvalid || undefined}
            aria-describedby={passwordInvalid ? "password-msg" : undefined}
          />
          <button
            type="button"
            className="btn-reveal"
            aria-pressed={showPassword}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            onClick={() => setShowPassword((value) => !value)}
            disabled={submitting}
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
        {passwordInvalid ? (
          <span className="field-msg is-bad" id="password-msg">{fieldErrors.password}</span>
        ) : null}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={submitting}
        aria-busy={submitting || undefined}
      >
        {submitting ? (
          <>
            <span className="status-led is-busy" aria-hidden="true"></span>
            正在验证凭据
          </>
        ) : failed ? (
          "重新登录"
        ) : (
          "登录"
        )}
      </button>
    </form>
  );
}
