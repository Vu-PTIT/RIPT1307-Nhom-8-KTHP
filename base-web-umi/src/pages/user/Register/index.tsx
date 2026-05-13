import Footer from '@/components/Footer';
import { register } from '@/services/base/api';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Card, Typography } from 'antd';
import React, { useState } from 'react';
import { history } from 'umi';

const { Title } = Typography;

const Register: React.FC = () => {
	const [submitting, setSubmitting] = useState(false);
	const [form] = Form.useForm();

	const handleSubmit = async (values: any) => {
		try {
			setSubmitting(true);
			const response = await register({
				username: values.username,
				email: values.email,
				password: values.password,
			});
			if (response.status === 200 || response.status === 201) {
				message.success('Đăng ký tài khoản thành công!');
				history.push('/user/login');
			}
		} catch (error: any) {
			console.error(error);
			const errorMsg = error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại sau';
			message.error(`Đăng ký thất bại: ${errorMsg}`);
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
						<Title level={3} style={{ margin: 0, color: 'var(--primary-color)' }}>Đăng ký tài khoản</Title>
					</div>

					<Form
						form={form}
						onFinish={handleSubmit}
						layout='vertical'
						size='large'
					>
						<Form.Item
							name='username'
							rules={[
								{ required: true, message: 'Vui lòng nhập tên đăng nhập!' },
								{ min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
							]}
						>
							<Input
								placeholder='Tên đăng nhập'
								prefix={<UserOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
							/>
						</Form.Item>
						
						<Form.Item
							name='email'
							rules={[
								{ required: true, message: 'Vui lòng nhập email!' },
								{ type: 'email', message: 'Email không hợp lệ!' },
							]}
						>
							<Input
								placeholder='Email'
								prefix={<MailOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
							/>
						</Form.Item>

						<Form.Item
							name='password'
							rules={[
								{ required: true, message: 'Vui lòng nhập mật khẩu!' },
								{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
							]}
						>
							<Input.Password
								placeholder='Mật khẩu'
								prefix={<LockOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
							/>
						</Form.Item>

						<Button type='primary' block htmlType='submit' loading={submitting} style={{ marginTop: 8 }}>
							Đăng ký
						</Button>
					</Form>

					<div style={{ textAlign: 'center', marginTop: 24 }}>
						<Button onClick={() => history.push('/user/login')} type='link'>
							Đã có tài khoản? Đăng nhập ngay
						</Button>
					</div>
				</Card>
			</div>

			<Footer />
		</div>
	);
};

export default Register;
