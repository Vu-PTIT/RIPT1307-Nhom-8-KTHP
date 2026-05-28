import React from 'react';
import { Avatar, Button, Descriptions, Tag } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';

const formatValue = (value?: string | null) => {
	if (!value) return 'Chưa cập nhật';
	return value;
};

const formatBirthDate = (value?: string | null) => {
	if (!value) return 'Chưa cập nhật';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('vi-VN');
};

const getInitial = (value?: string) => (value?.trim()?.charAt(0) || 'U').toUpperCase();

export default function TaiKhoanPage() {
	const { initialState } = useModel('@@initialState');
	const user: any = initialState?.currentUser || {};
	const displayName = user?.full_name || user?.fullName || user?.name || user?.username || 'Người dùng';
	const email = user?.email || 'Chưa cập nhật';
	const gender = user?.gender || user?.gioi_tinh || user?.sex || null;
	const birthday = user?.date_of_birth || user?.birthday || user?.dob || user?.birth_date || null;
	const roleName = user?.role?.name || user?.role_name || 'Thành viên';

	return (
		<PageSkeleton title='Thông tin cá nhân'>
			<div className='library-panel'>
				<div className='library-detail'>
					<div
						className='library-detail-cover'
						style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					>
						<div style={{ textAlign: 'center', color: '#fff' }}>
							<Avatar size={220} style={{ backgroundColor: '#87d068', fontSize: 96, fontWeight: 700 }}>
								{getInitial(displayName)}
							</Avatar>
						</div>
					</div>

					<div className='library-detail-main'>
						<div className='library-detail-header'>
							<div>
								<h2>{displayName}</h2>
								<div className='library-detail-author'>{email}</div>
							</div>
							<div>
								<Tag className='library-status-tag neutral'>{roleName}</Tag>
								<Tag className='library-status-tag success'>Tài khoản cá nhân</Tag>
							</div>
						</div>

						<Descriptions bordered column={1} size='small'>
							<Descriptions.Item label='Tên'>{displayName}</Descriptions.Item>
							<Descriptions.Item label='Giới tính'>{formatValue(gender)}</Descriptions.Item>
							<Descriptions.Item label='Ngày sinh'>{formatBirthDate(birthday)}</Descriptions.Item>
							<Descriptions.Item label='Email'>{email}</Descriptions.Item>
						</Descriptions>

						<div className='library-detail-actions'>
							<Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()}>
								Quay lại
							</Button>
						</div>
					</div>
				</div>
			</div>
		</PageSkeleton>
	);
}
