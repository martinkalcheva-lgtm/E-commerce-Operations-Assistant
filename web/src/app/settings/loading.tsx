import { AppHeader } from "@/components/app-header";

/** 渲染模型配置页的加载骨架态：保持完整版式骨架，避免内容塌陷与误点。 */
export default function SettingsLoading() {
  return (
    <div className="app">
      <AppHeader current="settings" sub="MODEL CONFIGURATION" />

      <main className="app-body">
        <div className="pane">
          <div className="wrap">

            <div className="state-lede">
              <span className="status-led is-busy" aria-hidden="true"></span>
              <div>
                <b>正在读取 <span className="mono">/api/v1/model-settings</span></b>
                <span>保留完整版式骨架，避免布局塌陷与误点；读取失败会自动转入「服务不可达」降级态。</span>
              </div>
            </div>

            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">MODEL REGISTRY</span>
                  <h1>模型配置中心</h1>
                </div>
                <span className="badge"><span className="status-led is-busy" aria-hidden="true"></span>读取中</span>
              </div>
              <div className="kpi-grid">
                <div className="kpi"><span className="sk" style={{ width: "40%" }}></span><span className="sk is-block" style={{ width: "60%" }}></span><span className="sk" style={{ width: "50%" }}></span></div>
                <div className="kpi"><span className="sk" style={{ width: "40%" }}></span><span className="sk is-block" style={{ width: "60%" }}></span><span className="sk" style={{ width: "50%" }}></span></div>
                <div className="kpi"><span className="sk" style={{ width: "40%" }}></span><span className="sk is-block" style={{ width: "60%" }}></span><span className="sk" style={{ width: "50%" }}></span></div>
              </div>
            </section>

            <section className="sec">
              <div className="sec-hd">
                <div>
                  <span className="eyebrow">EDIT</span>
                  <h2>配置表单</h2>
                </div>
                <span className="mono-note">读取完成前不可编辑</span>
              </div>
              <div className="panel">
                <div className="panel-head"><span className="sk is-title" style={{ width: "120px" }}></span></div>
                <div className="panel-body">
                  <div className="form-grid">
                    <div className="field"><span className="sk" style={{ width: "80px" }}></span><span className="sk is-block"></span></div>
                    <div className="field"><span className="sk" style={{ width: "64px" }}></span><span className="sk is-block"></span></div>
                    <div className="field"><span className="sk" style={{ width: "96px" }}></span><span className="sk is-block"></span></div>
                    <div className="field"><span className="sk" style={{ width: "88px" }}></span><span className="sk is-block"></span></div>
                    <div className="field is-wide"><span className="sk" style={{ width: "72px" }}></span><span className="sk is-block"></span></div>
                    <div className="field is-wide"><span className="sk" style={{ width: "112px" }}></span><span className="sk is-block"></span></div>
                  </div>
                  <div className="form-actions">
                    <span className="sk is-block" style={{ width: "140px" }}></span>
                    <span className="sk is-block" style={{ width: "140px" }}></span>
                    <span className="sk is-block" style={{ width: "120px" }}></span>
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
