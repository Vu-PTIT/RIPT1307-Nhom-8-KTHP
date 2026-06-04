import React from 'react';
import { Card, Empty, Spin, Progress, Row, Col, Typography, Button } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Text } = Typography;

interface BorrowStatusItem {
	status: string;
	count: number;
}

interface BorrowStatusChartProps {
	borrowStatus?: BorrowStatusItem[];
	loading: boolean;
}

const BorrowStatusChart: React.FC<BorrowStatusChartProps> = ({ borrowStatus = [], loading }) => {
	let borrowed = 0;
	let returned = 0;
	let overdue = 0;

	if (Array.isArray(borrowStatus)) {
		borrowStatus.forEach((item) => {
			if (item.status === 'borrowed') borrowed += item.count;
			else if (item.status === 'returned') returned += item.count;
			else if (item.status === 'overdue') overdue += item.count;
		});
	}

	const total = borrowed + returned + overdue;
	const hasData = total > 0;

	const getPercent = (value: number) => {
		if (total === 0) return 0;
		return Number(((value / total) * 100).toFixed(1));
	};

	const renderStat = (label: string, value: number, color: string) => (
		<div style={{ marginBottom: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
				<Text>{label}</Text>
				<Text strong>{value}</Text>
			</div>
			<Progress
				percent={getPercent(value)}
				strokeColor={color}
				format={(percent) => `${percent}%`}
				status="normal"
			/>
		</div>
	);

	return (
		<Card
			title={
				<span>
					<SwapOutlined style={{ marginRight: 8, color: '#c90000' }} />
					Trạng thái phiếu mượn
				</span>
			}
			extra={
				<Button type='link' size='small' onClick={() => history.push('/quan-tri/thong-ke/phieu-muon')} style={{ color: '#c90000', padding: 0, fontWeight: 500 }}>
					Xem chi tiết
				</Button>
			}
			bordered={false}
			style={{ borderRadius: 10, border: '1px solid var(--library-line)', height: '100%' }}
			bodyStyle={{ paddingTop: 24, paddingBottom: 24 }}
		>
			<Spin spinning={loading}>
				{hasData ? (
					<div style={{ padding: '0 8px' }}>
						<Row style={{ marginBottom: 24 }}>
							<Col span={24}>
								<div style={{
									textAlign: 'center',
									padding: '16px',
									background: '#f8f9fa',
									borderRadius: 8,
									border: '1px dashed #d9d9d9'
								}}>
									<div style={{ color: '#8c8c8c', marginBottom: 4 }}>Tổng số phiếu</div>
									<div style={{ fontSize: 28, fontWeight: 'bold', color: '#262626' }}>{total}</div>
								</div>
							</Col>
						</Row>
						{renderStat('Đang mượn', borrowed, '#d4860a')}
						{renderStat('Đã trả', returned, '#1e7c44')}
						{renderStat('Quá hạn', overdue, '#c90000')}
					</div>
				) : (
					<Empty description='Không có dữ liệu' style={{ padding: '40px 0' }} />
				)}
			</Spin>
		</Card>
	);
};

export default BorrowStatusChart;

