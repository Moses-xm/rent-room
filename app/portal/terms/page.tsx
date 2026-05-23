import { PortalShell } from "@/components/portal/PortalShell";

const SECTIONS = [
  {
    title: "一、总则",
    content: `本协议是您（以下简称"用户"）与雅阁租房平台（以下简称"本平台"）之间关于使用本平台服务所订立的协议。在使用本平台提供的各项服务之前，请您仔细阅读本协议的全部内容。一旦您注册成功，即表示您已充分阅读、理解并接受本协议的全部条款。`,
  },
  {
    title: "二、账号注册与使用",
    content: `用户注册时须提供真实、准确、完整的个人资料。用户应妥善保管账号及密码，因用户原因导致账号或密码泄露所引起的损失，由用户自行承担。本平台有权对注册用户的身份信息进行核验，对于虚假信息注册的账号，本平台有权予以注销。`,
  },
  {
    title: "三、平台服务",
    content: `本平台为用户提供房源信息展示、在线预约、在线签约、在线交租等服务。本平台展示的房源信息由房东或房产中介提供，本平台对房源的真实性进行合理审核，但不对信息的绝对准确性作担保。用户应结合实地看房结果作出独立判断。`,
  },
  {
    title: "四、用户行为规范",
    content: `用户在使用本平台服务时，不得发布虚假房源信息，不得实施任何干扰本平台正常运营的行为，不得利用本平台从事违法或侵害他人权益的活动。违反上述规定的，本平台有权暂停或终止向该用户提供服务，并保留追究法律责任的权利。`,
  },
  {
    title: "五、隐私保护",
    content: `本平台重视用户隐私保护，收集和使用用户信息遵循合法、正当、必要的原则。具体隐私保护政策请参阅《隐私政策》。`,
  },
  {
    title: "六、免责声明",
    content: `由于不可抗力、网络故障、第三方服务中断等原因导致的服务中断或损失，本平台不承担责任。本平台对于因用户使用本平台服务而产生的任何直接、间接损失，在法律允许范围内免除责任。`,
  },
  {
    title: "七、协议变更",
    content: `本平台有权根据业务发展和法律法规变化对本协议进行修订。协议更新后，将在平台页面公告，继续使用本平台服务即视为同意修订后的协议。`,
  },
  {
    title: "八、争议解决",
    content: `本协议的签订、履行和解释均适用中华人民共和国法律。因本协议产生的任何争议，双方应协商解决；协商不成的，任一方可向本平台所在地有管辖权的人民法院提起诉讼。`,
  },
];

export default function TermsPage() {
  return (
    <PortalShell>
      <div className="max-w-[860px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2 pb-3 border-b border-[var(--color-border)]">
          用户协议
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mb-8">更新日期：2026 年 1 月 1 日 &nbsp;|&nbsp; 生效日期：2026 年 1 月 1 日</p>

        <div className="space-y-7">
          {SECTIONS.map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-sm font-semibold text-[var(--color-text)] mb-2">{title}</h2>
              <p className="text-sm text-[var(--color-text-2)] leading-7">{content}</p>
            </section>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
