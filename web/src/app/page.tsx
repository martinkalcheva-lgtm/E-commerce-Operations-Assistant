import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { ProductCreateForm } from "@/components/product-create-form";
import { StoreCreateForm } from "@/components/store-create-form";
import { getCurrentUser, getProducts, getStores } from "@/lib/api";
import { getAuthToken } from "@/lib/session";
import type { Platform, Product, Store } from "@/types";

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

const platformFilters: Array<{ value: "all" | Platform; label: string }> = [
  { value: "all", label: "全部平台" },
  { value: "douyin", label: "抖音" },
  { value: "taobao", label: "淘宝" },
  { value: "tmall", label: "天猫" },
  { value: "pinduoduo", label: "拼多多" },
  { value: "jd", label: "京东" },
];

const workflow = [
  { title: "建店建档", href: "/" },
  { title: "导入数据", href: "/imports" },
  { title: "补商品信息", href: "/?workflow=product" },
  { title: "投放建议", href: "/?workflow=ads" },
  { title: "周期复盘", href: "/?workflow=review" },
];

type HomeProps = {
  searchParams?: Promise<{ platform?: string; store?: string; demo?: string }>;
};

/** 渲染首页页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function Home({ searchParams }: HomeProps) {
  const query = searchParams ? await searchParams : {};
  const selectedPlatform = parsePlatform(query.platform);
  const selectedStoreId = parseStoreId(query.store);
  // 首页聚合商品、店铺和当前用户权限；写操作入口只在 canEdit 为 true 时展示。
  const [products, stores, token] = await Promise.all([getProducts(), getStores(), getAuthToken()]);
  const currentUser = token ? await getCurrentUser(token) : null;
  const canEdit = Boolean(currentUser?.permissions.can_edit);

  const storeById = new Map(stores.map((store) => [store.id, store]));
  const productsByStore = countProductsByStore(products);
  const activeStores = stores.filter((store) => store.status === "active").length;
  const platformCount = new Set([...stores.map((store) => store.platform), ...products.map((product) => product.platform)]).size;
  const unboundProducts = products.filter((product) => product.store_id === null).length;
  const workflowItems = buildHomeWorkflow(products, stores, unboundProducts);
  const filteredProducts = products.filter((product) => {
    if (selectedPlatform !== "all" && product.platform !== selectedPlatform) {
      return false;
    }
    if (selectedStoreId !== null && product.store_id !== selectedStoreId) {
      return false;
    }
    return true;
  });

  // 上手清单的完成态只从已有业务数据推导：有店铺 = 建档完成，有商品 = 导入完成；
  // 模型配置与 Agent 启动状态本页没有数据来源，只给入口不给状态。
  const step1Done = stores.length > 0;
  const step2Done = products.length > 0;
  const stepDoneCount = (step1Done ? 1 : 0) + (step2Done ? 1 : 0);
  const systemInitialized = stores.length > 0 || products.length > 0;
  const platformProductCounts = new Map<Platform, number>();
  for (const product of products) {
    platformProductCounts.set(product.platform, (platformProductCounts.get(product.platform) ?? 0) + 1);
  }

  return (
    <div className="app">
      <AppHeader
        current="workspace"
        sub="OPERATIONS WORKSPACE"
        brandAsH1
        userName={currentUser?.display_name ?? null}
      />

      <main className="app-body">
        <div className="pane">
          <div className="wrap">

            {/* ============ 上手清单（前置 · 反白面板） ============ */}
            <section className="panel panel-inverted sec">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">GETTING STARTED · 4 STEPS</span>
                  <h2>上线前必须完成的 4 步</h2>
                </div>
                <span className="tick">已完成 {stepDoneCount} / 4</span>
              </div>
              <div className="panel-body">
                <ol className="onboard">
                  <li className="onboard-step">
                    <span className="step-idx">STEP 01</span>
                    <h3>建店建档</h3>
                    <p>登记店铺主体与所属平台，生成店铺档案，后续所有商品与数据都挂在它下面。</p>
                    <span className={`tick ${step1Done ? "is-live" : ""}`}>{step1Done ? "已完成" : "未开始"}</span>
                    {canEdit ? (
                      <Link href="#create-store" className="btn btn-primary">开始建档</Link>
                    ) : (
                      <button type="button" className="btn" disabled>开始建档</button>
                    )}
                  </li>
                  <li className="onboard-step">
                    <span className="step-idx">STEP 02</span>
                    <h3>导入数据</h3>
                    <p>导入商品与 SKU 库存。支持 CSV 上传预览校验，确认后只写入有效行。</p>
                    <span className={`tick ${step2Done ? "is-live" : ""}`}>{step2Done ? "已完成" : "依赖 STEP 01"}</span>
                    <Link href="/imports" className="btn" aria-disabled={!step1Done || undefined}>去导入中心</Link>
                  </li>
                  <li className="onboard-step">
                    <span className="step-idx">STEP 03</span>
                    <h3>配置模型</h3>
                    <p>指定文本、图片、视频三类模型与密钥来源，配好后才能跑通文案与素材生成。</p>
                    <span className="tick">依赖 STEP 01</span>
                    <Link href="/settings" className="btn">去模型配置</Link>
                  </li>
                  <li className="onboard-step">
                    <span className="step-idx">STEP 04</span>
                    <h3>启动 Agent</h3>
                    <p>进入 Agent 中心发起运营任务，工作台开始出现真实数据与待办审批。</p>
                    <span className="tick">依赖 STEP 02 / 03</span>
                    <Link href="/agent" className="btn">启动智能体</Link>
                  </li>
                </ol>
              </div>
            </section>

            {/* ============ 演示和导入（保存原有演示数据与模板入口） ============ */}
            <section className="panel sec">
              <div className="panel-head">
                <h3>演示和导入</h3>
                <span className="badge">DEMO &amp; TEMPLATES</span>
              </div>
              <div className="panel-body">
                <p className="t-meta">
                  用演示数据快速跑通店铺、库存、投放实验和复盘链路，或下载绩效数据导入模板。
                </p>
                {query.demo === "created" ? (
                  <div className="alert is-info mt-3" role="status">
                    <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
                    <div><b>演示数据已准备好。</b></div>
                  </div>
                ) : null}
                {query.demo === "failed" ? (
                  <div className="alert is-error mt-3" role="alert">
                    <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                    <div><b>演示数据创建失败，请确认当前账号有编辑权限。</b></div>
                  </div>
                ) : null}
                {!canEdit ? (
                  <div className="alert is-warn mt-3">
                    <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                    <div><b>当前账号为只读权限，只能查看数据，不能创建或导入。</b></div>
                  </div>
                ) : null}
                <div className="row mt-3">
                  {canEdit ? (
                    <form action="/workspace/demo-data" method="post">
                      <button type="submit" className="btn btn-primary">
                        生成演示数据
                      </button>
                    </form>
                  ) : null}
                  <Link href="/workspace/templates/performance-records" className="btn">
                    下载导入模板
                  </Link>
                  {canEdit ? (
                    <Link href="/imports" className="btn btn-ghost">
                      导入中心
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            {/* ============ KPI ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">KEY FIGURES</span>
                  <h2>经营概览</h2>
                </div>
                <span className="mono-note">统计口径：全部店铺与商品 · 实时读取</span>
              </div>

              <div className="kpi-grid">
                <article className="kpi is-lead">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true"><use href="#i-db"></use></svg>店铺</span>
                  <span className={`kpi-val mono ${stores.length === 0 ? "is-idle" : ""}`}>{stores.length}</span>
                  <p className="kpi-desc">
                    {stores.length === 0
                      ? "还没有已建档的店铺。建档后这里显示店铺数与活跃店铺数。"
                      : `其中活跃店铺 ${activeStores} 个，点击下方店铺卡片查看详情。`}
                  </p>
                  <div className="kpi-foot">
                    {stores.length === 0 ? (
                      <>
                        <span className="badge badge-warn">未初始化</span>
                        <span className="t-mini mono">下一步 · STEP 01</span>
                      </>
                    ) : (
                      <span className="badge badge-online">已建档</span>
                    )}
                  </div>
                </article>

                <article className="kpi">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true"><use href="#i-search"></use></svg>商品</span>
                  <span className={`kpi-val mono ${products.length === 0 ? "is-idle" : ""}`}>{products.length}</span>
                  <p className="kpi-desc">
                    {products.length === 0
                      ? "商品池为空。可通过新建商品或导入中心写入第一批商品。"
                      : `${unboundProducts > 0 ? `${unboundProducts} 个商品待绑定店铺。` : "全部商品已绑定店铺。"}`}
                  </p>
                  <div className="kpi-foot">
                    {products.length === 0 ? (
                      <>
                        <span className="badge badge-warn">未初始化</span>
                        <span className="t-mini mono">下一步 · STEP 02</span>
                      </>
                    ) : (
                      <span className="badge badge-online">已入库</span>
                    )}
                  </div>
                </article>

                <article className="kpi">
                  <span className="kpi-lbl"><svg className="ic ic-sm" aria-hidden="true"><use href="#i-repo"></use></svg>平台</span>
                  <span className={`kpi-val mono ${platformCount === 0 ? "is-idle" : ""}`}>{platformCount}</span>
                  <p className="kpi-desc">
                    {platformCount === 0
                      ? "抖音、淘宝、天猫、拼多多、京东 5 个渠道均未有数据，先完成建店建档。"
                      : "已覆盖的平台来自店铺与商品数据。"}
                  </p>
                  <div className="kpi-foot">
                    {platformCount === 0 ? (
                      <>
                        <span className="badge badge-warn">未初始化</span>
                        <span className="t-mini mono">下一步 · STEP 01</span>
                      </>
                    ) : (
                      <span className="badge badge-online">已覆盖</span>
                    )}
                  </div>
                </article>
              </div>

              {/* 全 0 状态的替代物：引导面板，而不是三个没有意义的零 */}
              {!systemInitialized ? (
                <div className="callout">
                  <div>
                    <span className="eyebrow">SYSTEM NOT INITIALIZED</span>
                    <h3>系统尚未初始化</h3>
                    <p>三个统计项全为 0 说明不是经营结果，而是环境尚未建档。先把下面两步做完，工作台会立刻有数据。</p>
                  </div>
                  <div className="guide">
                    <div className="guide-item">
                      <span className="guide-idx">1</span>
                      <div className="guide-text">
                        <b>建店建档</b>
                        <span>登记主体与平台，生成店铺档案</span>
                      </div>
                      {canEdit ? (
                        <Link href="#create-store" className="btn btn-primary">去建档</Link>
                      ) : (
                        <Link href="/login" className="btn">登录后建档</Link>
                      )}
                    </div>
                    <div className="guide-item">
                      <span className="guide-idx">2</span>
                      <div className="guide-text">
                        <b>导入数据</b>
                        <span>上传商品与 SKU 库存 CSV，先预览再入库</span>
                      </div>
                      <Link href="/imports" className="btn">去导入中心</Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* ============ 新建店铺 / 新建商品（canEdit） ============ */}
            {canEdit ? (
              <section className="grid-2 sec" id="create">
                <div className="panel" id="create-store">
                  <div className="panel-head"><h3>新建店铺</h3><span className="badge">STEP 01</span></div>
                  <div className="panel-body">
                    <StoreCreateForm />
                  </div>
                </div>
                <div className="panel" id="create-product">
                  <div className="panel-head"><h3>新建单品</h3><span className="badge">STEP 02</span></div>
                  <div className="panel-body">
                    <ProductCreateForm stores={stores} />
                  </div>
                </div>
              </section>
            ) : null}

            {/* ============ 平台筛选 + 店铺视图 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">CHANNELS &amp; STORES</span>
                  <h2>平台与店铺</h2>
                </div>
                <span className="mono-note">已覆盖 {platformCount} 个平台</span>
              </div>

              <div className="tabs" role="tablist" aria-label="平台筛选">
                {platformFilters.map((platform) => {
                  const count = platform.value === "all"
                    ? products.length
                    : platformProductCounts.get(platform.value) ?? 0;
                  const selected = selectedPlatform === platform.value;
                  return (
                    <Link
                      key={platform.value}
                      href={platform.value === "all" ? "/" : `/?platform=${platform.value}`}
                      className="tab"
                      role="tab"
                      aria-selected={selected ? "true" : "false"}
                    >
                      {platform.label} <span className="n">{count}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>店铺视图</h3>
                  <span className="badge">
                    {selectedStoreId !== null && storeById.has(selectedStoreId)
                      ? `已选店铺 · ${storeById.get(selectedStoreId)?.name ?? ""}`
                      : selectedPlatform === "all" ? "全部平台" : platformLabels[selectedPlatform]}
                  </span>
                </div>
                <div className="panel-body">
                  {stores.length === 0 ? (
                    /* 空态要有引导性：说清楚为什么空、下一步做什么 */
                    <div className="empty">
                      <svg className="ic ic-lg" aria-hidden="true" style={{ color: "var(--faint)" }}><use href="#i-db"></use></svg>
                      <h4 className="mt-3">还没有已建档的店铺</h4>
                      <p>店铺是一切数据的地基：商品、SKU、库存与运营任务都必须挂在某个店铺下。没有店铺，平台筛选和经营概览都无法产生有效数据。</p>
                      <div className="empty-actions">
                        {canEdit ? (
                          <Link href="#create-store" className="btn btn-primary"><svg className="ic" aria-hidden="true"><use href="#i-arrow-r"></use></svg>开始建店建档</Link>
                        ) : (
                          <Link href="/login" className="btn btn-primary"><svg className="ic" aria-hidden="true"><use href="#i-arrow-r"></use></svg>登录后建店建档</Link>
                        )}
                      </div>
                      <p className="empty-next">
                        <svg className="ic ic-sm" aria-hidden="true"><use href="#i-chev"></use></svg>
                        建档完成后，这里会显示店铺卡片：状态 · 商品数 · 负责人
                      </p>
                    </div>
                  ) : (
                    <div className="grid-2">
                      {stores.map((store) => (
                        <StoreSummaryCard
                          key={store.id}
                          store={store}
                          productCount={productsByStore.get(store.id) ?? 0}
                          selected={store.id === selectedStoreId}
                        />
                      ))}
                    </div>
                  )}
                  {unboundProducts > 0 ? (
                    <div className="alert is-warn mt-3">
                      <svg className="ic" aria-hidden="true"><use href="#i-warn"></use></svg>
                      <div>
                        <b>未绑定店铺商品</b>
                        <p>{unboundProducts} 个商品需要补店铺归属。</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {/* ============ 商品池表格 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">PRODUCT POOL</span>
                  <h2>商品池</h2>
                </div>
                <div className="row">
                  <span className="badge">
                    <svg className="ic ic-sm" aria-hidden="true"><use href="#i-search"></use></svg>
                    {filteredProducts.length} / {products.length}
                  </span>
                  {canEdit ? (
                    <Link href="/imports" className="btn">批量导入</Link>
                  ) : null}
                </div>
              </div>

              <div className="panel">
                {filteredProducts.length === 0 ? (
                  <div className="panel-body">
                    <div className="empty">
                      <h4>当前筛选下没有商品</h4>
                      <p>可以切换平台筛选，或新建商品、前往导入中心写入第一批数据。</p>
                      <div className="empty-actions">
                        <Link href="/" className="btn">清除筛选</Link>
                        {canEdit ? (
                          <Link href="/imports" className="btn btn-primary">去导入中心</Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th scope="col">商品</th>
                            <th scope="col">店铺</th>
                            <th scope="col">平台</th>
                            <th scope="col">售价</th>
                            <th scope="col">卖点</th>
                            <th scope="col">动作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <ProductRow key={product.id} product={product} store={product.store_id ? storeById.get(product.store_id) : null} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="tbl-note">
                      <svg className="ic ic-sm" aria-hidden="true"><use href="#i-doc"></use></svg>
                      <span>共 {filteredProducts.length} 个商品（筛选自 {products.length} 个）。卖点为空的商品可进入单品页补充，生成素材前建议先补齐。</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ============ 运营链路入口 ============ */}
            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">WORKFLOWS</span>
                  <h2>运营链路</h2>
                </div>
                <span className="mono-note">围绕每个商品补竞品、出素材、做投放实验和复盘</span>
              </div>
              <div className="tpl-grid">
                {workflow.map((item) => {
                  const workflowItem = workflowItems.get(item.title);
                  return (
                    <Link key={item.title} href={workflowItem?.href ?? item.href} className="panel tpl">
                      <div className="panel-head">
                        <h3 className="t-h3">{item.title}</h3>
                        <span className="badge badge-accent">{workflowItem?.count ?? 0}</span>
                      </div>
                      <div className="panel-body">
                        <p className="t-meta">{workflowItem?.hint ?? "查看下一步"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

/** 构建首页工作流，从现有业务数据推导稳定的页面展示模型，不在渲染阶段修改源数据。 */
function buildHomeWorkflow(products: Product[], stores: Store[], unboundProducts: number): Map<string, { count: number; hint: string; href: string }> {
  // 工作流卡片只用已有数据提示下一步，不自动创建诊断、素材或投放实验。
  const missingSellingPoints = products.filter((product) => product.selling_points.length === 0).length;
  const missingPlatformIds = products.filter((product) => !product.external_product_id).length;
  const productsReadyForOps = products.filter((product) => product.store_id !== null && product.selling_points.length > 0).length;

  return new Map([
    [
      "建店建档",
      {
        count: stores.length + products.length,
        hint: unboundProducts > 0 ? `${unboundProducts} 个商品待绑定店铺` : "店铺和商品入口",
        href: "/",
      },
    ],
    [
      "导入数据",
      {
        count: missingPlatformIds,
        hint: missingPlatformIds > 0 ? `${missingPlatformIds} 个商品待补平台 ID` : "导入商品/SKU/经营数据",
        href: "/imports",
      },
    ],
    [
      "补商品信息",
      {
        count: missingSellingPoints,
        hint: missingSellingPoints > 0 ? `${missingSellingPoints} 个商品待补卖点` : "进入单品运营闭环",
        href: firstProductHref(products, "overview"),
      },
    ],
    [
      "投放建议",
      {
        count: productsReadyForOps,
        hint: productsReadyForOps > 0 ? "从素材和链接生成投放建议" : "先补商品基础信息",
        href: firstProductHref(products, "ads"),
      },
    ],
    [
      "周期复盘",
      {
        count: products.length,
        hint: products.length > 0 ? "回填经营数据后生成复盘" : "先创建商品",
        href: firstProductHref(products, "review"),
      },
    ],
  ]);
}

/** 首个商品链接，从现有业务数据推导稳定的页面展示模型，不在渲染阶段修改源数据。 */
function firstProductHref(products: Product[], tab: string): string {
  return products[0] ? `/products/${products[0].id}?tab=${tab}` : "/";
}

/** 渲染 StoreSummaryCard 组件，集中展示店铺汇总卡片所需的数据、状态和操作入口。 */
function StoreSummaryCard({
  store,
  productCount,
  selected,
}: {
  store: Store;
  productCount: number;
  selected: boolean;
}) {
  return (
    <article className={`kpi ${selected ? "is-lead" : ""}`}>
      <span className="kpi-lbl">
        <svg className="ic ic-sm" aria-hidden="true"><use href="#i-server"></use></svg>
        {store.name}
      </span>
      <div className="row" style={{ gap: ".5rem" }}>
        <span className={`badge ${store.status === "active" ? "badge-online" : store.status === "paused" ? "badge-warn" : ""}`}>
          {store.status === "active" ? "启用" : store.status === "paused" ? "暂停" : "关闭"}
        </span>
        <span className="badge">{platformLabels[store.platform]}</span>
      </div>
      <div className="kpi-foot">
        <span className="t-mini mono">商品 {productCount} · 负责人 {store.owner_name ?? "-"}</span>
        <span className="cell-actions">
          <Link href={`/?store=${store.id}`} className="btn btn-sm">筛选商品</Link>
          <Link href={`/stores/${store.id}`} className="btn btn-sm btn-primary">店铺详情</Link>
        </span>
      </div>
    </article>
  );
}

/** 渲染 ProductRow 组件，集中展示商品行所需的数据、状态和操作入口。 */
function ProductRow({ product, store }: { product: Product; store: Store | null | undefined }) {
  return (
    <tr>
      <td>
        <div className="cell-goods">
          <span className="tbl-cover" aria-hidden="true">IMG</span>
          <span>
            <b>{product.name}</b>
            <span>{product.category ?? "未分类"}</span>
          </span>
        </div>
      </td>
      <td>{store?.name ?? "未绑定"}</td>
      <td>{platformLabels[product.platform]}</td>
      <td className="cell-price">{product.price ? `¥${product.price}` : "-"}</td>
      <td>
        <div className="cell-actions">
          {product.selling_points.length === 0 ? (
            <span className="badge">待补卖点</span>
          ) : (
            product.selling_points.slice(0, 3).map((point) => (
              <span key={point} className="badge badge-accent">{point}</span>
            ))
          )}
        </div>
      </td>
      <td>
        <div className="cell-actions">
          <Link href={`/products/${product.id}`} className="btn btn-sm">
            进入
            <svg className="ic ic-sm" aria-hidden="true"><use href="#i-arrow-r"></use></svg>
          </Link>
        </div>
      </td>
    </tr>
  );
}

/** 统计商品by店铺，封装当前页面重复使用的转换或展示规则，并统一处理空值边界。 */
function countProductsByStore(products: Product[]): Map<number, number> {
  return products.reduce((counts, product) => {
    if (product.store_id !== null) {
      counts.set(product.store_id, (counts.get(product.store_id) ?? 0) + 1);
    }
    return counts;
  }, new Map<number, number>());
}

/** 解析平台，把不可信表单或 JSON 值转换为页面逻辑可安全使用的类型。 */
function parsePlatform(value: string | undefined): "all" | Platform {
  // URL 筛选参数做白名单校验，避免无效平台值影响服务端渲染结果。
  if (!value || value === "all") {
    return "all";
  }
  return Object.hasOwn(platformLabels, value) ? (value as Platform) : "all";
}

/** 解析店铺ID，把不可信表单或 JSON 值转换为页面逻辑可安全使用的类型。 */
function parseStoreId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const storeId = Number(value);
  return Number.isInteger(storeId) && storeId > 0 ? storeId : null;
}
