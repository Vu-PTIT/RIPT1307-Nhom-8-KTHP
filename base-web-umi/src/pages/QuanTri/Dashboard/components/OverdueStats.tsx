import React from 'react';
import { Card, Col, Empty, Row, Spin, Typography, List, Tag, Button } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { history } from 'umi';
import dayjs from 'dayjs';

const { Text } = Typography;

interface OverdueItem {
	borrow_id: string;
	reader_username: string;
	document_title: string;
	due_date: string;
	days_overdue: number;
}

interface OverdueStatsData {
	overdue_count?: number;
	overdue_rate?: number;
	items?: OverdueItem[];
}

interface OverdueStatsProps {
	overdueStats?: OverdueStatsData;
	loading: boolean;
}

const OverdueStats: React.FC<OverdueStatsProps> = ({ overdueStats, loading }) => {
	const count = overdueStats?.overdue_count || 0;
	const rate = overdueStats?.overdue_rate || 0;
	const items = overdueStats?.items || [];

	return (
		<Card
			title={
				<span>
					<WarningOutlined style={{ marginRight: 8, color: '#c90000' }} />
					Thống kê quá hạn
				</span>
			}
			extra={
				<Button type='link' size='small' onClick={() => history.push('/quan-tri/thong-ke/qua-han')} style={{ color: '#c90000', padding: 0, fontWeight: 500 }}>
					Xem chi tiết
				</Button>
			}
			bordered={false}
			style={{ borderRadius: 10, border: '1px solid var(--library-line)', height: '100%' }}
			bodyStyle={{ padding: '16px' }}
		>
			<Spin spinning={loading}>
				<Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
					<Col span={12}>
						<div
							style={{
								padding: '12px 16px',
								background: '#fff1f1',
								borderRadius: 8,
								border: '1px solid rgba(201,0,0,0.15)',
								textAlign: 'center',
							}}
						>
							<div style={{ fontWeight: 600, color: '#666', marginBottom: 4 }}>Số lượng quá hạn</div>
							<div style={{ color: '#c90000', fontSize: 24, fontWeight: 'bold' }}>{count}</div>
						</div>
					</Col>
					<Col span={12}>
						<div
							style={{
								padding: '12px 16px',
								background: '#fff1f1',
								borderRadius: 8,
								border: '1px solid rgba(201,0,0,0.15)',
								textAlign: 'center',
							}}
						>
							<div style={{ fontWeight: 600, color: '#666', marginBottom: 4 }}>Tỷ lệ quá hạn</div>
							<div style={{ color: '#c90000', fontSize: 24, fontWeight: 'bold' }}>
								{rate.toFixed(2)}%
							</div>
						</div>
					</Col>
				</Row>

				{items.length > 0 ? (
					<List
						itemLayout='horizontal'
						dataSource={items}
						renderItem={(item) => (
							<List.Item>
								<List.Item.Meta
									title={
										<Text strong style={{ fontSize: 13 }}>
											{item.document_title}
										</Text>
									}
									description={
										<div style={{ fontSize: 12 }}>
											Người mượn: <Text strong>{item.reader_username}</Text>
											<br />
											Hạn trả: {dayjs(item.due_date).format('DD/MM/YYYY')}
										</div>
									}
								/>
								<div>
									<Tag color='error' icon={<ClockCircleOutlined />}>
										Trễ {item.days_overdue} ngày
									</Tag>
								</div>
							</List.Item>
						)}
						style={{ maxHeight: 240, overflow: 'auto' }}
					/>
				) : (
					<Empty description='Không có dữ liệu quá hạn' style={{ padding: '20px 0' }} />
				)}
			</Spin>
		</Card>
	);
};

export default OverdueStats;
