import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Table, Tag, Modal, List, Avatar, message } from 'antd';
import { ArrowLeftOutlined, SwapOutlined, BookOutlined, UserOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import dayjs from 'dayjs';
import PageSkeleton from '@/components/PageSkeleton';
import { getBorrowStatusStats } from '@/services/QuanTri';
import { getAllBorrowsLibrarian, getBorrowDetailLibrarian } from '@/services/ThuThu';

const { Option } = Select;
const { RangePicker } = DatePicker;

const BorrowStatusDetail: React.FC = () => {
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [readerUsername, setReaderUsername] = useState<string>('');
	const [dateRange, setDateRange] = useState<any>(null);
	
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(10);

	// Detail Modal state
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [selectedBorrowId, setSelectedBorrowId] = useState<string | null>(null);

	// Get borrow status stats (aggregated counts)
	const { data: statusStats = [], loading: statsLoading } = useRequest(getBorrowStatusStats, {
		formatResult: (res) => res.data || [],
	});

	const backendStatusParam = statusFilter !== 'all' ? statusFilter : undefined;
	const startDateStr = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
	const endDateStr = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

	const handleFilterChange = (type: 'status' | 'user' | 'date', val: any) => {
		setPage(1);
		if (type === 'status') setStatusFilter(val);
		if (type === 'user') setReaderUsername(val);
		if (type === 'date') setDateRange(val);
	};
	
	const { data: borrowsData, loading: listLoading, refresh: refreshList } = useRequest(
		() => getAllBorrowsLibrarian({
			status: backendStatusParam,
			username: readerUsername || undefined,
			start_date: startDateStr,
			end_date: endDateStr,
			page,
			page_size: pageSize,
		}),
		{
			refreshDeps: [backendStatusParam, readerUsername, startDateStr, endDateStr, page, pageSize],
			formatResult: (res) => ({
				items: res.data || [],
				total: parseInt(res.headers?.['x-total-count'] || '0', 10) || (res.data || []).length
			}),
		},
	);

	// Get selected borrow detail
	const { data: borrowDetail, loading: detailLoading } = useRequest(
		() => {
			if (!selectedBorrowId) return Promise.resolve(null);
			return getBorrowDetailLibrarian(selectedBorrowId);
		},
		{
			refreshDeps: [selectedBorrowId],
			formatResult: (res) => res?.data || null,
		}
	);

	// Compute stats counts
	let pendingCount = 0;
	let borrowedCount = 0;
	let returnedCount = 0;
	let overdueCount = 0;

	statusStats.forEach((item: any) => {
		if (item.status === 'pending') pendingCount = item.count;
		else if (item.status === 'borrowed') borrowedCount = item.count;
		else if (item.status === 'returned') returnedCount = item.count;
		else if (item.status === 'overdue') overdueCount = item.count;
	});

	const totalCount = pendingCount + borrowedCount + returnedCount + overdueCount;

	const today = dayjs();
	const processedBorrows = (borrowsData?.items || []).map((b: any) => {
		let currentStatus = b.status;
		// If status is borrowed but due date is passed, it is overdue
		if (b.status === 'borrowed' && b.due_date && dayjs(b.due_date).isBefore(today, 'day')) {
			currentStatus = 'overdue';
		}
		return { ...b, computedStatus: currentStatus };
	});

	const paginatedBorrows = processedBorrows;
	const totalBorrows = borrowsData?.total || 0;

	const handleOpenDetail = (id: string) => {
		setSelectedBorrowId(id);
		setDetailModalVisible(true);
	};

	const columns = [
		{
			title: 'Mã phiếu',
			dataIndex: 'id',
			key: 'id',
			render: (v: string) => <Tag color='purple'>#{v.substring(v.length - 8).toUpperCase()}</Tag>,
		},
		{
			title: 'Độc giả',
			dataIndex: 'reader_username',
			key: 'reader_username',
			render: (v: string, record: any) => (
				<div>
					<div style={{ fontWeight: 600 }}>{v}</div>
					<div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.reader_email}</div>
				</div>
			),
		},
		{
			title: 'Ngày mượn',
			dataIndex: 'borrow_date',
			key: 'borrow_date',
			render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '---',
		},
		{
			title: 'Hạn trả',
			dataIndex: 'due_date',
			key: 'due_date',
			render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '---',
		},
		{
			title: 'Số sách',
			dataIndex: 'item_count',
			key: 'item_count',
			render: (v: number) => <Tag color='cyan'>{v ?? 0} cuốn</Tag>,
		},
		{
			title: 'Mã bản sao',
			dataIndex: 'copy_codes',
			key: 'copy_codes',
			render: (codes: string[]) => (
				<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
					{codes?.map(code => <Tag color='geekblue' key={code}>{code}</Tag>)}
				</div>
			),
		},
		{
			title: 'Trạng thái',
			dataIndex: 'computedStatus',
			key: 'computedStatus',
			render: (status: string) => {
				const map: any = {
					pending: { label: 'Chờ lấy sách', color: 'orange' },
					borrowed: { label: 'Đang mượn', color: 'blue' },
					returned: { label: 'Đã trả', color: 'green' },
					overdue: { label: 'Quá hạn', color: 'red' },
					cancelled: { label: 'Đã hủy', color: 'default' },
				};
				const current = map[status] || { label: status, color: 'default' };
				return <Tag color={current.color} style={{ fontWeight: 500 }}>{current.label}</Tag>;
			},
		},
		{
			title: 'Hành động',
			key: 'action',
			render: (_: any, record: any) => (
				<Button
					type='link'
					icon={<EyeOutlined />}
					onClick={() => handleOpenDetail(record.id || record._id)}
				>
					Chi tiết
				</Button>
			),
		},
	];

	return (
		<PageSkeleton
			title='Chi tiết trạng thái phiếu mượn'
			subtitle='Xem thống kê phân bổ trạng thái phiếu mượn và tra cứu danh sách chi tiết.'
			extra={
				<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/quan-tri/thong-ke')}>
					Quay lại Dashboard
				</Button>
			}
		>
			<div className='library-panel'>
				{/* Statistics Summary Cards */}
				<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
					<Col xs={12} sm={6} md={4}>
						<Card bordered={false} style={{ textAlign: 'center', border: '1px solid var(--library-line)', borderRadius: 8 }}>
							<div style={{ color: '#8c8c8c', marginBottom: 4 }}>Tổng số phiếu</div>
							<div style={{ fontSize: 22, fontWeight: 'bold' }}>{totalCount}</div>
						</Card>
					</Col>
					<Col xs={12} sm={6} md={5}>
						<Card bordered={false} style={{ textAlign: 'center', border: '1px solid var(--library-line)', borderRadius: 8, background: '#fffbe6' }}>
							<div style={{ color: '#d48806', marginBottom: 4 }}>Chờ lấy sách</div>
							<div style={{ fontSize: 22, fontWeight: 'bold', color: '#d48806' }}>{pendingCount}</div>
						</Card>
					</Col>
					<Col xs={12} sm={6} md={5}>
						<Card bordered={false} style={{ textAlign: 'center', border: '1px solid var(--library-line)', borderRadius: 8, background: '#e6f7ff' }}>
							<div style={{ color: '#096dd9', marginBottom: 4 }}>Đang mượn</div>
							<div style={{ fontSize: 22, fontWeight: 'bold', color: '#096dd9' }}>{borrowedCount}</div>
						</Card>
					</Col>
					<Col xs={12} sm={6} md={5}>
						<Card bordered={false} style={{ textAlign: 'center', border: '1px solid var(--library-line)', borderRadius: 8, background: '#f6ffed' }}>
							<div style={{ color: '#389e0d', marginBottom: 4 }}>Đã trả</div>
							<div style={{ fontSize: 22, fontWeight: 'bold', color: '#389e0d' }}>{returnedCount}</div>
						</Card>
					</Col>
					<Col xs={12} sm={6} md={5}>
						<Card bordered={false} style={{ textAlign: 'center', border: '1px solid var(--library-line)', borderRadius: 8, background: '#fff1f0' }}>
							<div style={{ color: '#cf1322', marginBottom: 4 }}>Quá hạn</div>
							<div style={{ fontSize: 22, fontWeight: 'bold', color: '#cf1322' }}>{overdueCount}</div>
						</Card>
					</Col>
				</Row>

				{/* Filter & Table */}
				<Card
					title={
						<span>
							<SwapOutlined style={{ marginRight: 8, color: '#c90000' }} />
							Danh sách phiếu mượn
						</span>
					}
					bordered={false}
					style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
				>
					<Form layout='inline' style={{ marginBottom: 24, gap: 16 }}>
						<Form.Item label='Tên/Mã độc giả'>
							<Input
								placeholder='Nhập tên độc giả...'
								value={readerUsername}
								onChange={(e) => handleFilterChange('user', e.target.value)}
								style={{ width: 180 }}
								allowClear
							/>
						</Form.Item>
						<Form.Item label='Trạng thái'>
							<Select value={statusFilter} onChange={(v) => handleFilterChange('status', v)} style={{ width: 140 }}>
								<Option value='all'>Tất cả</Option>
								<Option value='pending'>Chờ lấy sách</Option>
								<Option value='borrowed'>Đang mượn</Option>
								<Option value='returned'>Đã trả</Option>
								<Option value='overdue'>Quá hạn</Option>
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
							<Button type='primary' onClick={refreshList}>Làm mới</Button>
						</Form.Item>
					</Form>

					<Table
						dataSource={paginatedBorrows}
						columns={columns}
						rowKey='id'
						loading={listLoading}
						pagination={{
							current: page,
							pageSize: pageSize,
							total: totalBorrows,
							onChange: (p, s) => {
								setPage(p);
								if (s) setPageSize(s);
							},
						}}
						style={{ borderRadius: 8, overflow: 'hidden' }}
					/>
				</Card>

				{/* Detail Modal */}
				<Modal
					title={`Chi tiết phiếu mượn: #${selectedBorrowId?.substring(selectedBorrowId.length - 8).toUpperCase()}`}
					visible={detailModalVisible}
					onCancel={() => {
						setDetailModalVisible(false);
						setSelectedBorrowId(null);
					}}
					footer={[
						<Button key='close' onClick={() => setDetailModalVisible(false)}>Đóng</Button>
					]}
					width={600}
				>
					{detailLoading ? (
						<div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
					) : borrowDetail ? (
						<div>
							<div style={{ marginBottom: 20, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
								<Row gutter={[16, 8]}>
									<Col span={12}>
										<UserOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
										<strong>Độc giả:</strong> {borrowDetail.reader_username || '---'}
									</Col>
									<Col span={12}>
										<CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
										<strong>Ngày mượn:</strong> {borrowDetail.borrow_date ? dayjs(borrowDetail.borrow_date).format('DD/MM/YYYY') : '---'}
									</Col>
									<Col span={12}>
										<CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
										<strong>Hạn trả:</strong> {borrowDetail.due_date ? dayjs(borrowDetail.due_date).format('DD/MM/YYYY') : '---'}
									</Col>
									<Col span={12}>
										<strong>Trạng thái phiếu:</strong>{' '}
										<Tag color={
											borrowDetail.status === 'pending' ? 'orange' :
											borrowDetail.status === 'borrowed' ? 'blue' :
											borrowDetail.status === 'returned' ? 'green' : 'default'
										}>
											{borrowDetail.status === 'pending' ? 'Chờ lấy sách' :
											 borrowDetail.status === 'borrowed' ? 'Đang mượn' :
											 borrowDetail.status === 'returned' ? 'Đã trả' : borrowDetail.status}
										</Tag>
									</Col>
								</Row>
							</div>

							<h3>Danh sách cuốn sách</h3>
							<List
								itemLayout='horizontal'
								dataSource={borrowDetail.items || []}
								renderItem={(item: any) => (
									<List.Item>
										<List.Item.Meta
											avatar={<Avatar shape='square' size={40} icon={<BookOutlined />} src={item.cover_image} />}
											title={<strong>{item.document_title}</strong>}
											description={
												<div>
													Tác giả: {item.author || 'Không rõ'} | Mã vạch: <Tag color='geekblue'>{item.copy_code}</Tag>
													<br />
													Hạn trả sách: {dayjs(item.due_date).format('DD/MM/YYYY')}
													{item.return_date && (
														<span style={{ color: '#52c41a', marginLeft: 10 }}>
															(Đã trả ngày {dayjs(item.return_date).format('DD/MM/YYYY')})
														</span>
													)}
												</div>
											}
										/>
										<div>
											<Tag color={
												item.status === 'returned' ? 'green' :
												item.status === 'overdue' ? 'red' : 'blue'
											}>
												{item.status === 'returned' ? 'Đã trả' :
												 item.status === 'overdue' ? 'Quá hạn' : 'Đang mượn'}
											</Tag>
										</div>
									</List.Item>
								)}
							/>
						</div>
					) : (
						<div style={{ textAlign: 'center', padding: 40 }}>Không tìm thấy chi tiết</div>
					)}
				</Modal>
			</div>
		</PageSkeleton>
	);
};

export default BorrowStatusDetail;
