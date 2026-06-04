import React, { useEffect } from 'react';
import { Modal, Descriptions, Spin, Tag, Typography, Avatar } from 'antd';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import { UserOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { ipLibrary } from '@/utils/ip';
import { getUserDetail } from '@/services/QuanTri';
import { ROLE_LABELS } from './UserTable';

const { Text } = Typography;

interface UserDetailModalProps {
	open: boolean;
	userId?: string | null;
	onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ open, userId, onClose }) => {
	const { data: user, loading, run } = useRequest(
		(id) => getUserDetail(id),
		{
			manual: true,
			formatResult: (res) => res.data || res,
		}
	);

	useEffect(() => {
		if (open && userId) {
			run(userId);
		}
	}, [open, userId]);

	const renderContent = () => {
		if (loading || !user) {
			return (
				<div style={{ textAlign: 'center', padding: '40px 0' }}>
					<Spin size="large" />
				</div>
			);
		}

		const meta = ROLE_LABELS[user.role?.name?.toLowerCase?.()] || { label: user.role?.name, color: 'default' };
		const avatarSrc = user?.avatar ? `${ipLibrary}/auth/avatars/${user.avatar}` : undefined;

		return (
			<div>
				<div style={{ textAlign: 'center', marginBottom: 24 }}>
					<Avatar size={80} icon={<UserOutlined />} src={avatarSrc} style={{ marginBottom: 12 }} />
					<br />
					<Text strong style={{ fontSize: 20 }}>{user.full_name || user.username}</Text>
					<br />
					<Text type="secondary">@{user.username}</Text>
				</div>
				<Descriptions bordered column={2} size="small">
					<Descriptions.Item label="Họ và tên">{user.full_name || '—'}</Descriptions.Item>
					<Descriptions.Item label="Email">{user.email || '—'}</Descriptions.Item>
					<Descriptions.Item label="Số điện thoại">{user.phone || '—'}</Descriptions.Item>
					<Descriptions.Item label="Giới tính">{user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}</Descriptions.Item>
					<Descriptions.Item label="Ngày sinh">
						{user.date_of_birth ? dayjs(user.date_of_birth).format('DD/MM/YYYY') : '—'}
					</Descriptions.Item>
					<Descriptions.Item label="Vai trò">
						<Tag color={meta.color}>{meta.label}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Trạng thái">
						{user.is_active ? (
							<Tag icon={<CheckCircleOutlined />} color="success">Hoạt động</Tag>
						) : (
							<Tag icon={<StopOutlined />} color="error">Khoá</Tag>
						)}
					</Descriptions.Item>
					<Descriptions.Item label="Giới hạn sách mượn">{user.max_books_allowed || 'Mặc định'}</Descriptions.Item>
					<Descriptions.Item label="Giới hạn ngày mượn">{user.max_days_allowed || 'Mặc định'}</Descriptions.Item>
					<Descriptions.Item label="Ngày tạo tài khoản">
						{user.created_at ? dayjs(user.created_at).format('DD/MM/YYYY HH:mm') : '—'}
					</Descriptions.Item>
				</Descriptions>
			</div>
		);
	};

	return (
		<Modal
			title="Chi tiết người dùng"
			visible={open}
			onCancel={onClose}
			footer={null}
			width={650}
			destroyOnClose
		>
			{renderContent()}
		</Modal>
	);
};

export default UserDetailModal;
