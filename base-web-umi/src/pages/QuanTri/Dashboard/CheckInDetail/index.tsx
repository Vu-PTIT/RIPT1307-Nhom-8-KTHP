import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Table, Tag } from 'antd';
import { ArrowLeftOutlined, LoginOutlined, LogoutOutlined, RiseOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import dayjs from 'dayjs';
import PageSkeleton from '@/components/PageSkeleton';
import ColumnChart from '@/components/Chart/ColumnChart';
import { getCheckinTraffic } from '@/services/QuanTri';
import { getAllCheckinLogs } from '@/services/ThuThu';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CheckInDetail: React.FC = () => {
	const [period, setPeriod] = useState<string>('daily');
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(10);
	
	// Filters
	const [username, setUsername] = useState<string>('');
	const [checkType, setCheckType] = useState<string>('all');
	const [dateRange, setDateRange] = useState<any>(null);

	const handleFilterChange = (type: 'type' | 'user' | 'date', val: any) => {
		setPage(1);
		if (type === 'type') setCheckType(val);
		if (type === 'user') setUsername(val);
		if (type === 'date') setDateRange(val);
	};

	// Get traffic data
	const { data: trafficData = [], loading: trafficLoading } = useRequest(
		() => getCheckinTraffic(period),
		{
			refreshDeps: [period],
			formatResult: (res) => res.data || [],
		},
	);

	const startDateStr = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
	const endDateStr = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

	// Get logs table data
	const { data: logsData, loading: logsLoading, refresh: refreshLogs } = useRequest(
		() => getAllCheckinLogs({
			check_type: checkType === 'all' ? undefined : checkType,
			username: username || undefined,
			start_date: startDateStr,
			end_date: endDateStr,
			page,
			page_size: pageSize,
		}),
		{
			refreshDeps: [checkType, username, startDateStr, endDateStr, page, pageSize],
			formatResult: (res) => res.data || { items: [], total: 0 },
		},
	);

	const xAxis = trafficData.map((d: any) => d.timestamp || d.date || d.label || '');
	const yAxis = [trafficData.map((d: any) => d.count ?? 0)];

	const logs = logsData?.items || [];
	const totalLogs = logsData?.total || 0;

	const columns = [
		{
			title: 'Độc giả',
			dataIndex: 'username',
			key: 'username',
			render: (v: string, record: any) => (
				<div>
					<div style={{ fontWeight: 600 }}>{v}</div>
					<div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
				</div>
			),
		},
		{
			title: 'Thời gian',
			dataIndex: 'check_time',
			key: 'check_time',
			render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
		},
		{
			title: 'Hình thức',
			dataIndex: 'check_type',
			key: 'check_type',
			render: (v: string) => {
				const isIn = v === 'in';
				return isIn ? (
					<Tag color='success' icon={<LoginOutlined />}>Vào thư viện</Tag>
				) : (
					<Tag color='error' icon={<LogoutOutlined />}>Ra về</Tag>
				);
			},
		},
		{
			title: 'Phương thức',
			dataIndex: 'method',
			key: 'method',
			render: (v: string) => (
				<Tag color='blue'>{v === 'manual' ? 'Thủ công (Thủ thư)' : 'Tự động'}</Tag>
			),
		},
		{
			title: 'Người ghi nhận',
			dataIndex: 'handled_by_name',
			key: 'handled_by_name',
			render: (v: string) => v || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Tự động</span>,
		},
	];

	return (
		<PageSkeleton
			title='Chi tiết lưu lượng check-in'
			subtitle='Xem chi tiết thống kê biểu đồ và danh sách lịch sử ra vào thư viện.'
			extra={
				<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/quan-tri/thong-ke')}>
					Quay lại Dashboard
				</Button>
			}
		>
			<div className='library-panel'>
				<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
					<Col span={24}>
						<Card
							title={
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<span>
										<RiseOutlined style={{ marginRight: 8, color: '#c90000' }} />
										Biểu đồ lưu lượng check-in
									</span>
									<Select value={period} onChange={setPeriod} style={{ width: 140 }} size='middle'>
										<Option value='daily'>Theo ngày</Option>
										<Option value='weekly'>Theo tuần</Option>
										<Option value='monthly'>Theo tháng</Option>
									</Select>
								</div>
							}
							bordered={false}
							style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
						>
							<div style={{ padding: '8px 0' }}>
								{xAxis.length > 0 ? (
									<ColumnChart
										xAxis={xAxis}
										yAxis={yAxis}
										yLabel={['Lượt check-in']}
										height={350}
										colors={['#c90000']}
										formatY={(v) => `${v}`}
									/>
								) : (
									<div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
										Không có dữ liệu biểu đồ
									</div>
								)}
							</div>
						</Card>
					</Col>
				</Row>

				<Card
					title='Bộ lọc & Danh sách nhật ký check-in'
					bordered={false}
					style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
				>
					<Form layout='inline' style={{ marginBottom: 24, gap: 16 }}>
						<Form.Item label='Mã/Tên độc giả'>
							<Input
								placeholder='Nhập để tìm kiếm...'
								value={username}
								onChange={(e) => handleFilterChange('user', e.target.value)}
								style={{ width: 200 }}
								allowClear
							/>
						</Form.Item>
						<Form.Item label='Hình thức'>
							<Select value={checkType} onChange={(v) => handleFilterChange('type', v)} style={{ width: 150 }}>
								<Option value='all'>Tất cả</Option>
								<Option value='in'>Vào thư viện</Option>
								<Option value='out'>Ra về</Option>
							</Select>
						</Form.Item>
						<Form.Item label='Khoảng thời gian'>
							<RangePicker
								value={dateRange}
								onChange={(v) => handleFilterChange('date', v)}
								placeholder={['Từ ngày', 'Đến ngày']}
								format='DD/MM/YYYY'
							/>
						</Form.Item>
						<Form.Item>
							<Button type='primary' onClick={refreshLogs}>Làm mới</Button>
						</Form.Item>
					</Form>

					<Table
						dataSource={logs}
						columns={columns}
						rowKey='id'
						loading={logsLoading}
						pagination={{
							current: page,
							pageSize: pageSize,
							total: totalLogs,
							onChange: (p, s) => {
								setPage(p);
								if (s) setPageSize(s);
							},
						}}
						style={{ borderRadius: 8, overflow: 'hidden' }}
					/>
				</Card>
			</div>
		</PageSkeleton>
	);
};

export default CheckInDetail;
