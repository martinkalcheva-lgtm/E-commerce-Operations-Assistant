import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { API_BASE_URL, getCurrentUser, getModelSettings, getUsers } from "@/lib/api";
import { getAuthToken } from "@/lib/session";
import type { UserAccount } from "@/types";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 渲染模型设置页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const token = await getAuthToken();
  const currentUser = token ? await getCurrentUser(token) : null;
  const canEdit = Boolean(currentUser?.permissions.can_edit);
  const canManageUsers = Boolean(currentUser?.permissions.can_manage_users);
  // 用户列表只有具备管理权限时才请求，避免只读/普通运营账号看到成员管理数据。
  const [settings, users] = await Promise.all([getModelSettings(), canManageUsers ? getUsers() : Promise.resolve([])]);
  const params = (await searchParams) ?? {};
  const saveStatus = scalar(params.save);
  const testStatus = scalar(params.status);
  const testTarget = scalar(params.test);
  const testMessage = scalar(params.message);
  const userStatus = scalar(params.user);

  if (!settings) {
    return (
      <div className="app">
        <AppHeader current="settings" sub="MODEL CONFIGURATION" userName={currentUser?.display_name ?? null} />
        <main className="app-body">
          <div className="pane">
            <div className="wrap">

              {/* 降级态：错误细节 + 重试 + 排查指引，不是只甩一句报错 */}
              <div className="state-lede is-warn">
                <svg className="ic ic-lg" aria-hidden="true" style={{ color: "var(--warn)" }}><use href="#i-warn"></use></svg>
                <div>
                  <b>模型配置服务当前不可达 · 已自动降级</b>
                  <span>页面不会只甩一句报错。下面给出错误细节、重试入口与逐步排查指引。</span>
                </div>
              </div>

              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <span className="eyebrow">ERROR DETAIL</span>
                    <h1>读取失败</h1>
                  </div>
                  <span className="mono-note">GET /api/v1/model-settings · 服务端转发</span>
                </div>

                <div className="err-box">
                  <h3>模型配置读取失败</h3>
                  <p>
                    前端服务端无法从后端读取模型配置（接口地址 <span className="mono">{API_BASE_URL}/api/v1/model-settings</span>）。
                    这不是页面问题，通常是后端服务未启动、地址配置错误或网络不通。
                  </p>

                  <div className="trace mt-3">
                    <div className="trace-hd"><span>错误链路</span><span>TRACE</span></div>
                    <div className="trace-step">
                      <span className="trace-dot done" aria-hidden="true"></span>
                      <span>浏览器请求 <span className="mono">GET /settings</span></span>
                      <span className="trace-time">已完成</span>
                    </div>
                    <div className="trace-step">
                      <span className="trace-dot done" aria-hidden="true"></span>
                      <span>前端服务端调用 <span className="mono">getModelSettings()</span></span>
                      <span className="trace-time">已完成</span>
                    </div>
                    <div className="trace-step">
                      <span className="trace-dot run" aria-hidden="true"></span>
                      <span>请求后端 <span className="mono">{API_BASE_URL}/api/v1/model-settings</span> 失败</span>
                      <span className="trace-time">失败</span>
                    </div>
                    <div className="trace-step">
                      <span className="trace-dot skip" aria-hidden="true"></span>
                      <span>页面转入降级态，等待重试</span>
                      <span className="trace-time">—</span>
                    </div>
                  </div>

                  <div className="err-actions">
                    <Link href="/settings" className="btn btn-primary">
                      <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                      重试读取
                    </Link>
                    <Link href="/login" className="btn">重新登录</Link>
                  </div>
                  <p className="guide-hint mt-3">后端恢复后点击「重试读取」即可回到正常配置态；当前页面没有可用的缓存快照（本页未实现配置缓存兜底），无法展示只读数据。</p>
                </div>
              </section>

              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <span className="eyebrow">TROUBLESHOOTING</span>
                    <h2>排查指引</h2>
                  </div>
                  <span className="mono-note">按顺序执行，多数问题在前两步就能定位</span>
                </div>

                <div className="panel">
                  <div className="panel-body">
                    <div className="trace" style={{ marginBottom: "0" }}>
                      <div className="trace-hd"><span>3 步定位</span><span>CHECKLIST</span></div>
                      <div className="trace-step">
                        <span className="trace-dot run" aria-hidden="true"></span>
                        <span>确认后端进程存活：后端服务应监听在 <span className="mono">{API_BASE_URL}</span> 指向的地址与端口</span>
                        <span className="trace-time">STEP 1</span>
                      </div>
                      <div className="trace-step">
                        <span className="trace-dot skip" aria-hidden="true"></span>
                        <span>确认网络可达：从前端服务所在机器请求 <span className="mono">{API_BASE_URL}/api/v1/model-settings</span>，期望返回 JSON</span>
                        <span className="trace-time">STEP 2</span>
                      </div>
                      <div className="trace-step">
                        <span className="trace-dot skip" aria-hidden="true"></span>
                        <span>确认会话有效：若后端返回 401，回到登录页重新登录后再试</span>
                        <span className="trace-time">STEP 3</span>
                      </div>
                    </div>
                    <div className="err-actions">
                      <Link href="/settings" className="btn btn-primary">重试读取</Link>
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

  return (
    <div className="app">
      <AppHeader current="settings" sub="MODEL CONFIGURATION" userName={currentUser?.display_name ?? null} />

      <main className="app-body">
        <div className="pane">
          <div className="wrap">

            {/* 配置来源说明行 */}
            <div className="state-lede is-accent">
              <span className="status-led" aria-hidden="true"></span>
              <div>
                <b>配置来源 <span className="mono">/api/v1/model-settings</span> · 本次读取自后端</b>
                <span>密钥不回显明文，留空保存表示沿用后端已存的 Key。</span>
              </div>
            </div>

            {/* 三类模型状态 */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">MODEL REGISTRY</span>
                  <h1>模型配置中心</h1>
                </div>
              </div>
              <div className="kpi-grid">
                <ModelStatusCard label="文本模型" value={settings.text.model} active={settings.text.has_api_key && Boolean(settings.text.model)} />
                <ModelStatusCard label="图片模型" value={settings.image.model} active={settings.image.has_api_key && Boolean(settings.image.model)} />
                <ModelStatusCard label="视频模型" value={settings.video.model} active={settings.video.has_api_key && Boolean(settings.video.model)} />
              </div>
            </section>

            {saveStatus ? (
              saveStatus === "ok" ? (
                <div className="test-verdict" role="status">
                  <svg className="ic ic-lg" aria-hidden="true" style={{ color: "var(--success)" }}><use href="#i-check"></use></svg>
                  <div><b>配置已保存，下一次调用会使用新模型。</b></div>
                </div>
              ) : (
                <div className="alert is-error" role="alert">
                  <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                  <div><b>配置保存失败。</b></div>
                </div>
              )
            ) : null}

            {testStatus ? (
              testStatus === "ok" ? (
                <div className="test-verdict" role="status">
                  <svg className="ic ic-lg" aria-hidden="true" style={{ color: "var(--success)" }}><use href="#i-check"></use></svg>
                  <div>
                    <b>{testTargetLabel(testTarget)}测试通过</b>
                    <p className="t-mini mono">{testMessage || "-"}</p>
                  </div>
                </div>
              ) : (
                <div className="alert is-error" role="alert">
                  <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                  <div>
                    <b>{testTargetLabel(testTarget)}测试失败</b>
                    <p>{testMessage || "-"}</p>
                  </div>
                </div>
              )
            ) : null}

            {userStatus ? (
              userStatus === "created" ? (
                <div className="alert is-info" role="status">
                  <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                  <div><b>用户已创建。</b></div>
                </div>
              ) : (
                <div className="alert is-error" role="alert">
                  <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                  <div><b>用户创建失败，请检查邮箱是否重复。</b></div>
                </div>
              )
            ) : null}

            <form
              id="model-settings-form"
              action="/settings/update"
              method="post"
              className="stack-5"
            >
              <section className="panel">
                <div className="panel-head">
                  <h3>文本模型</h3>
                  <span className="badge badge-online">
                    <span className="status-led" aria-hidden="true"></span>
                    用于诊断、主图方案、视频脚本和复盘
                  </span>
                </div>
                <div className="panel-body">
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="text-base-url">Base URL</label>
                      <input id="text-base-url" name="text_base_url" defaultValue={settings.text.base_url} placeholder="https://api.deepseek.com" className="input" />
                    </div>
                    <div className="field">
                      <label htmlFor="text-model">Model</label>
                      <input id="text-model" name="text_model" defaultValue={settings.text.model} placeholder="deepseek-v4-pro" className="input" />
                    </div>
                    <SecretInput label="API Key" name="text_api_key" masked={settings.text.api_key_masked} />
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>图片模型</h3>
                  <span className="badge">用于主图方案的一键出图</span>
                </div>
                <div className="panel-body">
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="image-provider">Provider</label>
                      <input id="image-provider" name="image_provider" defaultValue={settings.image.provider} placeholder="dashscope" className="input" />
                    </div>
                    <div className="field">
                      <label htmlFor="image-model">Model</label>
                      <input id="image-model" name="image_model" defaultValue={settings.image.model} placeholder="wan2.6-t2i" className="input" />
                    </div>
                    <div className="field is-wide">
                      <label htmlFor="image-base-url">Base URL</label>
                      <input id="image-base-url" name="image_base_url" defaultValue={settings.image.base_url} placeholder="https://dashscope.aliyuncs.com/api/v1" className="input" />
                    </div>
                    <div className="field">
                      <label htmlFor="image-size">Size</label>
                      <input id="image-size" name="image_size" defaultValue={settings.image.size} placeholder="1280*1280" className="input" />
                    </div>
                    <div className="field">
                      <label htmlFor="image-workspace">业务空间 ID</label>
                      <input id="image-workspace" name="image_workspace_id" defaultValue={settings.image.workspace_id} placeholder="llm-..." className="input" />
                    </div>
                    <NumberInput label="轮询间隔秒" name="image_poll_interval_seconds" defaultValue={settings.image.poll_interval_seconds} />
                    <NumberInput label="最大轮询次数" name="image_poll_max_attempts" defaultValue={settings.image.poll_max_attempts} />
                    <SecretInput label="API Key" name="image_api_key" masked={settings.image.api_key_masked} />
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>视频模型</h3>
                  <span className="badge">用于短视频脚本的一键成片</span>
                </div>
                <div className="panel-body">
                  <div className="form-grid">
                    <ProviderSelect label="Provider" name="video_provider" defaultValue={settings.video.provider} />
                    <div className="field">
                      <label htmlFor="video-model">Model</label>
                      <input id="video-model" name="video_model" defaultValue={settings.video.model} placeholder="wan2.6-t2v" className="input" />
                    </div>
                    <div className="field is-wide">
                      <label htmlFor="video-base-url">Base URL</label>
                      <input id="video-base-url" name="video_base_url" defaultValue={settings.video.base_url} placeholder="https://dashscope.aliyuncs.com/api/v1" className="input" />
                    </div>
                    <div className="field">
                      <label htmlFor="video-size">Size</label>
                      <input id="video-size" name="video_size" defaultValue={settings.video.size} placeholder="1280*720" className="input" />
                    </div>
                    <NumberInput label="时长秒" name="video_duration" defaultValue={settings.video.duration} />
                    <div className="field">
                      <label htmlFor="video-workspace">业务空间 ID</label>
                      <input id="video-workspace" name="video_workspace_id" defaultValue={settings.video.workspace_id} placeholder="llm-..." className="input" />
                    </div>
                    <NumberInput label="轮询间隔秒" name="video_poll_interval_seconds" defaultValue={settings.video.poll_interval_seconds} />
                    <NumberInput label="最大轮询次数" name="video_poll_max_attempts" defaultValue={settings.video.poll_max_attempts} />
                    <SecretInput label="API Key" name="video_api_key" masked={settings.video.api_key_masked} />
                  </div>
                </div>
              </section>

              {canEdit ? (
                <div className="form-actions">
                  <button
                    type="submit"
                    form="model-settings-form"
                    className="btn btn-primary"
                  >
                    保存配置
                  </button>
                  <TestButton target="text" label="测试文本模型" />
                  <TestButton target="image" label="测试图片模型" />
                  <TestButton target="video" label="测试视频模型" />
                </div>
              ) : null}
            </form>

            {canEdit ? null : (
              <div className="alert is-warn">
                <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                <div><b>当前账号为只读权限，模型保存和测试按钮已隐藏。</b></div>
              </div>
            )}

            {canManageUsers ? (
              <UserManagementPanel users={users} />
            ) : (
              <div className="alert is-warn">
                <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                <div><b>当前账号没有用户管理权限，只能查看模型配置状态。</b></div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** 渲染 ModelStatusCard 组件，集中展示模型状态卡片所需的数据、状态和操作入口。 */
function ModelStatusCard({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <article className="kpi">
      <span className="kpi-lbl">{label}</span>
      <span className={`kpi-val mono ${value ? "" : "is-idle"}`}>{value || "未配置"}</span>
      <div className="kpi-foot">
        <span className={`badge ${active ? "badge-online" : "badge-warn"}`}>
          <span className={`status-led ${active ? "" : "is-off"}`} aria-hidden="true"></span>
          {active ? "已配置密钥" : "缺少模型或密钥"}
        </span>
      </div>
    </article>
  );
}

/** 渲染 UserManagementPanel 组件，集中展示用户管理面板所需的数据、状态和操作入口。 */
function UserManagementPanel({ users }: { users: UserAccount[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>用户与权限</h3>
        <span className="badge">按角色控制编辑、成员管理和投放确认权限</span>
      </div>

      <div className="panel-body">
        <form action="/settings/users/create" method="post" className="stack-4">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="u-email">邮箱</label>
              <input id="u-email" name="email" placeholder="ops@example.com" className="input" />
            </div>
            <div className="field">
              <label htmlFor="u-name">姓名</label>
              <input id="u-name" name="display_name" placeholder="运营同学" className="input" />
            </div>
            <RoleSelect />
            <div className="field">
              <label htmlFor="u-password">初始密码</label>
              <input
                id="u-password"
                name="password"
                type="password"
                minLength={8}
                placeholder="可留空"
                className="input"
              />
            </div>
          </div>
          <div className="form-actions" style={{ borderTop: "0", paddingTop: "0", marginTop: "0" }}>
            <button type="submit" className="btn btn-primary">添加用户</button>
          </div>
        </form>
      </div>

      {users.length === 0 ? (
        <div className="panel-body">
          <div className="empty">
            <h4>暂无用户</h4>
            <p>先添加 owner 或 operator，再逐步接入登录鉴权。</p>
          </div>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">用户</th>
                <th scope="col">角色</th>
                <th scope="col">状态</th>
                <th scope="col">权限</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="cell-model">
                      <b>{user.display_name}</b>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>{roleLabel(user.role)}</td>
                  <td>
                    <span className={`badge ${user.status === "active" ? "badge-online" : "badge-warn"}`}>
                      {user.status === "active" ? "启用" : "停用"}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      {permissionBadges(user).map((badge) => (
                        <span key={badge} className="badge">{badge}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** 渲染 NumberInput 组件，集中展示数值input所需的数据、状态和操作入口。 */
function NumberInput({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        name={name}
        type="number"
        min="1"
        defaultValue={defaultValue}
        className="input"
      />
    </div>
  );
}

/** 渲染 ProviderSelect 组件，集中展示provider选择所需的数据、状态和操作入口。 */
function ProviderSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${name}`}>{label}</label>
      <select
        id={`f-${name}`}
        name={name}
        defaultValue={defaultValue || "dashscope"}
        className="input"
      >
        <option value="dashscope">DashScope / 通义万相</option>
        <option value="jimeng">Jimeng / 即梦</option>
        <option value="custom">Custom</option>
      </select>
    </div>
  );
}

/** 渲染 RoleSelect 组件，集中展示角色选择所需的数据、状态和操作入口。 */
function RoleSelect() {
  return (
    <div className="field">
      <label htmlFor="u-role">角色</label>
      <select id="u-role" name="role" defaultValue="operator" className="input">
        <option value="owner">Owner</option>
        <option value="operator">Operator</option>
        <option value="viewer">Viewer</option>
      </select>
    </div>
  );
}

/** 渲染 SecretInput 组件，集中展示secretinput所需的数据、状态和操作入口。 */
function SecretInput({ label, name, masked }: { label: string; name: string; masked: string }) {
  return (
    <div className="field is-wide">
      <label htmlFor={`f-${name}`}>{label}</label>
      {/* 密钥输入框不回填明文，只显示脱敏占位；留空时后端保留原 key。 */}
      <input
        id={`f-${name}`}
        name={name}
        type="password"
        placeholder={masked ? `当前：${masked}，留空则保持不变` : "粘贴 API Key"}
        className="input"
      />
      <span className="hint">密钥从后端环境注入，不写入前端、不在页面上回显明文。</span>
    </div>
  );
}

/** 渲染 TestButton 组件，集中展示test按钮所需的数据、状态和操作入口。 */
function TestButton({ target, label }: { target: "text" | "image" | "video"; label: string }) {
  return (
    <form action="/settings/test" method="post">
      <input type="hidden" name="target" value={target} />
      <button type="submit" className="btn">
        {label}
      </button>
    </form>
  );
}

/** 标量，把不可信表单或 JSON 值转换为页面逻辑可安全使用的类型。 */
function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** 把testtarget状态映射为中文显示文本，保持页面口径一致。 */
function testTargetLabel(target: string | undefined) {
  if (target === "image") {
    return "图片模型";
  }
  if (target === "video") {
    return "视频模型";
  }
  return "文本模型";
}

/** 把角色状态映射为中文显示文本，保持页面口径一致。 */
function roleLabel(role: UserAccount["role"]): string {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "viewer") {
    return "Viewer";
  }
  return "Operator";
}

/** 权限badges，封装当前页面重复使用的转换或展示规则，并统一处理空值边界。 */
function permissionBadges(user: UserAccount): string[] {
  const badges = ["可查看"];
  if (user.permissions.can_edit) {
    badges.push("可编辑");
  }
  if (user.permissions.can_manage_users) {
    badges.push("管理用户");
  }
  if (user.permissions.can_confirm_ad_actions) {
    badges.push("确认投放");
  }
  return badges;
}
