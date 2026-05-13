import Image from "next/image";

export default function AppLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Image
      src="/images/logo.png"
      alt="雅阁租房系统"
      width={40}
      height={40}
      className={className}
      style={style}
    />
  );
}
