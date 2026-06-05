import React from 'react';
import { Card, Button, Badge, Space, Typography, Tag, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface PendingRenewalItem {
	id: string;
	bookTitle: string;
	bookImage?: string;
	copyCode?: string;
	readerName: string;
	borrowDate: string;
	currentDueDate: string;
	newDueDate?: string;
	renewalCount: string;
	requestTime: string;
	isOverdue: boolean;
	overdueDays?: number;
}

interface PendingListProps {
	data: PendingRenewalItem[];
	onAccept: (id: string) => void;
	onReject: (id: string) => void;
}

const PendingList: React.FC<PendingListProps> = ({ data, onAccept, onReject }) => {
	return (
		<div style={{ marginBottom: 32 }}>
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
				<Title level={5} style={{ margin: 0, fontWeight: 600 }}>
					Yêu cầu chờ duyệt
				</Title>
				<Badge
					count={data.length}
					style={{ backgroundColor: '#fffbe6', color: '#d46b08', boxShadow: 'none', border: '1px solid #ffe58f' }}
				/>
			</div>

			{data.map((item) => (
				<Card
					key={item.id}
					bordered
					style={{
						borderRadius: 12,
						borderColor: item.isOverdue ? '#ffccc7' : '#d9d9d9',
						backgroundColor: item.isOverdue ? '#fff1f0' : '#fff',
						marginBottom: 16,
						boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
					}}
					bodyStyle={{ padding: 20 }}
				>
					<Row gutter={[24, 16]} align='middle'>
						{/* Ảnh bìa sách */}
						<Col xs={24} sm={3} md={2} style={{ textAlign: 'center' }}>
							<img
								src={item.bookImage || 'https://via.placeholder.com/80x110?text=Book'}
								alt={item.bookTitle}
								style={{
									width: 70,
									height: 95,
									objectFit: 'cover',
									borderRadius: 6,
									boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
								}}
							/>
						</Col>

						{/* Thông tin chi tiết */}
						<Col xs={24} sm={14} md={16}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
								<div>
									<Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16 }}>
										{item.bookTitle}
									</Title>
									<Text type='secondary' style={{ display: 'block', marginBottom: 2 }}>
										Mã bản sao: <Text strong>{item.copyCode || '—'}</Text>
									</Text>
									<Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
										Người dùng: {item.readerName}
									</Text>
								</div>
								{item.isOverdue && (
									<Tag color='error' icon={<ExclamationCircleOutlined />} style={{ borderRadius: 10 }}>
										Quá hạn {item.overdueDays} ngày
									</Tag>
								)}
							</div>

							<Row gutter={[16, 8]}>
								<Col xs={12} sm={6}>
									<div style={{ color: '#8c8c8c', fontSize: 12 }}>Ngày mượn</div>
									<div style={{ fontWeight: 500 }}>{item.borrowDate}</div>
								</Col>
								<Col xs={12} sm={6}>
									<div style={{ color: '#8c8c8c', fontSize: 12 }}>Hạn trả cũ</div>
									<div style={{ fontWeight: 500, color: item.isOverdue ? '#ff4d4f' : 'inherit', textDecoration: 'line-through' }}>
										{item.currentDueDate}
									</div>
								</Col>
								<Col xs={12} sm={6}>
									<div style={{ color: '#8c8c8c', fontSize: 12 }}>Xin gia hạn đến</div>
									<div style={{ fontWeight: 500, color: '#1677ff' }}>
										{item.newDueDate}
									</div>
								</Col>
								<Col xs={12} sm={6}>
									<div style={{ color: '#8c8c8c', fontSize: 12 }}>Số lần gia hạn</div>
									<div style={{ fontWeight: 500 }}>{item.renewalCount}</div>
								</Col>
							</Row>

							<div style={{ marginTop: 12, color: '#bfbfbf', fontSize: 12 }}>Yêu cầu lúc: {item.requestTime}</div>
						</Col>

						{/* Bộ nút hành động */}
						<Col xs={24} sm={7} md={6} style={{ textAlign: 'right' }}>
							<Space size='middle'>
								<Button
									type='primary'
									icon={<CheckCircleOutlined />}
									style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 6, fontWeight: 500 }}
									onClick={() => onAccept(item.id)}
								>
									Duyệt
								</Button>
								<Button
									type='primary'
									danger
									icon={<CloseCircleOutlined />}
									style={{ borderRadius: 6, fontWeight: 500 }}
									onClick={() => onReject(item.id)}
								>
									Từ chối
								</Button>
							</Space>
						</Col>
					</Row>
				</Card>
			))}
		</div>
	);
};

export default PendingList;
