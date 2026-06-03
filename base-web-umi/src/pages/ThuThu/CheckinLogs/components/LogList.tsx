import React from 'react';
import { List, Card, Avatar, Tag, Typography, Spin, Empty } from 'antd';
import { LoginOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

// Cấu trúc từ API backend (CheckinLogListItem)
export interface LogItem {
	id: string;
	username: string;
	email: string;
	check_type: string; // 'in' | 'out'
	method: string;
	check_time: string;
	handled_by_name?: string;
	// Legacy fields (mock data) - kept for backward compat
	name?: string;
	status?: 'IN' | 'OUT';
	checkInTime?: string;
	checkOutTime?: string;
	duration?: string;
}

interface LogListProps {
	data: LogItem[];
	loading?: boolean;
	pagination?: any;
}

const LogList: React.FC<LogListProps> = ({ data, loading, pagination }) => {
	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: 60 }}>
				<Spin size='large' />
			</div>
		);
	}

	if (!data || data.length === 0) {
		return <Empty description='Chưa có nhật ký nào' style={{ padding: 60 }} />;
	}

	return (
		<List
			dataSource={data}
			pagination={pagination}
			renderItem={(item) => {
				// Hỗ trợ cả dữ liệu API thực và mock data cũ
				const displayName = item.name || item.username || '';
				const isIn = (item.check_type?.toLowerCase() === 'in') || item.status === 'IN';
				const checkTime = item.checkInTime || (item.check_time ? dayjs(item.check_time).format('DD/MM HH:mm') : '');
				const checkOutTime = item.checkOutTime;

				return (
					<Card
						bordered
						style={{
							marginBottom: 12,
							borderRadius: 12,
							borderColor: isIn ? '#52c41a' : '#d9d9d9',
							boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
						}}
						bodyStyle={{ padding: '16px 24px' }}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								flexWrap: 'wrap',
								gap: 12,
							}}
						>
							{/* Cột trái: Avatar + Tên + Thời gian */}
							<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
								<Avatar
									size={44}
									style={{ backgroundColor: isIn ? '#f6ffed' : '#f0f0f0', color: isIn ? '#52c41a' : '#595959', fontWeight: 600 }}
								>
									{displayName.charAt(0).toUpperCase()}
								</Avatar>
								<div>
									<div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
										{displayName}
										{item.email && <Text type='secondary' style={{ fontSize: 13, marginLeft: 8 }}>{item.email}</Text>}
									</div>
									<div style={{ color: '#8c8c8c', fontSize: 13 }}>
										<LoginOutlined style={{ marginRight: 4 }} /> {checkTime}
										{checkOutTime && (
											<>
												<LogoutOutlined style={{ marginLeft: 12, marginRight: 4 }} /> {checkOutTime}
											</>
										)}
									</div>
									{item.handled_by_name && (
										<div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 2 }}>
											Ghi bởi: {item.handled_by_name}
										</div>
									)}
								</div>
							</div>

							{/* Cột phải: Tag trạng thái */}
							<div style={{ textAlign: 'right' }}>
								<div style={{ marginBottom: 6 }}>
									{isIn ? (
										<Tag color='success' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
											Trong thư viện
										</Tag>
									) : (
										<Tag color='default' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
											Đã ra về
										</Tag>
									)}
								</div>
								{item.duration && (
									<div style={{ color: '#8c8c8c', fontSize: 13 }}>
										<ClockCircleOutlined style={{ marginRight: 4 }} /> {item.duration}
									</div>
								)}
								<div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 2 }}>
									{item.method === 'manual' ? '📋 Thủ công' : '🔄 Tự động'}
								</div>
							</div>
						</div>
					</Card>
				);
			}}
		/>
	);
};

export default LogList;
