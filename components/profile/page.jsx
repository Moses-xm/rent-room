'use client';
import React from 'react';
import { Avatar, Button, Modal } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { handleLogout } from '@/utils/utils';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';

const Profile = () => {
  const nav = useRouter();
  const { isLogin, username } = useLogin();
  const primaryColor = usePrimaryColor();
  const [modal, contextHolder] = Modal.useModal();

  const Logout = () => {
    handleLogout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const confirm = () => {
    modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure to logout?',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: Logout,
    });
  };

  return (
    <div className={styles.profile}>
      {isLogin ? (
        <>
          <div className={styles.username}>{username}</div>
          <Avatar
            style={{ backgroundColor: primaryColor, marginRight: 16 }}
            icon={<UserOutlined />}
          />
          |
          <div className={styles.logout} onClick={confirm}>
            <LogoutOutlined />
            <span>Logout</span>
          </div>
          {contextHolder}
        </>
      ) : (
        <Button
          type="link"
          style={{ marginLeft: 6 }}
          onClick={() => {
            nav.push('/login');
          }}
        >
          Login
        </Button>
      )}
    </div>
  );
};

export default Profile;
