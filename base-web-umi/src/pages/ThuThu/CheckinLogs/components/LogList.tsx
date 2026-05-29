import React from 'react';
import { List, Card, Avatar, Tag, Typography } from 'antd';
import { LoginOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface LogItem {
	id: string;
	name: string;
	status: 'IN' | 'OUT'; // IN: Trong thư viện, OUT: Đã ra về
	checkInTime: string;
	checkOutTime?: string;
	duration: string;
}

interface LogListProps {
	data: LogItem[];
}

const LogList: React.FC<LogListProps> = ({ data }) => {
	return (
		<List
			dataSource={data}
			renderItem={(item) => (
				<Card
					bordered
					style={{
						marginBottom: 12,
						borderRadius: 12,
						borderColor: item.status === 'IN' ? '#52c41a' : '#d9d9d9', // Viền xanh nếu đang trong thư viện
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
						{/* Cột trái: Avatar + Tên + Thời gian quẹt thẻ */}
						<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
							<Avatar size={44} style={{ backgroundColor: '#f0f0f0', color: '#595959', fontWeight: 600 }}>
								{item.name.charAt(0)}
							</Avatar>
							<div>
								<div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.name}</div>
								<div style={{ color: '#8c8c8c', fontSize: 13 }}>
									<LoginOutlined style={{ marginRight: 4 }} /> {item.checkInTime}
									{item.checkOutTime && (
										<>
											<LogoutOutlined style={{ marginLeft: 12, marginRight: 4 }} /> {item.checkOutTime}
										</>
									)}
								</div>
							</div>
						</div>

						{/* Cột phải: Trạng thái Tag + Tổng thời gian tích lũy */}
						<div style={{ textAlign: 'right' }}>
							<div style={{ marginBottom: 6 }}>
								{item.status === 'IN' ? (
									<Tag color='success' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
										Trong thư viện
									</Tag>
								) : (
									<Tag color='default' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
										Đã ra về
									</Tag>
								)}
							</div>
							<div style={{ color: '#8c8c8c', fontSize: 13 }}>
								<ClockCircleOutlined style={{ marginRight: 4 }} /> Thời gian: {item.duration}
							</div>
						</div>
					</div>
				</Card>
			)}
		/>
	);
};

export default LogList;
