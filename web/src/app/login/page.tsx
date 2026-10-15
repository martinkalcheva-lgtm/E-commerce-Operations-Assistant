import Link from "next/link";

import { AppHeader, BrandMark } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 渲染登录页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const expired = Array.isArray(params.expired) ? params.expired[0] : params.expired;
  // /login/submit 把任何凭据失败都归为 ?error=1；页面不区分「邮箱不存在」与「密码错误」。
  const failed = Boolean(error);

  return (
    <div className="app">
      {/* 登录页是唯一未鉴权入口，因此不暴露产品导航 */}
      <AppHeader current={null} sub="SIGN IN">
        <span className="badge">公开入口 · 未鉴权</span>
      </AppHeader>

      <main className="app-body">
        <div className="pane">
          <div className="wrap">

            <section className="sec" id="signin">
              <div className="login-grid">

                {/* 左：门面说明（登录页是唯一公开入口，必须自证可信） */}
                <aside className="panel panel-inverted trust">
                  <div className="panel-body">
                    <span className="eyebrow">Operator Access</span>
                    <div className="trust-brand">
                      <span className="mark-slot" aria-hidden="true"><BrandMark /></span>
                      <span>
                        <b>运营智能体</b>
                        <span className="mono">ECOMMERCE OPERATIONS AGENT</span>
                      </span>
                    </div>
                    <p className="prose">
                      统一运营工作台的唯一公开入口。登录后可进入多平台店铺运营工作台，
                      商品、库存与运营任务都挂在账号有权限的店铺下。
                    </p>

                    <hr className="hair" />
                    <span className="eyebrow">本页安全边界</span>
                    <ul className="trust-list">
                      <li>
                        <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                        <span>页面不渲染任何账号、口令或口令片段；演示凭据一律向管理员线下获取。</span>
                      </li>
                      <li>
                        <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                        <span>密码字段 type=password，不回显、不进入前端状态、不写入日志。</span>
                      </li>
                      <li>
                        <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                        <span>失败提示不区分「邮箱不存在」与「密码错误」，避免账号枚举。</span>
                      </li>
                      <li>
                        <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                        <span>令牌只落在 httpOnly + SameSite=Lax Cookie 上，前端脚本读不到。</span>
                      </li>
                    </ul>

                    <hr className="hair" />
                    <span className="eyebrow">认证链路</span>
                    <ol className="trust-flow">
                      <li><span className="mono">POST /login/submit</span><span className="desc">表单提交（Next.js route handler）</span></li>
                      <li><span className="mono">POST /api/v1/auth/login</span><span className="desc">转发给 FastAPI，返回 access_token</span></li>
                      <li><span className="mono">Set-Cookie · httpOnly</span><span className="desc">SameSite=Lax · Path=/ · 服务端统一附加 Authorization</span></li>
                      <li><span className="mono">302 → /</span><span className="desc">进入业务工作台</span></li>
                    </ol>
                  </div>
                </aside>

                {/* 右：登录卡 */}
                <div className="panel card-signin">
                  <div className="panel-body">
                    <div className="id-row">
                      <span className="brand-badge mark-slot" aria-hidden="true"><BrandMark /></span>
                      <div>
                        <p className="who">电商运营助手 · 运营智能体</p>
                        <h1>登录工作台</h1>
                      </div>
                    </div>

                    <div className="cred-note">
                      <svg className="ic" aria-hidden="true"><use href="#i-doc"></use></svg>
                      <div>
                        <b>演示凭据</b>
                        <p>演示账号请向管理员获取。页面中不含任何账号、口令或可登录凭据。</p>
                      </div>
                    </div>

                    {failed ? (
                      <div className="alert is-error mt-3" role="alert">
                        <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                        <div>
                          <b>邮箱与密码组合不正确，或账号已停用</b>
                          <p>为避免账号枚举，这里不区分「邮箱不存在」与「密码错误」。按顺序自查：</p>
                          <ul>
                            <li>密码区分大小写：确认未开启大写锁定，输入法处于英文 / 半角状态。</li>
                            <li>浏览器密码管理器可能回填了旧密码：清空后手动输入一次。</li>
                            <li>仍失败请联系管理员核对账号状态（停用账号无法登录）。</li>
                          </ul>
                        </div>
                      </div>
                    ) : null}

                    {expired ? (
                      <div className="alert is-info mt-3" role="status">
                        <svg className="ic" aria-hidden="true"><use href="#i-server"></use></svg>
                        <div>
                          <b>登录状态已过期，请重新登录</b>
                          <p>原会话已被服务端判定失效，本次操作未提交，重新登录后可继续。</p>
                        </div>
                      </div>
                    ) : null}

                    <LoginForm failed={failed} />

                    <Link href="/" className="back-link">
                      <svg className="ic ic-sm" aria-hidden="true"><use href="#i-chev"></use></svg>返回业务工作台
                    </Link>

                    <p className="login-foot">
                      失败时不区分具体字段 · 成功后 302 到 / · 会话写入 httpOnly Cookie
                    </p>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
