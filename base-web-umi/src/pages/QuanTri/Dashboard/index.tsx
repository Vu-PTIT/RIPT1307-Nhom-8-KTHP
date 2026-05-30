import React, { useState } from 'react';
import { Col, Row } from 'antd';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import {
	getDashboardSummary,
	getCheckinTraffic,
	getTopBooks,
	getOverdueStats,
	getBorrowStatusStats,
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

	return (
		<PageSkeleton
			title='Thống kê hệ thống'
			subtitle='Tổng quan hoạt động thư viện: người dùng, tài liệu, mượn trả và lượt check-in.'
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
