'use client';
import { createContext, useContext } from 'react';
import { message } from 'antd';

// create MessageContext
const MessageContext = createContext(null);

// hook that to get message instance
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

// MessageProvider component
export const MessageProvider = ({ children }) => {
  const [api, contextHolder] = message.useMessage(); // get message instance

  return (
    <MessageContext.Provider value={api}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};
