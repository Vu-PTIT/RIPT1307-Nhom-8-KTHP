import React from 'react';
import { Card, Empty, Spin } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import DonutChart from '@/components/Chart/DonutChart';

const BORROW_LABELS = ['Đang mượn', 'Đã trả', 'Quá hạn'];
const BORROW_COLORS = ['#d4860a', '#1e7c44', '#c90000'];

interface BorrowStatusChartProps {
	borrowStatus?: {
		borrowed?: number;
		returned?: number;
		overdue?: number;
	};
	loading: boolean;
}

const BorrowStatusChart: React.FC<BorrowStatusChartProps> = ({ borrowStatus, loading }) => {
	const values = [
		borrowStatus?.borrowed ?? 0,
		borrowStatus?.returned ?? 0,
		borrowStatus?.overdue ?? 0,
	];
	const hasData = values.some((v) => v > 0);

	return (
		<Card
			title={
				<span>
					<SwapOutlined style={{ marginRight: 8, color: '#c90000' }} />
					Trạng thái phiếu mượn
				</span>
			}
			bordered={false}
			style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
			bodyStyle={{ paddingTop: 8 }}
		>
			<Spin spinning={loading}>
				{hasData ? (
					<DonutChart
						xAxis={BORROW_LABELS}
						yAxis={[values]}
						yLabel={BORROW_LABELS}
						height={280}
						colors={BORROW_COLORS}
						formatY={(v) => `${v}`}
						showTotal
					/>
				) : (
					<Empty description='Không có dữ liệu' style={{ padding: '40px 0' }} />
				)}
			</Spin>
		</Card>
	);
};

export default BorrowStatusChart;
