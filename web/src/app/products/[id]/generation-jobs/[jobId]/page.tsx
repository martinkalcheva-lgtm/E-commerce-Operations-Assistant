import Link from "next/link";
import { notFound } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { getProduct } from "@/lib/api";
import type { GenerationJob } from "@/types";

import "./page.gjob.css";

type GenerationJobDetailPageProps = {
  params: Promise<{ id: string; jobId: string }>;
};

/** 渲染商品/生成任务jobs页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function GenerationJobDetailPage({ params }: GenerationJobDetailPageProps) {
  const { id, jobId } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const job = product.generation_jobs.find((item) => item.id === Number(jobId));
  if (!job) {
    notFound();
  }

  const creativePlan = product.creative_plans.find((plan) => plan.id === job.creative_plan_id);
  const resultUrl = jobResultUrl(job);

  return (
    <div className="app pg-gjob">
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
          <span className="sub">GENERATION JOB</span>
        </div>
        <nav aria-label="页面导航">
          <Link href="/">工作台</Link>
          <Link href="/imports">导入中心</Link>
          <Link href={`/products/${product.id}?tab=jobs`}>任务中心</Link>
          <Link href={`/products/${product.id}/generation-jobs/${job.id}`} aria-current="page">生成任务</Link>
        </nav>
        <div className="top-actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="app-body">
        <div className="pane">
          <div className="wrap">

            {/* ============ 页头 ============ */}
            <header className="sec" style={{ marginBottom: "var(--sp-6)" }}>
              <Link
                href={`/products/${product.id}?tab=jobs`}
                className="back"
              >
                <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
                返回任务中心
              </Link>
              <div className="job-hd" style={{ marginTop: "var(--sp-3)" }}>
                <div className="job-title">
                  <p className="cap-2">{product.name}</p>
                  <h1 className="t-h2">生成任务 #{job.id}</h1>
                  <p className="mono-faint">{job.kind === "video_asset" ? "视频生成" : "图片生成"}{creativePlan ? ` · 关联方案 ${creativePlan.title}` : ""}</p>
                </div>
                <JobStatusBadge job={job} />
              </div>
            </header>

            {/* ============ 任务摘要 ============ */}
            <section className="sec">
              <div className="m-grid">
                <div className="m-card">
                  <span className="m-lbl">任务类型</span>
                  <span className="m-val">{job.kind === "video_asset" ? "视频生成" : "图片生成"}</span>
                </div>
                <div className="m-card">
                  <span className="m-lbl">关联方案</span>
                  <span className="m-val">{creativePlan?.title ?? "未知方案"}</span>
                </div>
                <div className="m-card">
                  <span className="m-lbl">开始时间</span>
                  <span className="m-val mono">{job.started_at ?? "未开始"}</span>
                </div>
                <div className="m-card">
                  <span className="m-lbl">完成时间</span>
                  <span className="m-val mono">{job.finished_at ?? "未完成"}</span>
                </div>
              </div>
            </section>

            {/* ============ 状态轨道（离散态，不画假百分比） ============ */}
            <section className="sec">
              <div className="track-wrap">
                <div className={`track ${trackTone(job.status)}`} role="img" aria-label={`任务状态：${statusText(job.status)}`}>
                  <div className="track-fill" style={{ width: trackFillWidth(job.status) }}></div>
                </div>
                <div className="track-scale">
                  <span>排队中</span>
                  <span>生成中</span>
                  <span>{statusText(job.status)}</span>
                </div>
              </div>
            </section>

            {/* ============ 失败 / 取消原因 ============ */}
            {job.error ? (
              <section className={`reason ${job.status === "cancelled" ? "is-cancelled" : "is-failed"}`}>
                <h4>{job.status === "cancelled" ? "取消原因" : "失败原因"}</h4>
                <p>{job.error}</p>
                {job.status === "failed" ? (
                  // 只有失败任务暴露重试入口；取消任务代表人工停止，不应该被误操作重新排队。
                  <form action={`/products/${product.id}/generation-jobs/${job.id}/retry`} method="post" className="mt-4">
                    <input type="hidden" name="tab" value="jobs" />
                    <button type="submit" className="btn btn-primary">
                      <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
                      重试任务
                    </button>
                  </form>
                ) : null}
              </section>
            ) : null}

            {/* ============ 任务控制 ============ */}
            {job.status === "pending" || job.status === "running" ? (
              <section className={`panel ${panelTone(job.status)}`}>
                <div className="panel-body">
                  <h2 style={{ fontSize: "var(--fs-h3)" }}>任务控制</h2>
                  <p className="cap" style={{ marginTop: ".375rem" }}>取消后任务会停止排队或释放运行锁，不会继续生成素材。</p>
                  <form action={`/products/${product.id}/generation-jobs/${job.id}/cancel`} method="post" style={{ marginTop: "var(--sp-3)" }}>
                    <input type="hidden" name="tab" value="jobs" />
                    <button type="submit" className="btn btn-ghost">
                      取消任务
                    </button>
                  </form>
                </div>
              </section>
            ) : null}

            {/* ============ 生成结果 ============ */}
            {resultUrl ? (
              <section className={`panel ${panelTone(job.status)}`}>
                <div className="panel-head">
                  <div>
                    <h3>生成结果</h3>
                    <p className="mono-faint" style={{ overflowWrap: "anywhere" }}>{resultUrl}</p>
                  </div>
                  <a
                    href={absoluteMediaUrl(resultUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm"
                  >
                    <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-ext"></use></svg>
                    打开结果
                  </a>
                </div>
                <div className="panel-body">
                  {job.kind === "video_asset" ? (
                    <video
                      src={absoluteMediaUrl(resultUrl)}
                      controls
                      className="player"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={absoluteMediaUrl(resultUrl)}
                      alt="生成结果"
                      style={{
                        width: "100%",
                        maxWidth: "560px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        background: "var(--surface-sunken)",
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>
              </section>
            ) : null}

            {/* ============ 任务事件 ============ */}
            <JobEventTimeline job={job} />

            {/* ============ JSON ============ */}
            <section className="grid-2">
              <div className="panel">
                <div className="panel-head"><h3>任务结果 JSON</h3></div>
                <div className="panel-body">
                  <pre className="code">{JSON.stringify(job.result, null, 2)}</pre>
                </div>
              </div>
              <div className="panel">
                <div className="panel-head"><h3>关联方案 JSON</h3></div>
                <div className="panel-body">
                  <pre className="code">{JSON.stringify(creativePlan?.content ?? {}, null, 2)}</pre>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

/** 渲染 JobEventTimeline 组件，集中展示任务事件时间线所需的数据、状态和操作入口。 */
function JobEventTimeline({ job }: { job: GenerationJob }) {
  return (
    <section className={`panel ${panelTone(job.status)}`}>
      <div className="panel-head">
        <div>
          <h3>任务事件</h3>
          <p className="cap" style={{ marginTop: ".25rem" }}>记录入队、开始、失败、重试和完成等生命周期节点</p>
        </div>
        <span className="badge">{job.events.length} 条</span>
      </div>

      <div className="panel-body">
        {job.events.length > 0 ? (
          <div className="trace" style={{ marginBottom: 0 }}>
            <div className="trace-hd"><span>事件轨迹 · 按时间正序</span><span>共 {job.events.length} 条</span></div>
            {job.events.map((event) => (
              <div key={event.id} className="trace-step">
                <span className={`trace-dot ${eventDotTone(event.event_type)}`} aria-hidden="true"></span>
                <div>
                  <b>{generationJobEventLabel(event.event_type)}</b>
                  <span className="sub">
                    {event.status ? generationJobStatusLabel(event.status) : "无状态"}
                    {event.worker_id ? ` · worker: ${event.worker_id}` : ""}
                  </span>
                  {event.message ? <span className="sub">{event.message}</span> : null}
                </div>
                <span className="trace-time">{event.created_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>暂无任务事件</h3>
            <p>新任务会在入队、执行和重试时写入事件。</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** 把生成任务任务事件状态映射为中文显示文本，保持页面口径一致。 */
function generationJobEventLabel(type: string): string {
  const labels: Record<string, string> = {
    failed: "执行失败",
    queued: "任务入队",
    retry_requested: "请求重试",
    retry_scheduled: "安排重试",
    started: "开始执行",
    succeeded: "执行成功",
    cancelled: "任务取消",
    timeout_checked: "超时检查",
  };
  return labels[type] ?? type;
}

/** 把生成任务任务状态状态映射为中文显示文本，保持页面口径一致。 */
function generationJobStatusLabel(status: GenerationJob["status"]): string {
  const labels: Record<GenerationJob["status"], string> = {
    failed: "失败",
    pending: "排队中",
    running: "生成中",
    succeeded: "已完成",
    cancelled: "已取消",
  };
  return labels[status];
}

/** 渲染 JobStatusBadge 组件，集中展示任务状态状态徽标所需的数据、状态和操作入口。 */
function JobStatusBadge({ job }: { job: GenerationJob }) {
  const statusLabels: Record<GenerationJob["status"], string> = {
    failed: "失败",
    pending: "排队中",
    running: "生成中",
    succeeded: "已完成",
    cancelled: "已取消",
  };
  const tone: Record<GenerationJob["status"], string> = {
    failed: "st-failed",
    pending: "st-pending",
    running: "st-running",
    succeeded: "st-succeeded",
    cancelled: "st-cancelled",
  };
  const hollow = job.status === "pending" || job.status === "cancelled";

  return (
    <span className={`st ${tone[job.status]}`}>
      <i className={hollow ? "sq-hollow" : "sq"} aria-hidden="true"></i>
      {statusLabels[job.status]}
    </span>
  );
}

/** 状态 → 轨道色调。 */
function trackTone(status: GenerationJob["status"]): string {
  const tones: Record<GenerationJob["status"], string> = {
    pending: "is-queued",
    running: "",
    succeeded: "is-done",
    failed: "is-failed",
    cancelled: "is-cancelled",
  };
  return tones[status];
}

/** 状态 → 轨道填充宽度（供应商只返回离散态，不画 0-100 假进度）。 */
function trackFillWidth(status: GenerationJob["status"]): string {
  const widths: Record<GenerationJob["status"], string> = {
    pending: "0%",
    running: "50%",
    succeeded: "100%",
    failed: "100%",
    cancelled: "100%",
  };
  return widths[status];
}

/** 状态 → 面板左侧色条 tone。 */
function panelTone(status: GenerationJob["status"]): string {
  const tones: Record<GenerationJob["status"], string> = {
    pending: "is-pending",
    running: "is-running",
    succeeded: "is-succeeded",
    failed: "is-failed",
    cancelled: "is-cancelled",
  };
  return tones[status];
}

/** 状态 → 中文（局部复用）。 */
function statusText(status: GenerationJob["status"]): string {
  return generationJobStatusLabel(status);
}

/** 事件类型 → 轨迹圆点 tone。 */
function eventDotTone(type: string): string {
  if (type === "succeeded" || type === "queued") return "done";
  if (type === "failed" || type === "cancelled" || type === "timeout_checked") return "skip";
  return "run";
}

/** 任务结果URL，封装当前页面重复使用的转换或展示规则，并统一处理空值边界。 */
function jobResultUrl(job: GenerationJob): string | null {
  const value = job.result.url;
  // 生成结果可能来自不同 worker 或历史数据，详情页只认可明确的字符串 URL。
  return typeof value === "string" && value ? value : null;
}

/** 绝对地址媒体URL，封装当前页面重复使用的转换或展示规则，并统一处理空值边界。 */
function absoluteMediaUrl(url: string): string {
  // worker 可返回完整 URL 或后端媒体相对路径；展示层统一补齐 API 域名，不改写入库结果。
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"}${url}`;
}
