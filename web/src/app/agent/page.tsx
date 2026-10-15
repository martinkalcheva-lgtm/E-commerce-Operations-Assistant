import Link from "next/link";
import { redirect } from "next/navigation";

import { AgentTaskAutoRefresh } from "@/components/agent-task-auto-refresh";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AgentApiError,
  getAgentApprovals,
  getAgentCatalog,
  getAgentMemories,
  getAgentTasks,
  getCurrentUser,
  getWorkspaces,
  getWorkspaceProducts,
  getWorkspaceStores,
} from "@/lib/api";
import { getActiveWorkspaceId, getAuthToken } from "@/lib/session";
import type { AgentRiskLevel, AgentTaskStatus } from "@/types";

import "./page.agent.css";

type AgentCenterProps = {
  searchParams?: Promise<{ workspace?: string; result?: string; section?: string }>;
};

const statusLabels: Record<AgentTaskStatus, string> = {
  queued: "排队中",
  running: "执行中",
  awaiting_approval: "待审批",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
};

const riskBadgeTones: Record<AgentRiskLevel, string> = {
  R0: "badge-info",
  R1: "badge-online",
  R2: "badge-warn",
  R3: "badge-accent",
};

const workflowIconIds = ["i-search", "i-db", "i-doc"];

/** 渲染 AgentCenter 组件，集中展示Agent中心所需的数据、状态和操作入口。 */
export default async function AgentCenter({ searchParams }: AgentCenterProps) {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }
  const query = searchParams ? await searchParams : {};
  const activeWorkspaceId = await getActiveWorkspaceId();
  let workspaces: Awaited<ReturnType<typeof getWorkspaces>>;
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    [workspaces, currentUser] = await Promise.all([getWorkspaces(), getCurrentUser(token)]);
  } catch (error) {
    if (error instanceof AgentApiError && error.status === 401) redirect("/login?expired=1");
    return <AgentServiceError />;
  }
  if (!currentUser) redirect("/login?expired=1");
  const workspace = selectWorkspace(
    workspaces,
    query.workspace ?? activeWorkspaceId?.toString(),
  );
  if (!workspace) {
    return <EmptyWorkspace />;
  }
  const workspaceId = workspace.workspace.id;
  let resources;
  try {
    resources = await Promise.all([
      getAgentCatalog(workspaceId),
      getAgentTasks(workspaceId),
      getAgentApprovals(workspaceId),
      getAgentMemories(workspaceId),
      getWorkspaceProducts(workspaceId),
      getWorkspaceStores(workspaceId),
    ]);
  } catch (error) {
    if (error instanceof AgentApiError && error.status === 401) redirect("/login?expired=1");
    return <AgentServiceError />;
  }
  const [catalog, tasks, approvals, memories, products, stores] = resources;
  const canEdit = workspace.membership.role !== "viewer";
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const cancelledCount = tasks.filter((task) => task.status === "cancelled").length;
  const activeCount = tasks.filter((task) => ["queued", "running"].includes(task.status)).length;

  return (
    <div className="app pg-agent">
      <AppTopBar userName={currentUser?.display_name ?? null} />
      <main className="app-body">
        <div className="pane">
          <AgentTaskAutoRefresh active={activeCount > 0} />
          <div className="wrap" id="top">

            {/* ============ 页头 ============ */}
            <header className="page-head">
              <div>
                <span className="eyebrow">
                  <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-agent"></use></svg>
                  Ecommerce Operations Agent
                </span>
                <h1>统一运营 Agent 中心</h1>
                <p className="t-lead">
                  由一个协调 Agent 选择受控工作流，八个专业 Agent 在 Harness 约束下协作；业务结果仍回到可编辑工作台。
                </p>
              </div>
              <div className="ph-ctl">
                {workspaces.length > 1 ? (
                  <form className="ws-switch" action="/agent/workspaces/select" method="post">
                    <label className="sr-only" htmlFor="ws">切换 Workspace</label>
                    <select
                      className="input"
                      id="ws"
                      name="workspace_id"
                      defaultValue={workspaceId}
                      aria-label="切换 Workspace"
                    >
                      {workspaces.map((item) => (
                        <option key={item.workspace.id} value={item.workspace.id}>
                          {item.workspace.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn">切换</button>
                  </form>
                ) : null}
                <Link className="btn" href="/">
                  <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>业务工作台
                </Link>
                <span className="whoami">
                  <b>{currentUser?.display_name ?? "当前用户"}</b>
                  <span className="mono">{workspace.membership.role} · {workspace.workspace.name}</span>
                </span>
              </div>
            </header>

            {/* ============ 结果横幅 ============ */}
            {query.result ? <ResultBanner result={query.result} /> : null}

            {/* ============ 指标 ============ */}
            <section className="sec" id="metrics">
              <div className="kpi-grid">
                <article className="kpi">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-repo"></use></svg>版本化工作流</span>
                  <span className="kpi-val">{catalog?.workflows.length ?? 0}</span>
                  <p className="kpi-desc">catalog.workflows.length。每个工作流都带版本号与默认风险等级，可评测、可回退。</p>
                  <div className="kpi-foot">
                    <span className="badge">CATALOG</span>
                  </div>
                </article>

                <article className="kpi">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-terminal"></use></svg>进行中任务</span>
                  <span className="kpi-val">{activeCount}</span>
                  <p className="kpi-desc">status 为 queued 或 running 的任务数。大于 0 时任务中心每 2 秒自动刷新。</p>
                  <div className="kpi-foot">
                    {activeCount > 0 ? (
                      <span className="badge badge-warn"><span className="status-led is-busy" aria-hidden="true"></span>LIVE</span>
                    ) : (
                      <span className="badge">空闲</span>
                    )}
                  </div>
                </article>

                <article className="kpi">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>已完成任务</span>
                  <span className="kpi-val">{completedCount}</span>
                  <p className="kpi-desc">status 为 completed 的任务数。失败 / 取消不计入，各自在任务中心按状态标注。</p>
                  <div className="kpi-foot">
                    <span className="hint">失败 {failedCount} · 取消 {cancelledCount}</span>
                  </div>
                </article>

                <article className="kpi is-lead">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>待处理审批</span>
                  <span className="kpi-val">{approvals.length}</span>
                  <p className="kpi-desc">approvals.length。R2 / R3 副作用必须由策略层与数据库审批共同放行，这是唯一需要人动手的指标。</p>
                  <div className="kpi-foot">
                    <a className="hint" href="#approval-inbox" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}>去审批收件箱</a>
                  </div>
                </article>
              </div>
            </section>

            {/* ============ 锚点导航 ============ */}
            <nav className="anchors" aria-label="页面内区块">
              <a href="#agent-entry">Agent 入口</a>
              <a href="#task-center">任务中心 <span className="n">{tasks.length}</span></a>
              <a href="#approval-inbox">审批收件箱 <span className="n">{approvals.length}</span></a>
              <a href="#memory">结构化记忆 <span className="n">{memories.length}</span></a>
              <a href="#catalog">Agent 目录 <span className="n">{catalog?.agents.length ?? 0}</span></a>
            </nav>

            {/* ============ Agent 入口 + Harness 边界 ============ */}
            <section className="sec" id="agent-entry">
              <div className="entry-grid">

                <div className="panel">
                  <div className="panel-head" style={{ alignItems: "flex-start" }}>
                    <div className="panel-head-lead">
                      <div>
                        <span className="eyebrow">Coordinator Entry</span>
                        <h2 style={{ marginTop: ".25rem" }}>告诉协调 Agent 你的目标</h2>
                        <p>协调 Agent 只从已注册工作流中路由，不会自由拼装高风险动作。</p>
                      </div>
                      <svg className="ic ic-lg" aria-hidden="true" focusable="false" style={{ color: "var(--accent)" }}><use href="#i-agent"></use></svg>
                    </div>
                  </div>
                  <div className="panel-body">
                    <form className="form-stack" action="/agent/tasks/create" method="post">
                      <input type="hidden" name="workspace_id" value={workspaceId} />
                      <div className="field">
                        <label htmlFor="intent">目标意图 · INTENT</label>
                        <textarea
                          className="input"
                          id="intent"
                          name="intent"
                          required
                          disabled={!canEdit}
                          placeholder="例如：检查这款商品近期的库存和经营风险，并给出下一步建议"
                        ></textarea>
                        <span className="hint">必填。意图由协调 Agent 映射到工作流，而不是直接执行动作。</span>
                      </div>

                      <div className="form-row">
                        <ContextSelectors products={products} stores={stores} disabled={!canEdit} />
                      </div>

                      <div className="form-actions">
                        <button type="submit" disabled={!canEdit} className="btn btn-primary">
                          <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>创建受控任务
                        </button>
                        <span className="hint">POST /agent/tasks/create → 回本页并带 ?result=</span>
                      </div>
                    </form>
                  </div>
                </div>

                <section className="panel panel-inverted harness">
                  <div className="panel-body">
                    <span className="eyebrow">
                      <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-server"></use></svg>Harness 边界
                    </span>
                    <h3>不是把多个 Prompt 串在一起</h3>
                    <p className="lede">边界写在基础设施里：身份、工具、幂等、状态恢复、人工协作与质量闭环各自有独立机制，不靠提示词约束。</p>
                    <div className="harness-grid">
                      <div className="hg"><b>身份与租户</b><span>Workspace 强隔离</span></div>
                      <div className="hg"><b>工具策略</b><span>Agent allowlist + 风险分级</span></div>
                      <div className="hg"><b>可靠执行</b><span>Celery + Outbox + 幂等</span></div>
                      <div className="hg"><b>状态恢复</b><span>PostgreSQL Checkpoint</span></div>
                      <div className="hg"><b>人工协作</b><span>R2/R3 数据库审批</span></div>
                      <div className="hg"><b>质量闭环</b><span>事件、评测和版本追踪</span></div>
                    </div>
                  </div>
                </section>

              </div>
            </section>

            {/* ============ 任务模板 ============ */}
            <section className="sec" id="templates">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Workflow Templates</span>
                  <h2>任务模板</h2>
                </div>
                <span className="mono-note">每个模板对应一个可版本化、可评测、可回退的 LangGraph 工作流 · {catalog?.workflows.length ?? 0} 个已启用</span>
              </div>

              <div className="wf-grid">
                {catalog?.workflows.map((workflow, index) => (
                  <article key={workflow.key} className="panel wf">
                    <div className="wf-top">
                      <span className="wf-icon" aria-hidden="true">
                        <svg className="ic" aria-hidden="true" focusable="false"><use href={`#${workflowIconIds[index % workflowIconIds.length]}`}></use></svg>
                      </span>
                      <span className={`badge ${riskBadgeTones[workflow.default_risk_level]}`}>{workflow.default_risk_level}</span>
                    </div>
                    <div>
                      <h3>{workflow.title}</h3>
                      <p className="wf-key">{workflow.key} · v{workflow.version}</p>
                    </div>
                    <p className="wf-desc">{workflow.description}</p>
                    <div className="wf-block">
                      <span>专家链 · AGENTS</span>
                      <div className="tag-row">
                        {workflow.agents.map((agentKey) => <span key={agentKey} className="tag">{humanizeAgent(agentKey)}</span>)}
                      </div>
                    </div>
                    <div className="wf-block">
                      <span>必需上下文 · REQUIRED_CONTEXT_ANY</span>
                      <div className="tag-row">
                        {workflow.required_context_any.map((ctx) => <span key={ctx} className="tag">{ctx}</span>)}
                      </div>
                    </div>
                    <form className="form-stack" action="/agent/tasks/create" method="post">
                      <input type="hidden" name="workspace_id" value={workspaceId} />
                      <input type="hidden" name="workflow_key" value={workflow.key} />
                      <ContextSelectors products={products} stores={stores} disabled={!canEdit} />
                      <button type="submit" disabled={!canEdit} className="btn">
                        启动工作流 <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </section>

            {/* ============ 任务中心 ============ */}
            <section className="sec" id="task-center">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Task Center</span>
                  <h2>任务中心</h2>
                </div>
                <div className="sec-hd-end">
                  {activeCount > 0 ? (
                    <span className="badge badge-warn"><span className="status-led is-busy" aria-hidden="true"></span>自动刷新 · 2s</span>
                  ) : null}
                  <span className="mono-note">Task = 业务目标 · Run = 实际执行与重试</span>
                </div>
              </div>

              <p className="hint" style={{ marginBottom: "var(--sp-3)" }}>
                耗时口径：<span className="k">finished_at − created_at</span>（AgentTask 无 started_at 字段，包含排队时间）；
                未结束任务显示「已运行至今」。
              </p>

              <div className="task-list">
                {tasks.length === 0 ? (
                  <div className="empty">
                    <svg className="ic ic-lg" aria-hidden="true" focusable="false"><use href="#i-agent"></use></svg>
                    <h3>还没有 Agent Task</h3>
                    <p>任务中心只在真正创建过任务后有内容。先在上方入口描述一次目标，或直接启动一个任务模板 —— 只读浏览不会产生任务。</p>
                    <div className="empty-actions">
                      <a className="btn btn-primary" href="#agent-entry">去描述目标</a>
                      <a className="btn" href="#templates">看任务模板</a>
                    </div>
                  </div>
                ) : tasks.map((task) => (
                  <details key={task.id} className="task">
                    <summary>
                      <div className="task-row">
                        <div>
                          <p className="task-title">
                            <span className={`trace-dot ${taskDotTone(task.status)}`} aria-hidden="true"></span>
                            <span className="task-id">#{task.id}</span>
                            {task.title}
                          </p>
                          <span className="task-sub">{task.workflow_key} · v{task.workflow_version} · 创建于 {formatDate(task.created_at)}</span>
                        </div>
                        <div className="task-elapsed">
                          {taskElapsed(task)}
                          <em>{taskElapsedNote(task)}</em>
                        </div>
                        <div className="task-badges">
                          <span className={`badge ${riskBadgeTones[task.risk_level]}`}>{task.risk_level}</span>
                          <span className={`badge ${statusBadgeTone(task.status)}`}>{statusLabels[task.status]}</span>
                        </div>
                      </div>
                    </summary>
                    <div className="task-body">
                      {task.intent ? (
                        <div>
                          <span className="eyebrow">目标原文 · INTENT</span>
                          <p className="prose" style={{ marginTop: ".375rem" }}>{task.intent}</p>
                        </div>
                      ) : null}

                      <div className="json-2">
                        <div className="json-box">
                          <h3>上下文 · CONTEXT_SCOPE</h3>
                          <pre>{Object.keys(task.context_scope).length ? JSON.stringify(task.context_scope, null, 2) : "暂无"}</pre>
                        </div>
                        <div className="json-box">
                          <h3>结果摘要 · RESULT_SUMMARY</h3>
                          <pre>{Object.keys(task.result_summary).length ? JSON.stringify(task.result_summary, null, 2) : "暂无"}</pre>
                        </div>
                      </div>

                      {task.error ? (
                        <div className="alert is-bad" role="alert">
                          <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>
                          <div>
                            <b>任务失败 · task.error</b>
                            <p className="mono">{task.error}</p>
                          </div>
                        </div>
                      ) : null}

                      {task.cancelled_at ? (
                        <p className="hint">取消于 {formatDate(task.cancelled_at)}</p>
                      ) : null}

                      {["queued", "running", "awaiting_approval"].includes(task.status) && canEdit ? (
                        <div className="form-actions">
                          <form action={`/agent/tasks/${task.id}/cancel`} method="post">
                            <input type="hidden" name="workspace_id" value={workspaceId} />
                            <button type="submit" className="btn btn-ghost">
                              <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>取消任务
                            </button>
                          </form>
                          <span className="hint">取消仅在 queued / running / awaiting_approval 且角色可写时出现</span>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* ============ 审批收件箱 ============ */}
            <section className="sec" id="approval-inbox">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Approval Inbox</span>
                  <h2>审批收件箱</h2>
                </div>
                <span className="mono-note">R2/R3 副作用必须由策略层和数据库审批共同放行 · 一条审批 = 一次动作放行</span>
              </div>

              <div className="approval-wrap">
                {approvals.length === 0 ? (
                  <div className="empty">
                    <svg className="ic ic-lg" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>
                    <h3>当前没有待审批动作</h3>
                    <p>审批只在工作流触发 R2 / R3 副作用（对外发布、预算调整等）时产生。没有审批说明没有任何需要放行的动作，不代表任务失败。</p>
                    <div className="empty-actions">
                      <a className="btn" href="#task-center">查看进行中任务</a>
                    </div>
                  </div>
                ) : approvals.map((approval) => (
                  <article key={approval.id} className="approval">
                    <div className="approval-hd">
                      <div>
                        <h3>任务 #{approval.task_id} · {approval.action_key}</h3>
                        <p className="approval-sub">Run #{approval.run_id} · 创建于 {formatDate(approval.created_at)} · 审批 #{approval.id}</p>
                      </div>
                      <div className="approval-meta">
                        <span className={`badge ${riskBadgeTones[approval.risk_level]}`}>{approval.risk_level}</span>
                        <span className="badge badge-warn">待审批</span>
                        {approval.expires_at ? <span className="badge">将在 {formatDate(approval.expires_at)} 过期</span> : null}
                      </div>
                    </div>

                    <div className="json-box">
                      <h4>审批上下文 · REQUEST_PAYLOAD</h4>
                      <pre>{JSON.stringify(approval.request_payload, null, 2)}</pre>
                    </div>

                    {canEdit ? (
                      <div className="decide">
                        <ApprovalForm approvalId={approval.id} workspaceId={workspaceId} decision="approve" draftOutput={approval.request_payload.draft_output} />
                        <ApprovalForm approvalId={approval.id} workspaceId={workspaceId} decision="reject" />
                      </div>
                    ) : (
                      <div className="alert is-lock">
                        <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>
                        <div>
                          <b>只读角色 · viewer</b>
                          <p>只读角色可以查看任务、审批与记忆，但所有写操作整体禁用；审批决策表单不渲染。</p>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* ============ 结构化记忆 ============ */}
            <section className="sec" id="memory">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Structured Memory</span>
                  <h2>结构化记忆</h2>
                </div>
                <span className="mono-note">只保存用户明确确认的结构化事实，不自动吸收全部聊天 · 按 status 标注：active / revoked / expired</span>
              </div>

              <div className="mem-grid">

                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">Create Memory</span>
                      <h3 style={{ marginTop: ".25rem" }}>确认一条长期记忆</h3>
                    </div>
                    <svg className="ic ic-lg" aria-hidden="true" focusable="false" style={{ color: "var(--info)" }}><use href="#i-db"></use></svg>
                  </div>
                  <div className="panel-body">
                    <form className="form-stack" action="/agent/memories/create" method="post">
                      <input type="hidden" name="workspace_id" value={workspaceId} />
                      <div className="field">
                        <label htmlFor="scope-type">范围类型 · SCOPE_TYPE</label>
                        <select className="input" id="scope-type" name="scope_type">
                          <option value="workspace">工作区</option>
                          <option value="store">店铺</option>
                          <option value="product">商品</option>
                          <option value="user">用户偏好</option>
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="scope-id">范围 ID · SCOPE_ID</label>
                        <input className="input" id="scope-id" name="scope_id" type="text" placeholder="范围 ID（工作区可留空）" />
                        <span className="hint">scope_type 为 workspace 时留空，落库为 null</span>
                      </div>
                      <div className="field">
                        <label htmlFor="mem-key">键 · MEMORY_KEY</label>
                        <input className="input" id="mem-key" name="memory_key" type="text" required placeholder="键，例如 brand_tone" />
                      </div>
                      <div className="field">
                        <label htmlFor="mem-val">值 · MEMORY_VALUE</label>
                        <textarea className="input" id="mem-val" name="memory_value" required placeholder="已确认的事实或偏好"></textarea>
                      </div>
                      <div className="form-actions">
                        <button type="submit" disabled={!canEdit} className="btn btn-primary">
                          <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>保存记忆
                        </button>
                        <span className="hint">角色为 viewer 时按钮禁用</span>
                      </div>
                    </form>
                  </div>
                </div>

                <div>
                  <div className="sec-hd" style={{ marginBottom: "var(--sp-3)" }}>
                    <div>
                      <span className="eyebrow">Effective Memory</span>
                      <h2 style={{ fontSize: "var(--fs-h3)" }}>有效记忆</h2>
                    </div>
                    <span className="mono-note">按 status 标注：active / revoked / expired</span>
                  </div>

                  <div className="mem-list">
                    {memories.length === 0 ? (
                      <div className="empty">
                        <svg className="ic ic-lg" aria-hidden="true" focusable="false"><use href="#i-db"></use></svg>
                        <h3>暂无已确认记忆</h3>
                        <p>记忆只保存用户明确确认的结构化事实，不自动吸收全部对话。第一条记忆请用左侧表单保存，键名建议可复用（如 brand_tone）。</p>
                      </div>
                    ) : memories.map((memory) => (
                      <article key={memory.id} className={`mem ${memory.status === "active" ? "" : "is-off"}`}>
                        <div className="mem-hd">
                          <span className="mem-key">{memory.memory_key}</span>
                          {memory.status === "active" ? (
                            <span className="badge badge-online">生效中</span>
                          ) : memory.status === "revoked" ? (
                            <span className="badge">已撤销</span>
                          ) : (
                            <span className="badge badge-warn">已过期</span>
                          )}
                        </div>
                        <span className="mem-scope">
                          {memory.scope_type}:{memory.scope_id ?? workspaceId} · 来源 {memory.source_type}
                          {memory.status === "revoked" && memory.revoked_at ? ` · 撤销于 ${formatDate(memory.revoked_at)}` : ""}
                          {memory.status === "expired" && memory.expires_at ? ` · 过期于 ${formatDate(memory.expires_at)}` : ""}
                        </span>
                        <pre>{JSON.stringify(memory.content, null, 2)}</pre>
                      </article>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* ============ Agent 目录 ============ */}
            <section className="sec" id="catalog">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Agent Catalog</span>
                  <h2>内部专业 Agent 目录</h2>
                </div>
                <span className="mono-note">用户只与顶层 Agent 交互；专业 Agent 的版本和工具白名单可审计</span>
              </div>

              {catalog ? (
                <section className="panel panel-inverted" style={{ marginBottom: "var(--sp-4)" }}>
                  <div className="panel-body">
                    <div className="cat-coord">
                      <div>
                        <span className="eyebrow">Catalog Coordinator · 主智能体</span>
                        <h3>Coordinator</h3>
                        <p className="lede">只从已注册工作流中路由，不自由拼装高风险动作；路由结果决定哪些专业 Agent 参与本次任务。</p>
                        <span className="k">version {catalog.coordinator.version} · {catalog.coordinator.tools.length} 个允许工具 · {catalog.agents.length} 个已注册专业 Agent</span>
                      </div>
                      <span className="badge badge-solid">TOP-LEVEL</span>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="cat-grid">
                {catalog?.agents.map((agent) => (
                  <article key={agent.key} className="cat">
                    <span className="key">{agent.key}</span>
                    <span className="ver">v{agent.version} · {agent.tools.length} 个允许工具</span>
                    <b>{humanizeAgent(agent.key)}</b>
                    <p>{agent.description}</p>
                  </article>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

/** 渲染 AppTopBar 组件，集中展示顶栏所需的数据、状态和操作入口。 */
function AppTopBar({ userName }: { userName: string | null }) {
  return (
    <header className="app-top">
      <div className="brand">
        <span className="mark-slot" aria-hidden="true">
          <svg className="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <rect x="12" y="12" width="8" height="8" rx="2" />
            <rect x="4" y="4" width="4" height="4" rx="1" />
            <rect x="24" y="4" width="4" height="4" rx="1" />
            <rect x="4" y="24" width="4" height="4" rx="1" />
            <rect x="24" y="24" width="4" height="4" rx="1" />
          </svg>
        </span>
        <span>运营智能体</span>
        <span className="sub">AGENT CENTER</span>
      </div>
      <nav aria-label="主导航">
        <Link href="/">工作台</Link>
        <Link href="/settings">模型配置</Link>
        <Link href="/agent" aria-current="page">Agent 中心</Link>
        <Link href="/login">登录</Link>
      </nav>
      <div className="top-actions">
        {userName ? <span className="badge">{userName}</span> : null}
        <ThemeToggle />
      </div>
    </header>
  );
}

/** 渲染 ContextSelectors 组件，集中展示上下文选择器所需的数据、状态和操作入口。 */
function ContextSelectors({ products, stores, disabled = false }: { products: Array<{ id: number; name: string }>; stores: Array<{ id: number; name: string }>; disabled?: boolean }) {
  return (
    <>
      <div className="field">
        <label htmlFor="p-ctx">商品上下文 · PRODUCT_ID</label>
        <select id="p-ctx" name="product_id" disabled={disabled} className="input">
          <option value="">选择商品上下文</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="s-ctx">店铺上下文 · STORE_ID</label>
        <select id="s-ctx" name="store_id" disabled={disabled} className="input">
          <option value="">选择店铺上下文</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
      </div>
    </>
  );
}

/** 渲染 ApprovalForm 组件，集中展示审批表单所需的数据、状态和操作入口。 */
function ApprovalForm({ approvalId, workspaceId, decision, draftOutput }: { approvalId: number; workspaceId: number; decision: "approve" | "reject"; draftOutput?: unknown }) {
  const approve = decision === "approve";
  return (
    <form action={`/agent/approvals/${approvalId}/decision`} method="post" className="decide-stack">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="decision" value={decision} />
      <h4>{approve ? "批准 · decision=approve" : "驳回 · decision=reject"}</h4>
      <p className="lead">{approve ? "可直接提交草稿，也可先修改结构化输出再放行；修改内容与草稿一同留档。" : "驳回不产生副作用，工作流不恢复。"}</p>
      {approve ? (
        <div className="field">
          <label htmlFor={`appr-out-${approvalId}`}>可编辑结构化输出 · EDITED_OUTPUT</label>
          <textarea className="input is-code" id={`appr-out-${approvalId}`} name="edited_output" defaultValue={JSON.stringify(draftOutput ?? {}, null, 2)} spellCheck={false} aria-label="编辑后批准的结构化输出"></textarea>
          <span className="hint">预填 request_payload.draft_output；approve 决策必须携带 edited_output</span>
        </div>
      ) : null}
      <div className="form-actions">
        <button type="submit" className={approve ? "btn btn-primary" : "btn btn-ghost"}>
          {approve ? (
            <><svg className="ic" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>编辑后批准并恢复</>
          ) : (
            <><svg className="ic" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>驳回并终止本次动作</>
          )}
        </button>
      </div>
    </form>
  );
}

/** 渲染 EmptyWorkspace 组件，集中展示空状态Workspace所需的数据、状态和操作入口。 */
function EmptyWorkspace() {
  return (
    <main className="app-body pg-agent">
      <div className="pane">
        <div className="wrap">
          <div className="panel" style={{ maxWidth: "36rem", marginInline: "auto", marginTop: "var(--sp-7)" }}>
            <div className="panel-body">
              <span className="eyebrow">Boundary · No Workspace</span>
              <h2 style={{ fontSize: "var(--fs-h3)", marginTop: ".375rem" }}>暂无可用 Workspace</h2>
              <p className="prose" style={{ marginTop: ".375rem" }}>请先运行数据库迁移并为当前用户创建 WorkspaceMembership，之后才能进入 Agent 中心。</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** 渲染 AgentServiceError 组件，集中展示Agent服务错误所需的数据、状态和操作入口。 */
function AgentServiceError() {
  return (
    <main className="app-body pg-agent">
      <div className="pane">
        <div className="wrap">
          <div className="panel" style={{ maxWidth: "36rem", marginInline: "auto", marginTop: "var(--sp-7)" }}>
            <div className="panel-body">
              <span className="eyebrow">Boundary · API Down</span>
              <h2 style={{ fontSize: "var(--fs-h3)", marginTop: ".375rem" }}>Agent 服务暂不可用</h2>
              <p className="prose" style={{ marginTop: ".375rem" }}>请求未被伪装为空数据，请检查 API、权限或基础设施状态后重试。指标与列表保持上一次成功读取的状态。</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** 渲染 ResultBanner 组件，集中展示结果提示横幅所需的数据、状态和操作入口。 */
function ResultBanner({ result }: { result: string }) {
  const failed = result === "failed";
  return (
    <div className={`alert ${failed ? "is-bad" : "is-ok"}`} style={{ marginBottom: "var(--sp-5)" }} role="status">
      <svg className="ic" aria-hidden="true" focusable="false"><use href={failed ? "#i-warn" : "#i-check"}></use></svg>
      <div>
        <b>{failed ? "操作失败，请检查输入和权限" : "操作已提交，任务状态会持续更新"}</b>
      </div>
    </div>
  );
}

/** 任务卡状态圆点 tone。 */
function taskDotTone(status: AgentTaskStatus): string {
  if (status === "running" || status === "awaiting_approval") return "run";
  if (status === "completed") return "done";
  if (status === "failed") return "fail";
  return "skip";
}

/** 任务卡状态徽标 tone。 */
function statusBadgeTone(status: AgentTaskStatus): string {
  if (status === "completed") return "badge-online";
  if (status === "failed") return "badge-accent";
  if (status === "awaiting_approval" || status === "running") return "badge-warn";
  return "badge";
}

/** 任务耗时口径：finished_at − created_at；未结束显示「已运行至今」。 */
function taskElapsed(task: { status: AgentTaskStatus; created_at: string; finished_at: string | null }): string {
  if (!task.finished_at) {
    return `已运行 ${formatDuration(Date.now() - new Date(task.created_at).getTime())}`;
  }
  return formatDuration(new Date(task.finished_at).getTime() - new Date(task.created_at).getTime());
}

/** 任务耗时附注行。 */
function taskElapsedNote(task: { status: AgentTaskStatus; created_at: string; finished_at: string | null; cancelled_at?: string | null }): string {
  if (task.status === "queued") return "排队中 · 至今";
  if (!task.finished_at) return "未结束 · 至今";
  if (task.status === "failed") return `失败于 ${formatDate(task.finished_at)}`;
  if (task.status === "cancelled") return `取消于 ${formatDate(task.finished_at)}`;
  return `完成于 ${formatDate(task.finished_at)}`;
}

/** 格式化时长为 mm:ss（超一小时进 hh:mm:ss）。 */
function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 处理选择Workspace交互，维护必要状态并把副作用交给受控路由或后端 API。 */
function selectWorkspace(workspaces: Awaited<ReturnType<typeof getWorkspaces>>, requested?: string) {
  const requestedId = Number(requested);
  return workspaces.find((item) => item.workspace.id === requestedId) ?? workspaces[0] ?? null;
}

/** 格式化日期，统一空值、本地化和页面展示规则，避免各组件重复格式化。 */
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

/** 转换显示名Agent，统一空值、本地化和页面展示规则，避免各组件重复格式化。 */
function humanizeAgent(key: string) { return key.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
