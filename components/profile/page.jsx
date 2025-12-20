'use client';
import React, { useState } from 'react';
import { Avatar, Button, Modal, Dropdown } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { handleLogout } from '@/utils/utils';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { DefaultAvatarUrl } from '@/utils/constants';

const Profile = () => {
  const nav = useRouter();
  const { isLogin, username } = useLogin();
  const primaryColor = usePrimaryColor();
  const [modal, contextHolder] = Modal.useModal();
  const [avatarUrl, setAvatarUrl] = useState(DefaultAvatarUrl);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const Logout = () => {
    handleLogout();
    if (typeof window !== 'undefined') {
      window.location.href = '/manage/login';
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

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const about = () => {
    setIsModalVisible(true);
  };

  const items = [
    {
      key: '1',
      label: <a onClick={about}>关于</a>,
    },
  ];

  return (
    <div className={styles.profile}>
      {isLogin ? (
        <>
          <Dropdown menu={{ items }} placement="bottom">
            <div className={styles.user}>
              <Avatar
                size={36}
                src={avatarUrl}
                alt="avatar"
                className={styles.avatar}
              />
              <div className={styles.username}>{username}</div>
            </div>
          </Dropdown>
          |
          <div className={styles.logout} onClick={confirm}>
            <LogoutOutlined />
            <span>Logout</span>
          </div>
          <Modal
            title="关于用户"
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            <div className={styles.about}>
              <p>用户名： {username}</p>
              {/* <p>角色： {role_name}</p> */}
            </div>
          </Modal>
          {contextHolder}
        </>
      ) : (
        <Button
          type="link"
          style={{ marginLeft: 6 }}
          onClick={() => {
            nav.push('/manage/login');
          }}
        >
          Login
        </Button>
      )}
    </div>
  );
};

export default Profile;
