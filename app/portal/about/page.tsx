import { PortalShell } from "@/components/portal/PortalShell";

export default function AboutPage() {
  return (
    <PortalShell>
      <div className="max-w-[860px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6 pb-3 border-b border-[var(--color-border)]">
          关于我们
        </h1>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--color-primary)] mb-3">平台简介</h2>
          <p className="text-sm text-[var(--color-text-2)] leading-7">
            雅阁租房是一家专注于品质长租服务的综合性房屋租赁平台。我们致力于为租客提供真实、透明、高效的找房体验，同时为房东提供专业的房源管理与租赁服务，让每一次安家都成为美好的开始。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--color-primary)] mb-3">我们的优势</h2>
          <ul className="text-sm text-[var(--color-text-2)] leading-8 list-disc list-inside space-y-1">
            <li>真实房源，全程核验，杜绝虚假信息</li>
            <li>覆盖区域找房、地铁找房、地图找房多种模式，找房更便捷</li>
            <li>在线签约、在线交租，合同管理全流程数字化</li>
            <li>专业客服团队，7×12 小时在线响应</li>
            <li>严格的房东资质审核，保障租客权益</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--color-primary)] mb-3">发展历程</h2>
          <div className="space-y-4">
            {[
              { year: "2022", desc: "雅阁租房正式上线，首批覆盖 5 个核心城区" },
              { year: "2023", desc: "推出在线合同与电子签约功能，用户突破 10 万" },
              { year: "2024", desc: "上线地图找房与地铁找房模式，房源数量超 5 万套" },
              { year: "2025", desc: "完成品质认证体系升级，获评年度最受信赖租房平台" },
              { year: "2026", desc: "持续深耕，打造更智能、更温暖的租住生活生态" },
            ].map(({ year, desc }) => (
              <div key={year} className="flex gap-4 text-sm">
                <span className="shrink-0 font-semibold text-[var(--color-primary)] w-10">{year}</span>
                <span className="text-[var(--color-text-2)] leading-6">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--color-primary)] mb-3">我们的使命</h2>
          <p className="text-sm text-[var(--color-text-2)] leading-7">
            让优质居住触手可及，让每一个在城市打拼的人都能找到属于自己的温暖角落。
          </p>
        </section>
      </div>
    </PortalShell>
  );
}
