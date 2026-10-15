import { BrandMark } from "@/components/app-header";
import type { Store } from "@/types";

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

type ProductCreateFormProps = {
  stores?: Store[];
};

/** 渲染 ProductCreateForm 组件，集中展示商品创建表单所需的数据、状态和操作入口。 */
export function ProductCreateForm({ stores = [] }: ProductCreateFormProps) {
  return (
    <form action="/products/create" method="post" className="stack-4">
      <div className="row">
        <span className="brand-badge mark-slot" aria-hidden="true"><BrandMark /></span>
        <div>
          <h3 className="t-h3">新建单品</h3>
          <p className="t-mini">先把一个商品跑完整运营链路</p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="product-name">商品名称</label>
        <input
          id="product-name"
          name="name"
          required
          className="input"
          placeholder="例如：低糖燕麦饼干"
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="product-store">所属店铺</label>
          <select id="product-store" name="store_id" className="input">
            <option value="">暂不绑定</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="product-platform">平台</label>
          <select id="product-platform" name="platform" defaultValue="douyin" className="input">
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="product-category">类目</label>
          <input
            id="product-category"
            name="category"
            className="input"
            placeholder="食品 / 家居 / 美妆"
          />
        </div>

        <div className="field">
          <label htmlFor="product-price">售价</label>
          <input
            id="product-price"
            name="price"
            className="input"
            placeholder="29.90"
            inputMode="decimal"
          />
        </div>

        <div className="field">
          <label htmlFor="product-audience">目标人群</label>
          <input
            id="product-audience"
            name="target_audience"
            className="input"
            placeholder="年轻上班族"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="product-points">核心卖点</label>
        <textarea
          id="product-points"
          name="selling_points"
          className="input"
          placeholder="用逗号或换行分隔，例如：低糖、饱腹、独立包装"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
      >
        创建商品
      </button>
    </form>
  );
}
