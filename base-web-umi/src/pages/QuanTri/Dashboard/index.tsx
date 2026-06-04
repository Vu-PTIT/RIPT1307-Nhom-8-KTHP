import React, { useState } from 'react';
import { Col, Row, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import {
	getDashboardSummary,
	getCheckinTraffic,
	getTopBooks,
	getOverdueStats,
	getBorrowStatusStats,
	exportDashboardExcel,
} from '@/services/QuanTri';
import StatCards from './components/StatCards';
import TrafficChart from './components/TrafficChart';
import BorrowStatusChart from './components/BorrowStatusChart';
import TopBooksTable from './components/TopBooksTable';
import OverdueStats from './components/OverdueStats';

const Dashboard: React.FC = () => {
	const [period, setPeriod] = useState<string>('daily');

	const { data: summary, loading: summaryLoading } = useRequest(getDashboardSummary, {
		formatResult: (res) => res.data || res,
	});

	const { data: trafficData = [], loading: trafficLoading } = useRequest(
		() => getCheckinTraffic(period),
		{
			refreshDeps: [period],
			formatResult: (res) => res.data || [],
		},
	);

	const { data: topBooks = [], loading: topBooksLoading } = useRequest(
		() => getTopBooks(10),
		{ formatResult: (res) => res.data || [] },
	);

	const { data: overdueStats, loading: overdueLoading } = useRequest(getOverdueStats, {
		formatResult: (res) => res.data || {},
	});

	const { data: borrowStatus, loading: borrowStatusLoading } = useRequest(getBorrowStatusStats, {
		formatResult: (res) => res.data || {},
	});

	const [exporting, setExporting] = useState(false);

	const handleExport = async () => {
		try {
			setExporting(true);
			const res = await exportDashboardExcel();
			const blobData = (res as any).data || res;
			const url = window.URL.createObjectURL(new Blob([blobData]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'dashboard_report.xlsx');
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
			message.success('Xuất báo cáo thành công!');
		} catch (error) {
			message.error('Có lỗi xảy ra khi xuất báo cáo!');
		} finally {
			setExporting(false);
		}
	};

	return (
		<PageSkeleton
			title='Thống kê hệ thống'
			subtitle='Tổng quan hoạt động thư viện: người dùng, tài liệu, mượn trả và lượt check-in.'
			extra={
				<Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
					Xuất báo cáo
				</Button>
			}
		>
			<div className='library-panel'>
				<StatCards summary={summary} loading={summaryLoading} />

				<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
					<Col xs={24} lg={16}>
						<TrafficChart
							trafficData={trafficData}
							loading={trafficLoading}
							period={period}
							onPeriodChange={setPeriod}
						/>
					</Col>
					<Col xs={24} lg={8}>
						<BorrowStatusChart borrowStatus={borrowStatus} loading={borrowStatusLoading} />
					</Col>
				</Row>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={14}>
						<TopBooksTable topBooks={topBooks} loading={topBooksLoading} />
					</Col>
					<Col xs={24} lg={10}>
						<OverdueStats overdueStats={overdueStats} loading={overdueLoading} />
					</Col>
				</Row>
			</div>
		</PageSkeleton>
	);
};

export default Dashboard;
