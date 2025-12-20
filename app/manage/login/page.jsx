'use client';
import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input, message, Spin } from 'antd';
import SliderVerify from 'react-slider-verify';
import styles from './page.module.scss';
import 'react-slider-verify/dist/index.css';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import request from '@/utils/request';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const primaryColor = usePrimaryColor();
  const nav = useRouter();

  const onFinish = (values) => {
    if (!verified) {
      message.error('请先验证');
      return;
    }
    setLoading(true);
    const { username, password } = values;
    const postData = {
      username,
      password,
    };
    request('/api/admin/login', {
      method: 'POST',
      body: postData,
    })
      .then((res) => {
        if (res?.success) {
          message.success(res?.message);
          nav.push('/manage');
        } else {
          message.error(res?.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleVerify = () => {
    setVerified(true); // 滑块验证成功
  };

  return (
    <div className={styles.loginBox}>
      <Spin spinning={loading}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <SliderVerify
              onSuccess={handleVerify}
              width={360} // 滑块宽度
              height={32} // 滑块高度
              text="Slide to verify"
              successBgColor={primaryColor}
            />
          </Form.Item>

          <Form.Item>
            <Flex justify="space-between" align="center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
            </Flex>
          </Form.Item>

          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
}
