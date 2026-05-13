import Footer from '@/components/Footer';
import { adminlogin, getUserInfo } from '@/services/base/api';
import rules from '@/utils/rules';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Card, Typography } from 'antd';
import React, { useState } from 'react';
import { history, useModel } from 'umi';

const { Title } = Typography;

const Login: React.FC = () => {
	const [submitting, setSubmitting] = useState(false);
	const { initialState, setInitialState } = useModel('@@initialState');
	const [form] = Form.useForm();

	const handleRole = async (role: { access_token: string; token_type: string }) => {
		localStorage.setItem('token', role?.access_token);

		try {
			const info = await getUserInfo();
			setInitialState({
				...initialState,
				currentUser: info?.data?.data || info?.data,
			});
		} catch (e) {
			console.error('Failed to get user info', e);
		}

		message.success('Đăng nhập thành công');
		history.push('/dashboard');
	};

	const handleSubmit = async (values: any) => {
		try {
			setSubmitting(true);
			const msg = await adminlogin({ username: values.login, password: values.password });
			if (msg.status === 200 && msg?.data?.access_token) {
				handleRole(msg?.data);
				localStorage.removeItem('failed');
			}
		} catch (error) {
			message.error('Sai tên đăng nhập hoặc mật khẩu');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
			<div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 12px' }}>
				<Card 
					style={{ width: '100%', maxWidth: 440, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
					bodyStyle={{ padding: '32px 24px' }}
					bordered={false}
				>
					<div style={{ textAlign: 'center', marginBottom: 32 }}>
						<img alt='logo' src='/logo-full.svg' style={{ height: 50, marginBottom: 24 }} />
						<Title level={3} style={{ margin: 0, color: 'var(--primary-color)' }}>Đăng nhập hệ thống</Title>
					</div>

					<Form
						form={form}
						onFinish={handleSubmit}
						layout='vertical'
						size='large'
					>
						<Form.Item name='login' rules={[...rules.required]}>
							<Input
								placeholder='Nhập tên đăng nhập'
								prefix={<UserOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
							/>
						</Form.Item>
						<Form.Item name='password' rules={[...rules.required]}>
							<Input.Password
								placeholder='Nhập mật khẩu'
								prefix={<LockOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
							/>
						</Form.Item>

						<Button type='primary' block htmlType='submit' loading={submitting} style={{ marginTop: 8 }}>
							Đăng nhập
						</Button>
					</Form>

					<div style={{ textAlign: 'center', marginTop: 24 }}>
						<Button onClick={() => history.push('/user/register')} type='link'>
							Chưa có tài khoản? Đăng ký ngay
						</Button>
					</div>
				</Card>
			</div>

			<Footer />
		</div>
	);
};

export default Login;
