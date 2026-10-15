import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { PerformanceImportCenterPanel, ProductImportPanel, SkuInventoryImportPanel } from "@/components/product-import-panel";

const templates = [
  {
    title: "商品档案模板",
    code: "PRODUCT",
    anchor: "tpl-product",
    description: "用于导入店铺商品、平台、价格、受众、卖点和平台商品 ID。",
    href: "/workspace/templates/products",
  },
  {
    title: "SKU 库存模板",
    code: "SKU",
    anchor: "tpl-sku",
    description: "用于导入 SKU 编码、规格、初始库存、预警线、仓位和平台 SKU ID。",
    href: "/workspace/templates/sku-inventory",
  },
  {
    title: "经营数据模板",
    code: "OPERATION",
    anchor: "tpl-operation",
    description: "用于导入曝光、点击、成交、花费、成交额等投放复盘数据。",
    href: "/workspace/templates/performance-records",
  },
  {
    title: "字段映射模板",
    code: "MAPPING",
    anchor: "tpl-mapping",
    description: "用于把淘宝、天猫、拼多多、京东、抖音等平台字段映射到系统字段。",
    href: "/workspace/templates/field-mapping",
  },
];

const capabilities = [
  { title: "商品 / SKU 导入预览", status: "已接入", tone: "badge-online", note: "先预览校验，确认后只导入有效行" },
  { title: "经营数据 CSV", status: "已支持预览", tone: "badge-info", note: "按商品名称或平台商品 ID 匹配" },
  { title: "字段映射模板", status: "已提供", tone: "badge", note: "平台字段到系统字段的对照表" },
];

const railTemplateLinks = [
  { href: "#tpl-product", label: "商品档案模板" },
  { href: "#tpl-sku", label: "SKU 库存模板" },
  { href: "#tpl-operation", label: "经营数据模板" },
  { href: "#tpl-mapping", label: "字段映射模板" },
];

const railFormLinks = [
  { href: "#form-product", label: "商品数据导入" },
  { href: "#form-sku", label: "SKU 库存导入" },
  { href: "#form-performance", label: "经营数据导入" },
];

/** 渲染导入页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default function ImportCenterPage() {
  return (
    <div className="app">
      <AppHeader current="imports" sub=":80 / IMPORTS" />

      <div className="app-body has-rail">
        {/* 左栏锚点导航 */}
        <nav className="rail" aria-label="导入中心导航">
          <div className="rail-group">
            <span className="rail-cap">工作台</span>
            <Link className="rail-link" href="/" aria-current="page">
              <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-doc"></use></svg>
              <span>导入中心</span>
              <span className="code">/imports</span>
            </Link>
            <Link className="rail-link" href="/">
              <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-server"></use></svg>
              <span>运营智能体</span>
              <span className="code">/workspace</span>
            </Link>
          </div>

          <div className="rail-group">
            <span className="rail-cap">模板下载</span>
            {railTemplateLinks.map((item) => (
              <Link key={item.href} className="rail-link" href={item.href}>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="rail-group">
            <span className="rail-cap">导入表单</span>
            {railFormLinks.map((item) => (
              <Link key={item.href} className="rail-link" href={item.href}>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="rail-group">
            <span className="rail-cap">说明</span>
            <Link className="rail-link" href="#matrix">
              <span>已接入能力矩阵</span>
              <span className="code">{capabilities.length}</span>
            </Link>
          </div>
        </nav>

        {/* 主栏 */}
        <main className="pane">
          <div className="stack">

            {/* 页头 */}
            <header className="page-hd">
              <span className="eyebrow">DATA IMPORT · 数据接入</span>
              <h1 className="t-h1">导入中心</h1>
              <p className="t-lead">
                运营数据的唯一入口。先下载模板对齐字段，再选择对应 CSV 表单上传 ——
                预览阶段就把错误行拦在库外，不让一次手滑的表格污染经营数据。
              </p>
              <div className="row">
                <span className="badge badge-accent">{templates.length} TEMPLATES</span>
                <span className="badge">3 CSV FORMS</span>
                <span className="badge">{capabilities.length} CAPABILITIES</span>
                <span className="status-led" aria-hidden="true"></span>
                <span className="t-mini mono">预览不写库 · 确认后才导入</span>
              </div>
            </header>

            {/* 模板下载 */}
            <section className="stack-4 reveal" id="templates" aria-labelledby="h-tpl">
              <div className="row row-between">
                <div className="stack-2">
                  <span className="eyebrow">STEP 00 · 模板</span>
                  <h2 className="t-h2" id="h-tpl">模板下载</h2>
                </div>
                <span className="badge mono">TEMPLATES · CSV WITH HEADER</span>
              </div>

              <div className="tpl-grid">
                {templates.map((template, index) => (
                  <article className="panel tpl" id={template.anchor} key={template.href}>
                    <div className="panel-head">
                      <span className="tpl-ic" aria-hidden="true">
                        <svg className="ic"><use href={index % 2 === 0 ? "#i-doc" : "#i-db"}></use></svg>
                      </span>
                      <h3 className="t-h3">{template.title}</h3>
                    </div>
                    <div className="panel-body stack-3">
                      <div className="row row-between">
                        <span className="t-mini mono">{template.code}</span>
                        <span className="badge">CSV 模板</span>
                      </div>
                      <p className="t-meta">{template.description}</p>
                      <Link href={template.href} className="btn btn-sm card-foot">
                        <svg className="ic ic-sm" aria-hidden="true" focusable="false"><use href="#i-search"></use></svg>
                        <span>下载示例 CSV</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* 三个 CSV 导入表单（交互组件，接口调用保持原样） */}
            <div id="form-product" className="reveal"><ProductImportPanel /></div>
            <div id="form-sku" className="reveal"><SkuInventoryImportPanel /></div>
            <div id="form-performance" className="reveal"><PerformanceImportCenterPanel /></div>

            {/* 已接入能力矩阵 */}
            <section className="panel reveal" id="matrix" aria-labelledby="h-matrix">
              <div className="panel-head">
                <h3 id="h-matrix">已接入能力</h3>
                <span className="badge mono">CAPABILITY MATRIX · {capabilities.length}</span>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">能力</th>
                      <th scope="col">状态</th>
                      <th scope="col">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capabilities.map((capability) => (
                      <tr key={capability.title}>
                        <td>{capability.title}</td>
                        <td><span className={`badge ${capability.tone}`}>{capability.status}</span></td>
                        <td>{capability.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel-body">
                <p className="t-mini">
                  导入统一走「预览 → 确认」两段式：预览不写库，确认导入时后端逐行校验，错误行会阻塞整批导入并在结果里列出。
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
