'use client';
import React from 'react';
import { ConfigProvider } from 'antd';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';

export default function AntdProvider({ children }) {
  const colorPrimary = usePrimaryColor();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colorPrimary,
        },
      }}
    >
      <NotificationProvider>
        <MessageProvider>{children}</MessageProvider>
      </NotificationProvider>
    </ConfigProvider>
  );
}
