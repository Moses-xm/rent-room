'use client';
import React from 'react';
import styles from './layout.module.scss';
import Link from 'next/link';
import { Image } from 'antd';

export default function LoginLayout({ children }) {
  const logoSource = '/images/logo2.png';
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.header}>
            <Link href="/manage">
              <Image
                alt="logo"
                className={styles.logo}
                src={logoSource}
                preview={false}
              />
            </Link>
            <div className={styles.title}>雅阁租房系统</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
