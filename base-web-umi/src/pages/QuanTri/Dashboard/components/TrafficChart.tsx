import React from 'react';
import { Card, Empty, Select, Spin, Button } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { history } from 'umi';
import ColumnChart from '@/components/Chart/ColumnChart';

const { Option } = Select;

interface TrafficChartProps {
	trafficData: any[];
	loading: boolean;
	period: string;
	onPeriodChange: (v: string) => void;
}

const TrafficChart: React.FC<TrafficChartProps> = ({
	trafficData,
	loading,
	period,
	onPeriodChange,
}) => {
	const xAxis = trafficData.map((d) => d.timestamp || d.date || d.label || '');
	const yAxis = [trafficData.map((d) => d.count ?? 0)];

	return (
		<Card
			title={
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span>
						<RiseOutlined style={{ marginRight: 8, color: '#c90000' }} />
						Lưu lượng check-in
					</span>
					<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
						<Select value={period} onChange={onPeriodChange} style={{ width: 110 }} size='small'>
							<Option value='daily'>Theo ngày</Option>
							<Option value='weekly'>Theo tuần</Option>
							<Option value='monthly'>Theo tháng</Option>
						</Select>
						<Button type='link' size='small' onClick={() => history.push('/quan-tri/thong-ke/check-in')} style={{ color: '#c90000', padding: 0, fontWeight: 500 }}>
							Xem chi tiết
						</Button>
					</div>
				</div>
			}
			bordered={false}
			style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
			bodyStyle={{ paddingTop: 8 }}
		>
			<Spin spinning={loading}>
				{xAxis.length > 0 ? (
					<ColumnChart
						xAxis={xAxis}
						yAxis={yAxis}
						yLabel={['Lượt check-in']}
						height={280}
						colors={['#c90000']}
						formatY={(v) => `${v}`}
					/>
				) : (
					<Empty description='Không có dữ liệu lưu lượng' style={{ padding: '40px 0' }} />
				)}
			</Spin>
		</Card>
	);
};

export default TrafficChart;
