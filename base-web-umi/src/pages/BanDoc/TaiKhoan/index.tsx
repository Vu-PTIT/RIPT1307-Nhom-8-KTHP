import React, { useEffect, useState } from 'react';
import { Avatar, Button, Form, Input, Select, Tag, message, Row, Col, Card } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, BookOutlined, BankOutlined } from '@ant-design/icons';
import { history, useModel } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import UploadFile from '@/components/Upload/UploadFile';
import MyDatePicker from '@/components/MyDatePicker';
import { updateUserInfo, uploadUserAvatar } from '@/services/base/api';
import { getCurrentBorrowCount, getMyBorrows } from '@/services/MuonSach';
import { ipLibrary } from '@/utils/ip';
import moment from 'moment';

const getInitial = (value?: string) => (value?.trim()?.charAt(0) || 'U').toUpperCase();

export default function TaiKhoanPage() {
	const { initialState, setInitialState } = useModel('@@initialState');
	const user: any = initialState?.currentUser || {};
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [borrowStats, setBorrowStats] = useState({ current: 0, returned: 0 });

	const displayName = user?.full_name || user?.fullName || user?.name || user?.username || 'Người dùng';
	const email = user?.email || 'Chưa cập nhật';
	const roleName = user?.role?.name || user?.role_name || 'Thành viên';
	const avatarSrc = user?.avatar ? `${ipLibrary}/auth/avatars/${user.avatar}` : undefined;

	useEffect(() => {
		if (user) {
			form.setFieldsValue({
				full_name: displayName,
				gender: user?.gender || user?.gioi_tinh || user?.sex,
				date_of_birth: user?.date_of_birth ? moment(user?.date_of_birth) : undefined,
				phone: user?.phone,
				member_code: user?._id || user?.id,
				avatar: avatarSrc ? avatarSrc : undefined,
			});
		}
	}, [user, avatarSrc, form]);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const currentRes = await getCurrentBorrowCount();
				const allBorrowsRes = await getMyBorrows();
				
				let returnedCount = 0;
				if (allBorrowsRes?.data) {
					returnedCount = allBorrowsRes.data.filter((b: any) => b.status === 'returned').length;
				}
				
				setBorrowStats({ 
					current: currentRes?.data?.current_borrowed || 0,
					returned: returnedCount
				});
			} catch (e) {
				console.error('Error fetching borrow stats:', e);
			}
		};
		if (user && (user._id || user.id)) {
			fetchStats();
		}
	}, [user]);

	const onFinish = async (values: any) => {
		try {
			setLoading(true);
			let newAvatarId = user?.avatar;

			// Handle avatar upload if it's a new file
			const avatarField = values.avatar;
			if (avatarField && typeof avatarField === 'object' && avatarField.fileList?.length > 0) {
				const file = avatarField.fileList[0].originFileObj;
				if (file) {
					const res = await uploadUserAvatar(file);
					if (res?.data?.avatar) {
						newAvatarId = res.data.avatar;
					}
				}
			}

			const dob = values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null;

			// Update user profile
			const updatePayload = {
				full_name: values.full_name,
				gender: values.gender,
				date_of_birth: dob,
				phone: values.phone,
			};

			const response = await updateUserInfo(updatePayload);
			if (response?.data) {
				message.success('Cập nhật thông tin thành công');
				// Update global state
				if (initialState) {
					setInitialState({
						...initialState,
						currentUser: {
							...initialState.currentUser,
							...updatePayload,
							avatar: newAvatarId,
						},
					});
				}
			}
		} catch (error) {
			console.error('Update profile error:', error);
			message.error('Có lỗi xảy ra khi cập nhật thông tin');
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageSkeleton title='Thông tin cá nhân'>
			<div className='library-panel' style={{ padding: 32 }}>
				<Form layout='vertical' form={form} onFinish={onFinish}>
					<div className='library-detail' style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
						<style>{`
							.avatar-wrapper .ant-upload.ant-upload-select-picture-card,
							.avatar-wrapper .ant-upload-list-picture-card-container,
							.avatar-wrapper .ant-upload-list-item,
							.avatar-wrapper .ant-upload-list-item::before {
								width: 200px !important;
								height: 280px !important;
								border-radius: 8px !important;
								overflow: hidden;
								margin: 0 auto;
								padding: 0 !important;
							}
							.avatar-wrapper .ant-upload-list-item-info {
								border-radius: 8px !important;
								width: 100% !important;
								height: 100% !important;
							}
							.avatar-wrapper .ant-upload-list-item-thumbnail {
								width: 100% !important;
								height: 100% !important;
							}
							.avatar-wrapper .ant-upload-list-item-thumbnail img {
								width: 100% !important;
								height: 100% !important;
								object-fit: cover !important;
							}
							.avatar-wrapper small {
								display: none !important;
							}
						`}</style>
						
						{/* Cột 1: Avatar */}
						<div
							className='avatar-wrapper'
							style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }}
						>
							<div style={{ textAlign: 'center', marginBottom: 16 }}>
								<Form.Item name="avatar" style={{ marginBottom: 0 }}>
									<UploadFile
										isAvatar={true}
										accept='image/*'
										buttonDescription='Đổi ảnh'
										maxFileSize={5}
									/>
								</Form.Item>
								{!form.getFieldValue('avatar') && !avatarSrc && (
									<Avatar shape="square" style={{ width: 200, height: 280, backgroundColor: '#87d068', fontSize: 64, fontWeight: 700, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: -1, opacity: 0.2, borderRadius: 8 }}>
										{getInitial(displayName)}
									</Avatar>
								)}
							</div>
						</div>

						{/* Cột 2: Nội dung chính */}
						<div className='library-detail-main' style={{ flex: 1 }}>
							
							{/* Header: Tên & Thông số */}
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
								<div>
									<h2 style={{ fontSize: 28, marginBottom: 4 }}>{displayName}</h2>
									<div className='library-detail-author' style={{ fontSize: 16, color: '#666', marginBottom: 12 }}>{email}</div>
									<div style={{ display: 'flex', gap: 12 }}>
										<Tag className='library-status-tag neutral' style={{ fontSize: 13, padding: '4px 10px' }}>{roleName}</Tag>
										<Tag className='library-status-tag success' style={{ fontSize: 13, padding: '4px 10px' }}>Tài khoản cá nhân</Tag>
									</div>
								</div>
								
								<div style={{ display: 'flex', gap: 16 }}>
									<Card size="small" style={{ minWidth: 120, backgroundColor: '#f0f5ff', borderColor: '#d6e4ff', borderRadius: 12 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', marginBottom: 4 }}>
											<BookOutlined style={{ color: '#1890ff' }} />
											<span style={{ fontSize: 13 }}>Đang mượn</span>
										</div>
										<div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{borrowStats.current}</div>
									</Card>
									<Card size="small" style={{ minWidth: 120, backgroundColor: '#f6ffed', borderColor: '#d9f7be', borderRadius: 12 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', marginBottom: 4 }}>
											<BankOutlined style={{ color: '#52c41a' }} />
											<span style={{ fontSize: 13 }}>Thư viện</span>
										</div>
										<div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{borrowStats.returned}</div>
									</Card>
								</div>
							</div>

							{/* Form Fields (Grid Layout) */}
							<Row gutter={24}>
								<Col span={12}>
									<Form.Item label='Họ và Tên' name='full_name' rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
										<Input size="large" placeholder='Nhập họ và tên' />
									</Form.Item>
								</Col>
								<Col span={6}>
									<Form.Item label='Giới tính' name='gender'>
										<Select size="large" placeholder='Chọn giới tính'>
											<Select.Option value='Nam'>Nam</Select.Option>
											<Select.Option value='Nữ'>Nữ</Select.Option>
											<Select.Option value='Khác'>Khác</Select.Option>
										</Select>
									</Form.Item>
								</Col>
								<Col span={6}>
									<Form.Item label='Ngày sinh' name='date_of_birth'>
										<MyDatePicker style={{ width: '100%', height: 40 }} placeholder='Chọn ngày sinh' format="DD/MM/YYYY" />
									</Form.Item>
								</Col>
							</Row>

							<Row gutter={24}>
								<Col span={12}>
									<Form.Item label='Số điện thoại' name='phone'>
										<Input size="large" placeholder='Nhập số điện thoại' />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item label='Mã thẻ số' name='member_code'>
										<Input size="large" placeholder='LIB-2026-XXXX' disabled />
									</Form.Item>
								</Col>
							</Row>

							{/* Actions (Bottom Right) */}
							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40, borderTop: '1px solid #f0f0f0', paddingTop: 24, gap: 12 }}>
								<Button size="large" icon={<ArrowLeftOutlined />} onClick={() => history.goBack()}>
									Quay lại
								</Button>
								<Button size="large" type='primary' htmlType='submit' icon={<SaveOutlined />} loading={loading}>
									Lưu thay đổi
								</Button>
							</div>
						</div>
					</div>
				</Form>
			</div>
		</PageSkeleton>
	);
}
