'use client';
import { notification } from 'antd';
import EventEmitter from 'events';

// Create a global event manager
const eventEmitter = new EventEmitter();

// Trigger events to show Notification
export const getNotificationInstance = () => ({
  success: (config) =>
    eventEmitter.emit('notification', { type: 'success', ...config }),
  error: (config) =>
    eventEmitter.emit('notification', { type: 'error', ...config }),
  info: (config) =>
    eventEmitter.emit('notification', { type: 'info', ...config }),
  warning: (config) =>
    eventEmitter.emit('notification', { type: 'warning', ...config }),
});

// Notification Provider component, wrap it in _app.tsx or Layout component
export const NotificationProvider = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  // Listen for global events and trigger notification
  eventEmitter.on('notification', ({ type, ...config }) => {
    if (api[type]) {
      api[type](config);
    }
  });

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};
