import React from 'react';
import { Card, Col, Empty, Row, Spin, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface OverdueStatsProps {
	overdueStats?: Record<string, any>;
	loading: boolean;
}

const OverdueStats: React.FC<OverdueStatsProps> = ({ overdueStats, loading }) => {
	const entries = overdueStats ? Object.entries(overdueStats) : [];

	return (
		<Card
			title={
				<span>
					<WarningOutlined style={{ marginRight: 8, color: '#c90000' }} />
					Thống kê quá hạn
				</span>
			}
			bordered={false}
			style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
		>
			<Spin spinning={loading}>
				{entries.length > 0 ? (
					<Row gutter={[12, 12]}>
						{entries.map(([key, value]) => (
							<Col span={24} key={key}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '12px 16px',
										background: '#fff1f1',
										borderRadius: 8,
										border: '1px solid rgba(201,0,0,0.15)',
									}}
								>
									<Text style={{ fontWeight: 600 }}>{key}</Text>
									<Text strong style={{ color: '#c90000', fontSize: 18 }}>
										{typeof value === 'number' ? value.toLocaleString() : String(value)}
									</Text>
								</div>
							</Col>
						))}
					</Row>
				) : (
					<Empty description='Không có dữ liệu quá hạn' style={{ padding: '40px 0' }} />
				)}
			</Spin>
		</Card>
	);
};

export default OverdueStats;
