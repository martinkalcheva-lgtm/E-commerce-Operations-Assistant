import { BrandMark } from "@/components/app-header";

const platforms = [
  { label: "抖音电商", value: "douyin" },
  { label: "淘宝", value: "taobao" },
  { label: "天猫", value: "tmall" },
  { label: "拼多多", value: "pinduoduo" },
  { label: "京东", value: "jd" },
  { label: "TikTok Shop", value: "tiktok_shop" },
  { label: "Amazon", value: "amazon" },
  { label: "其他", value: "other" },
] as const;

/** 渲染 StoreCreateForm 组件，集中展示店铺创建表单所需的数据、状态和操作入口。 */
export function StoreCreateForm() {
  return (
    <form action="/stores/create" method="post" className="stack-4">
      <div className="row">
        <span className="brand-badge mark-slot" aria-hidden="true"><BrandMark /></span>
        <div>
          <h3 className="t-h3">新建店铺</h3>
          <p className="t-mini">为多平台商品、SKU 和库存建立归属</p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="store-name">店铺名称</label>
        <input
          id="store-name"
          name="name"
          required
          className="input"
          placeholder="例如：抖音旗舰店"
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="store-platform">平台</label>
          <select id="store-platform" name="platform" defaultValue="douyin" className="input">
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="store-owner">负责人</label>
          <input
            id="store-owner"
            name="owner_name"
            className="input"
            placeholder="运营负责人"
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
      >
        创建店铺
      </button>
    </form>
  );
}
