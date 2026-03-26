'use client';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { Button, Layout, Menu, Image, theme } from 'antd';
const { Header, Sider, Content } = Layout;
import { usePathname, useRouter } from 'next/navigation';
import Profile from '@/components/Profile';
import CityPicker from '@/components/CityPicker';
import { MngRouteList, FontFamily } from '@/utils/constants';
import styles from './layout.module.scss';

const getIcon = (icon) => {
  if (!icon) {
    return '';
  }
  if (typeof icon === 'string') {
    return <i className={`${FontFamily} ${icon}`} style={{ marginRight: 8 }} />;
  }
  return icon;
};

export default function ManageLayout({ children }) {
  const logoSource = '/images/logo2.png';
  const [collapsed, setCollapsed] = useState(false);
  const path = usePathname();
  const nav = useRouter();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const routeList = useMemo(() => {
    return MngRouteList?.map((item) => ({
      ...item,
      path: '/manage' + item?.path,
      icon: getIcon(item?.icon),
    }));
  }, []);

  console.log('routeList', routeList);

  const selectedKey = useMemo(() => {
    return (
      routeList.find((item) => path.startsWith(item?.path))?.key ?? 'welcome'
    );
  }, [path, routeList]);

  console.log('selectedKey', selectedKey);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={230}>
        <div className={styles.logoBox}>
          {collapsed === false && (
            <Image
              src={logoSource}
              alt="logo"
              height={40}
              style={{ objectFit: 'contain' }}
              preview={false}
              className={styles.logo}
              onClick={() => nav.push('/manage')}
            />
          )}
          <h3>雅阁租房系统</h3>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={routeList?.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            path: item.path,
          }))}
          onClick={(e) => {
            nav.push(`/${e.path}`);
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
          <CityPicker />
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
