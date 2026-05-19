export function AdSidebar() {
  return (
    <aside className="hidden xl:block xl:w-58 shrink-0 space-y-3">
      {/* 主推广告 */}
      <div className="relative overflow-hidden rounded-lg border" style={{ background: "linear-gradient(150deg, #f2f8ea 0%, #e6f3d4 60%, #daefc0 100%)", borderColor: "#c8e6a0" }}>
        {/* 装饰圆 */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "rgba(98,171,0,0.08)" }} />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full" style={{ background: "rgba(98,171,0,0.06)" }} />

        <div className="relative p-4">
          <div className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3" style={{ background: "var(--color-accent)", color: "#fff" }}>
            限时特惠
          </div>
          <h3 className="font-bold text-base leading-snug mb-1" style={{ color: "var(--color-primary-dark)" }}>
            新用户首月<br />
            <span className="text-2xl" style={{ color: "var(--color-accent)" }}>立减 500</span>
            <span className="text-sm ml-1" style={{ color: "var(--color-primary-dark)" }}>元</span>
          </h3>
          <p className="text-[13px] mb-4" style={{ color: "var(--color-text-2)" }}>
            认证房源 · 拎包即住 · 无中介费
          </p>

          {/* 标签行 */}
          <div className="flex flex-wrap gap-1 mb-4">
            {["近地铁", "押一付一", "配套齐全"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(98,171,0,0.12)", color: "var(--color-primary-dark)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            className="w-full py-2 rounded-md text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            立即领取优惠
          </button>
        </div>
      </div>

      {/* 经纪人服务卡 */}
      <div className="rounded-lg border p-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <p className="text-[11px] font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
          专属经纪人服务
        </p>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-bold"
            style={{ background: "linear-gradient(135deg, #62ab00, #4a8101)" }}
          >
            李
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
              李小梅
            </p>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              从业 5 年 · 服务 300+ 客户
            </p>
          </div>
        </div>

        {/* 数据栏 */}
        <div className="flex divide-x mb-3" style={{ borderColor: "var(--color-border)" }}>
          {[
            { num: "98%", label: "好评率" },
            { num: "48h", label: "平均成交" },
            { num: "0元", label: "服务费" },
          ].map((item) => (
            <div key={item.label} className="flex-1 text-center py-1">
              <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                {item.num}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <button
          className="w-full py-1.5 rounded-md text-sm font-medium border cursor-pointer transition-colors hover:bg-[var(--color-primary-tint)]"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          免费咨询
        </button>
      </div>

      {/* 小贴士卡 */}
      <div className="rounded-lg p-4" style={{ background: "var(--color-primary-tint-2)" }}>
        <p className="text-[11px] font-semibold mb-2.5" style={{ color: "var(--color-primary-dark)" }}>
          🏠 租房小贴士
        </p>
        <ul className="space-y-2">
          {[
            "签约前核实房东证件",
            "水电煤账单留存备查",
            "拍照记录房屋原始状态",
            "押金需签收据凭证",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />
              <span className="text-[12px] leading-snug" style={{ color: "var(--color-text-2)" }}>
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
