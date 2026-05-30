import React from 'react';
import {
	Table, Button, Tag, Space, Popconfirm, Tooltip, Typography,
} from 'antd';
import {
	EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
	admin: { label: 'Quản trị', color: 'red' },
	librarian: { label: 'Thủ thư', color: 'blue' },
	member: { label: 'Độc giả', color: 'default' },
};

interface UserTableProps {
	users: any[];
	loading: boolean;
	total: number;
	page: number;
	pageSize: number;
	onEdit: (record: any) => void;
	onToggle: (id: string, isActive: boolean, username: string) => void;
	onDelete: (id: string, username: string) => void;
	onPageChange: (page: number, pageSize: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
	users,
	loading,
	total,
	page,
	pageSize,
	onEdit,
	onToggle,
	onDelete,
	onPageChange,
}) => {
	const columns = [
		{
			title: 'Người dùng',
			key: 'user',
			render: (_: any, record: any) => (
				<div>
					<div style={{ fontWeight: 700, color: '#111' }}>{record.fullname || record.username}</div>
					<Text type='secondary' style={{ fontSize: 12 }}>@{record.username}</Text>
				</div>
			),
		},
		{
			title: 'Email',
			dataIndex: 'email',
			key: 'email',
			render: (v: string) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text>,
		},
		{
			title: 'Vai trò',
			dataIndex: 'role',
			key: 'role',
			width: 120,
			render: (v: string) => {
				const meta = ROLE_LABELS[v?.toLowerCase?.()] || { label: v, color: 'default' };
				return <Tag color={meta.color}>{meta.label}</Tag>;
			},
		},
		{
			title: 'Trạng thái',
			dataIndex: 'is_active',
			key: 'is_active',
			width: 120,
			render: (v: boolean) =>
				v ? (
					<Tag icon={<CheckCircleOutlined />} color='success'>Hoạt động</Tag>
				) : (
					<Tag icon={<StopOutlined />} color='error'>Khoá</Tag>
				),
		},
		{
			title: 'Ngày tạo',
			dataIndex: 'created_at',
			key: 'created_at',
			width: 130,
			render: (v: string) =>
				v ? <Text style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YYYY')}</Text> : '—',
		},
		{
			title: 'Đăng nhập cuối',
			dataIndex: 'last_login',
			key: 'last_login',
			width: 150,
			render: (v: string) =>
				v ? (
					<Text style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YYYY HH:mm')}</Text>
				) : (
					<Text type='secondary' style={{ fontSize: 12 }}>Chưa đăng nhập</Text>
				),
		},
		{
			title: 'Thao tác',
			key: 'action',
			width: 160,
			render: (_: any, record: any) => (
				<Space>
					<Tooltip title='Chỉnh sửa'>
						<Button
							type='text'
							icon={<EditOutlined />}
							onClick={() => onEdit(record)}
							style={{ color: '#1a56a8' }}
						/>
					</Tooltip>
					<Tooltip title={record.is_active ? 'Khoá tài khoản' : 'Mở khoá'}>
						<Popconfirm
							title={`${record.is_active ? 'Khoá' : 'Mở khoá'} tài khoản "${record.username}"?`}
							onConfirm={() => onToggle(record.id, record.is_active, record.username)}
							okText='Xác nhận'
							cancelText='Huỷ'
						>
							<Button
								type='text'
								icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
								style={{ color: record.is_active ? '#d4860a' : '#1e7c44' }}
							/>
						</Popconfirm>
					</Tooltip>
					<Tooltip title='Xoá người dùng'>
						<Popconfirm
							title={`Xoá người dùng "${record.username}"? Hành động này không thể hoàn tác.`}
							onConfirm={() => onDelete(record.id, record.username)}
							okText='Xoá'
							cancelText='Huỷ'
							okButtonProps={{ danger: true }}
						>
							<Button type='text' icon={<DeleteOutlined />} danger />
						</Popconfirm>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<Table
			dataSource={users}
			columns={columns}
			loading={loading}
			rowKey={(r: any) => String(r.id)}
			pagination={{
				current: page,
				pageSize,
				total,
				showSizeChanger: true,
				showTotal: (t) => `Tổng ${t} người dùng`,
				onChange: onPageChange,
			}}
			size='middle'
		/>
	);
};

export default UserTable;
