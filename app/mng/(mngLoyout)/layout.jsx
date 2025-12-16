'use client';
import {
  ContactsOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { Button, Layout, Menu, Image, theme } from 'antd';
const { Header, Sider, Content } = Layout;
import { usePathname, useRouter } from 'next/navigation';
import Profile from '@/components/profile/page';
import styles from './layout.module.scss';

const RouteList = [
  {
    key: 'user',
    label: 'User Management',
    path: '/user',
    icon: <ContactsOutlined />,
  },
];

export default function RootLayout({ children }) {
  const logoSource = '/images/logo3.png';
  const [collapsed, setCollapsed] = useState(false);
  const path = usePathname();
  const nav = useRouter();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const routeList = useMemo(() => {
    const welcome = {
      key: 'welcome',
      label: 'Welcome',
      path: '/',
      icon: <HomeOutlined />,
    };
    return [welcome, ...RouteList];
  }, []);

  const selectedKey = useMemo(() => {
    return (
      RouteList.find((item) => path.startsWith(item?.path))?.key ?? 'welcome'
    );
  }, [path]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div className={styles.logoBox}>
          {collapsed === false && (
            <Image
              src={logoSource}
              alt="logo"
              height={40}
              style={{ objectFit: 'contain' }}
              preview={false}
              className={styles.logo}
              onClick={() => nav.push('/')}
            />
          )}
          <h3>WIP {collapsed === false ? 'Planner' : ''} </h3>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={routeList?.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={(e) => {
            nav.push(`/${e.key}`);
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Profile />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflowY: 'auto',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
