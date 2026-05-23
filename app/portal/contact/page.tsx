import { PortalShell } from "@/components/portal/PortalShell";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <PortalShell>
      <div className="max-w-[860px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6 pb-3 border-b border-[var(--color-border)]">
          联系我们
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {[
            { label: "客服热线", value: "400-800-8888",           note: "周一至周日 9:00–21:00" },
            { label: "商务合作", value: "bd@yage.com",            note: "工作日 3 个工作日内回复" },
            { label: "投诉建议", value: "help@yage.com",          note: "我们认真对待每一条反馈" },
            { label: "公司地址", value: "上海市浦东新区张江高科技园区", note: "雅阁科技大厦 12 楼" },
          ].map(({ label, value, note }) => (
            <div
              key={label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5"
            >
              <div className="text-xs text-[var(--color-text-muted)] mb-1">{label}</div>
              <div className="text-sm font-semibold text-[var(--color-text)] mb-1">{value}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{note}</div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-base font-semibold text-[var(--color-primary)] mb-4">在线留言</h2>
          <ContactForm />
        </section>
      </div>
    </PortalShell>
  );
}
