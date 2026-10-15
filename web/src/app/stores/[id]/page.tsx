import Link from "next/link";
import { notFound } from "next/navigation";

import { InventoryAdvicePanel } from "@/components/inventory-advice-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser, getProducts, getStore, getStoreInventoryMovements, getStoreInventorySummary } from "@/lib/api";
import { getAuthToken } from "@/lib/session";
import type { StoreInventoryMovementRow, StoreInventoryRow } from "@/types";
import type { Platform, Product } from "@/types";

import "./page.store.css";

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  taobao: "淘宝",
  tmall: "天猫",
  pinduoduo: "拼多多",
  jd: "京东",
  tiktok_shop: "TikTok",
  amazon: "Amazon",
  other: "其他",
};

type StorePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ inventory?: string }>;
};

/** 渲染stores页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const [store, products, inventorySummary, inventoryMovements, token] = await Promise.all([
    getStore(id),
    getProducts(),
    getStoreInventorySummary(id),
    getStoreInventoryMovements(id),
    getAuthToken(),
  ]);

  if (!store) {
    notFound();
  }

  const storeProducts = products.filter((product) => product.store_id === store.id);
  const activeProducts = storeProducts.filter((product) => product.platform_status !== "offline").length;
  const unmappedProducts = storeProducts.filter((product) => !product.external_product_id).length;
  const lowStockRows = inventorySummary?.rows.filter((row) => row.is_low_stock) ?? [];
  const inventoryRows = query.inventory === "low" ? lowStockRows : inventorySummary?.rows ?? [];
  const workflowSteps = buildStoreWorkflowSteps(store.id, storeProducts, inventorySummary?.rows ?? [], lowStockRows, unmappedProducts);
  const currentUser = token ? await getCurrentUser(token) : null;
  const canEdit = Boolean(currentUser?.permissions.can_edit);

  return (
    <div className="app pg-store">
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
          <span className="sub">STORES / :id</span>
        </div>
        <nav aria-label="页面导航">
          <Link href="/">工作台</Link>
          <Link href="/imports">导入中心</Link>
          <Link href={`/stores/${store.id}`} aria-current="page">店铺详情</Link>
        </nav>
        <div className="top-actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="app-body">
        <div className="pane">
          <div className="wrap stack-5">

            {/* ============ 店铺身份 ============ */}
            <header className="sec" style={{ marginBottom: 0 }}>
              <Link href="/" className="back">
                <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
                返回工作台
              </Link>
              <div className="store-hd" style={{ marginTop: "var(--sp-3)" }}>
                <div className="store-id">
                  <span className="store-mark" aria-hidden="true">
                    <svg className="ic ic-lg" aria-hidden="true" focusable="false"><use href="#i-server"></use></svg>
                  </span>
                  <div>
                    <span className="eyebrow">{platformLabels[store.platform]}</span>
                    <h1 className="t-h2" style={{ marginTop: ".25rem" }}>{store.name}</h1>
                    <p className="cap" style={{ marginTop: ".375rem" }}>
                      {store.owner_name ? `负责人：${store.owner_name}` : "未设置负责人"}
                    </p>
                  </div>
                </div>
                <div className="store-actions">
                  <span className={`badge ${store.status === "active" ? "badge-online" : "badge"}`}>
                    {store.status === "active" ? "启用" : store.status === "paused" ? "暂停" : "关闭"}
                  </span>
                  <Link href={`/?store=${store.id}`} className="btn btn-sm">回首页筛选</Link>
                </div>
              </div>
            </header>

            {/* ============ KPI ============ */}
            <section className="sec" style={{ marginBottom: 0 }}>
              <div className="kpi-grid">
                <article className="kpi">
                  <span className="kpi-lbl">店铺商品</span>
                  <span className="kpi-val">{storeProducts.length}</span>
                </article>
                <article className="kpi">
                  <span className="kpi-lbl">在营商品</span>
                  <span className="kpi-val">{activeProducts}</span>
                </article>
                <article className={`kpi ${unmappedProducts > 0 ? "is-idle" : ""}`}>
                  <span className="kpi-lbl">待补平台映射</span>
                  <span className="kpi-val">{unmappedProducts}</span>
                </article>
                <article className="kpi is-lead">
                  <span className="kpi-lbl">可用库存</span>
                  <span className="kpi-val">{inventorySummary?.total_available_quantity ?? 0}</span>
                </article>
              </div>
            </section>

            <StoreWorkflowPanel steps={workflowSteps} />

            {/* ============ 库存异常提示 ============ */}
            {lowStockRows.length > 0 ? (
              <section className="alert" role="alert">
                <div className="alert-hd">
                  <svg className="alert-ic" aria-hidden="true" focusable="false"><use href="#i-warn"></use></svg>
                  <div>
                    <h3>库存异常提示</h3>
                    <p>
                      {lowStockRows.length} 个 SKU 可用库存已低于或等于预警线，建议优先补货或调整投放节奏。
                    </p>
                  </div>
                </div>
                <Link
                  href={`/stores/${store.id}?inventory=low`}
                  className="btn"
                >
                  只看低库存
                </Link>
                <div className="sku-chips">
                  {lowStockRows.slice(0, 4).map((row) => (
                    <Link
                      key={row.sku_id}
                      href={`/products/${row.product_id}?tab=overview`}
                      className="sku-chip"
                    >
                      <span className="nm">{row.product_name}</span>
                      <span className="mono-faint">{row.sku_code}</span>
                      <span className="qty">可用 {row.available_quantity}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <InventoryWorkflowPanel storeId={store.id} inventoryRows={inventorySummary?.rows ?? []} lowStockRows={lowStockRows} />

            <InventoryAdvicePanel storeId={store.id} canEdit={canEdit} />

            {/* ============ 店铺商品 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Store Products</span>
                  <h2>店铺商品</h2>
                  <p className="cap" style={{ marginTop: ".25rem" }}>从店铺维度进入单品运营闭环</p>
                </div>
                <div className="sec-hd-end">
                  <span className="badge">{storeProducts.length} 个商品</span>
                </div>
              </div>

              <div className="panel">
                {storeProducts.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty">
                      <h3>还没有绑定商品</h3>
                      <p>这个店铺还没有绑定商品，可以回到首页创建商品并选择该店铺。</p>
                      <div className="empty-actions">
                        <Link href={`/?store=${store.id}`} className="btn btn-primary">去创建商品</Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="tbl-wrap">
                    <table className="tbl tbl-scroll-sm">
                      <caption className="sr-only">店铺商品列表</caption>
                      <thead>
                        <tr>
                          <th scope="col">商品</th>
                          <th scope="col">平台状态</th>
                          <th scope="col">售价</th>
                          <th scope="col">卖点</th>
                          <th scope="col">动作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeProducts.map((product) => (
                          <StoreProductRow key={product.id} product={product} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ============ 库存概览 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Inventory</span>
                  <h2>库存概览</h2>
                  <p className="cap" style={{ marginTop: ".25rem" }}>按 SKU 汇总库存、锁定量、可用量和低库存风险</p>
                </div>
                <div className="sec-hd-end">
                  <span className="badge badge-warn">低库存 {inventorySummary?.low_stock_count ?? 0}</span>
                </div>
              </div>

              <div className="tabs" role="tablist" aria-label="库存筛选">
                <Link
                  href={`/stores/${store.id}`}
                  className="tab"
                  aria-selected={query.inventory === "low" ? "false" : "true"}
                >
                  全部库存
                </Link>
                <Link
                  href={`/stores/${store.id}?inventory=low`}
                  className="tab"
                  aria-selected={query.inventory === "low" ? "true" : "false"}
                >
                  低库存 <span className="n">{inventorySummary?.low_stock_count ?? 0}</span>
                </Link>
              </div>

              <div className="panel">
                {!inventorySummary || inventoryRows.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty">
                      <h3>{query.inventory === "low" ? "当前没有低库存 SKU" : "暂无 SKU 库存数据"}</h3>
                      <p>这个店铺还没有 SKU 库存数据，后续可从商品详情创建 SKU 并登记库存。</p>
                    </div>
                  </div>
                ) : (
                  <div className="tbl-wrap">
                    <table className="tbl tbl-scroll">
                      <caption className="sr-only">SKU 库存汇总</caption>
                      <thead>
                        <tr>
                          <th scope="col">SKU</th>
                          <th scope="col">商品</th>
                          <th scope="col">现货</th>
                          <th scope="col">锁定</th>
                          <th scope="col">可用</th>
                          <th scope="col">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryRows.map((row) => (
                          <InventoryRow key={row.sku_id} row={row} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ============ 库存流水 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">Movements</span>
                  <h2>库存流水</h2>
                  <p className="cap" style={{ marginTop: ".25rem" }}>集中查看店铺最近库存变化</p>
                </div>
                <div className="sec-hd-end">
                  <span className="badge">最近 {inventoryMovements.length}</span>
                </div>
              </div>

              <div className="panel">
                {inventoryMovements.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty">
                      <h3>暂无库存流水</h3>
                      <p>入库、出库、盘点、锁定与释放都会在这里留下记录。</p>
                    </div>
                  </div>
                ) : (
                  <div className="tbl-wrap">
                    <table className="tbl tbl-scroll">
                      <caption className="sr-only">库存流水记录</caption>
                      <thead>
                        <tr>
                          <th scope="col">类型</th>
                          <th scope="col">商品</th>
                          <th scope="col">SKU</th>
                          <th scope="col">现货变化</th>
                          <th scope="col">锁定变化</th>
                          <th scope="col">原因</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryMovements.map((movement) => (
                          <InventoryMovementRow key={movement.id} movement={movement} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

type StoreWorkflowStep = {
  key: string;
  title: string;
  href: string;
  done: boolean;
  hint: string;
};

/** 渲染 StoreWorkflowPanel 组件，集中展示店铺工作流面板所需的数据、状态和操作入口。 */
function StoreWorkflowPanel({ steps }: { steps: StoreWorkflowStep[] }) {
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];

  return (
    <section className="sec">
      <div className="sec-hd">
        <div>
          <span className="eyebrow">Store Workflow</span>
          <h2>店铺运营流程</h2>
        </div>
        <div className="sec-hd-end">
          <span className="cap">{nextStep.done ? "店铺基础流程已跑通。" : `下一步：${nextStep.title}`}</span>
          <Link
            href={nextStep.href}
            className="btn btn-primary"
          >
            继续处理
            <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
          </Link>
        </div>
      </div>

      <div className="steps steps-5">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={`step ${step.done ? "is-done" : "is-open"}`}
          >
            <div className="step-hd">
              <h4>{step.title}</h4>
              {step.done ? (
                <svg className="ic ic-sm" aria-hidden="true" focusable="false" style={{ color: "var(--success)" }}><use href="#i-check"></use></svg>
              ) : (
                <svg className="ic ic-sm" aria-hidden="true" focusable="false" style={{ color: "var(--warn)" }}><use href="#i-warn"></use></svg>
              )}
            </div>
            <p>{step.hint}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** 构建店铺工作流steps，从现有业务数据推导稳定的页面展示模型，不在渲染阶段修改源数据。 */
function buildStoreWorkflowSteps(
  storeId: number,
  products: Product[],
  inventoryRows: StoreInventoryRow[],
  lowStockRows: StoreInventoryRow[],
  unmappedProducts: number,
): StoreWorkflowStep[] {
  return [
    {
      key: "store",
      title: "建店",
      href: `/stores/${storeId}`,
      done: true,
      hint: "店铺档案已创建",
    },
    {
      key: "products",
      title: "商品",
      href: `/?store=${storeId}`,
      done: products.length > 0,
      hint: products.length > 0 ? `${products.length} 个商品已归属店铺` : "创建或导入商品",
    },
    {
      key: "inventory",
      title: "SKU/库存",
      href: `/stores/${storeId}`,
      done: inventoryRows.length > 0,
      hint: inventoryRows.length > 0 ? `${inventoryRows.length} 个 SKU 有库存记录` : "进入商品维护 SKU 和库存",
    },
    {
      key: "mapping",
      title: "数据映射",
      href: "/imports",
      done: products.length > 0 && unmappedProducts === 0,
      hint: unmappedProducts > 0 ? `${unmappedProducts} 个商品待补平台映射` : "导入经营数据或字段映射",
    },
    {
      key: "risk",
      title: "异常处理",
      href: lowStockRows.length > 0 ? `/stores/${storeId}?inventory=low` : `/stores/${storeId}`,
      done: inventoryRows.length > 0 && lowStockRows.length === 0,
      hint: lowStockRows.length > 0 ? `${lowStockRows.length} 个 SKU 低库存` : "库存异常入口",
    },
  ];
}

/** 渲染 InventoryWorkflowPanel 组件，集中展示库存工作流面板所需的数据、状态和操作入口。 */
function InventoryWorkflowPanel({
  storeId,
  inventoryRows,
  lowStockRows,
}: {
  storeId: number;
  inventoryRows: StoreInventoryRow[];
  lowStockRows: StoreInventoryRow[];
}) {
  const hasInventory = inventoryRows.length > 0;
  const hasLowStock = lowStockRows.length > 0;
  const steps = [
    {
      title: "发现低库存",
      done: hasInventory,
      hint: hasLowStock ? `${lowStockRows.length} 个 SKU 需要处理` : "当前无低库存风险",
      href: hasLowStock ? `/stores/${storeId}?inventory=low` : `/stores/${storeId}`,
    },
    {
      title: "分析销量",
      done: false,
      hint: "导入经营数据后判断补货优先级",
      href: "/imports",
    },
    {
      title: "生成建议",
      done: false,
      hint: "使用库存异常 AI/规则建议",
      href: `/stores/${storeId}`,
    },
    {
      title: "人工确认",
      done: !hasLowStock && hasInventory,
      hint: "补货、调拨和投放节奏由人工确认",
      href: `/stores/${storeId}`,
    },
  ];

  return (
    <section className="sec">
      <div className="sec-hd">
        <div>
          <span className="eyebrow">Inventory Workflow</span>
          <h2>库存处理流程</h2>
          <p className="cap" style={{ marginTop: ".25rem" }}>围绕低库存、销量数据、补货建议和人工确认推进</p>
        </div>
        <div className="sec-hd-end">
          <Link
            href={hasLowStock ? `/stores/${storeId}?inventory=low` : "/imports"}
            className="btn"
          >
            {hasLowStock ? "查看低库存" : "导入经营数据"}
            <svg className="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
          </Link>
        </div>
      </div>

      <div className="steps steps-4">
        {steps.map((step) => (
          <Link
            key={step.title}
            href={step.href}
            className={`step ${step.done ? "is-done" : "is-open"}`}
          >
            <div className="step-hd">
              <h4>{step.title}</h4>
              {step.done ? (
                <svg className="ic ic-sm" aria-hidden="true" focusable="false" style={{ color: "var(--success)" }}><use href="#i-check"></use></svg>
              ) : (
                <svg className="ic ic-sm" aria-hidden="true" focusable="false" style={{ color: "var(--warn)" }}><use href="#i-warn"></use></svg>
              )}
            </div>
            <p>{step.hint}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** 渲染 StoreProductRow 组件，集中展示店铺商品行所需的数据、状态和操作入口。 */
function StoreProductRow({ product }: { product: Product }) {
  return (
    <tr>
      <td>
        <div className="cell-goods">
          <span>
            <b>{product.name}</b>
            <span>{product.category ?? "未分类"}</span>
          </span>
        </div>
      </td>
      <td>{product.platform_status ?? "未同步"}</td>
      <td className="cell-price">{product.price ? `¥${product.price}` : "-"}</td>
      <td>
        <div className="tag-row">
          {product.selling_points.slice(0, 3).map((point) => (
            <span key={point} className="tag">{point}</span>
          ))}
        </div>
      </td>
      <td>
        <div className="cell-actions">
          <Link
            href={`/products/${product.id}`}
            className="btn btn-sm"
          >
            进入
            <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-arrow-r"></use></svg>
          </Link>
        </div>
      </td>
    </tr>
  );
}

/** 渲染 InventoryRow 组件，集中展示库存行所需的数据、状态和操作入口。 */
function InventoryRow({ row }: { row: StoreInventoryRow }) {
  return (
    <tr>
      <td>
        <div className="cell-goods">
          <span>
            <b>{row.sku_name}</b>
            <span>{row.sku_code}</span>
          </span>
        </div>
      </td>
      <td>{row.product_name}</td>
      <td className="cell-num">{row.quantity}</td>
      <td className="cell-num">{row.locked_quantity}</td>
      <td className="cell-num">{row.available_quantity}</td>
      <td>
        <span className={`badge ${row.is_low_stock ? "badge-warn" : "badge-online"}`}>
          {row.is_low_stock ? `低库存 <= ${row.warning_threshold}` : "正常"}
        </span>
      </td>
    </tr>
  );
}

/** 渲染 InventoryMovementRow 组件，集中展示库存流水行所需的数据、状态和操作入口。 */
function InventoryMovementRow({ movement }: { movement: StoreInventoryMovementRow }) {
  return (
    <tr>
      <td><span className="badge">{movementTypeLabel(movement.movement_type)}</span></td>
      <td>
        <Link href={`/products/${movement.product_id}?tab=overview`} className="cell-link">
          {movement.product_name}
        </Link>
      </td>
      <td className="mono-faint">{movement.sku_code}</td>
      <td className={movement.quantity_delta > 0 ? "delta-pos" : movement.quantity_delta < 0 ? "delta-neg" : "delta-zero"}>
        {formatSigned(movement.quantity_delta)}
      </td>
      <td className={movement.locked_delta > 0 ? "delta-pos" : movement.locked_delta < 0 ? "delta-neg" : "delta-zero"}>
        {formatSigned(movement.locked_delta)}
      </td>
      <td style={{ minWidth: 0, overflowWrap: "anywhere" }}>{movement.reason ?? movement.created_at}</td>
    </tr>
  );
}

/** 把流水type状态映射为中文显示文本，保持页面口径一致。 */
function movementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    inbound: "入库",
    outbound: "出库",
    adjustment: "盘点",
    lock: "锁定",
    release: "释放",
  };
  return labels[type] ?? type;
}

/** 格式化带符号，统一空值、本地化和页面展示规则，避免各组件重复格式化。 */
function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}
