"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '20px' }}>
      <ul>
        <li>
          <Link href="/manage">管理平台</Link>
        </li>
        <li>
          <Link href="/portal">客户端平台</Link>
        </li>
      </ul>
    </div>
  );
}
