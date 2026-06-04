import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Table, Tag } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import dayjs from 'dayjs';
import PageSkeleton from '@/components/PageSkeleton';
import { getOverdueStats } from '@/services/QuanTri';

const OverdueDetail: React.FC = () => {
	const [readerSearch, setReaderSearch] = useState<string>('');
	const [titleSearch, setTitleSearch] = useState<string>('');

	// Get overdue stats data
	const { data: overdueData, loading, refresh } = useRequest(getOverdueStats, {
		formatResult: (res) => res.data || {},
	});

	const count = overdueData?.overdue_count || 0;
	const rate = overdueData?.overdue_rate || 0;
	const items = overdueData?.items || [];

	// Local filtering
	const filteredItems = items.filter((item: any) => {
		if (readerSearch && !item.reader_username?.toLowerCase().includes(readerSearch.toLowerCase())) {
			return false;
		}
		if (titleSearch && !item.document_title?.toLowerCase().includes(titleSearch.toLowerCase())) {
			return false;
		}
		return true;
	});

	const columns = [
		{
			title: 'Tài liệu quá hạn',
			dataIndex: 'document_title',
			key: 'document_title',
			render: (v: string) => <strong style={{ color: '#262626' }}>{v}</strong>,
		},
		{
			title: 'Người mượn',
			dataIndex: 'reader_username',
			key: 'reader_username',
			render: (v: string) => <Tag color='orange'>{v || 'Unknown'}</Tag>,
		},
		{
			title: 'Hạn trả sách',
			dataIndex: 'due_date',
			key: 'due_date',
			render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '---',
		},
		{
			title: 'Số ngày trễ hạn',
			dataIndex: 'days_overdue',
			key: 'days_overdue',
			width: 180,
			align: 'center' as const,
			sorter: (a: any, b: any) => (a.days_overdue || 0) - (b.days_overdue || 0),
			render: (v: number) => (
				<Tag color='error' icon={<ClockCircleOutlined />} style={{ fontWeight: 600, padding: '2px 8px' }}>
					Trễ {v} ngày
				</Tag>
			),
		},
	];

	return (
		<PageSkeleton
			title='Chi tiết thống kê quá hạn'
			subtitle='Xem thống kê chi tiết tỷ lệ quá hạn và danh sách chi tiết các tài liệu đang trễ hạn trả.'
			extra={
				<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/quan-tri/thong-ke')}>
					Quay lại Dashboard
				</Button>
			}
		>
			<div className='library-panel'>
				{/* Overview cards */}
				<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
					<Col xs={24} sm={12}>
						<div
							style={{
								padding: '20px 24px',
								background: '#fff1f1',
								borderRadius: 10,
								border: '1px solid rgba(201,0,0,0.15)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<div style={{ fontWeight: 600, color: '#595959', fontSize: 15, marginBottom: 4 }}>
									Số lượng tài liệu quá hạn
								</div>
								<div style={{ color: '#c90000', fontSize: 32, fontWeight: 'bold' }}>{count}</div>
							</div>
							<WarningOutlined style={{ fontSize: 40, color: 'rgba(201,0,0,0.2)' }} />
						</div>
					</Col>
					<Col xs={24} sm={12}>
						<div
							style={{
								padding: '20px 24px',
								background: '#fff1f1',
								borderRadius: 10,
								border: '1px solid rgba(201,0,0,0.15)',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<div style={{ fontWeight: 600, color: '#595959', fontSize: 15, marginBottom: 4 }}>
									Tỷ lệ quá hạn hệ thống
								</div>
								<div style={{ color: '#c90000', fontSize: 32, fontWeight: 'bold' }}>
									{rate.toFixed(2)}%
								</div>
							</div>
							<ClockCircleOutlined style={{ fontSize: 40, color: 'rgba(201,0,0,0.2)' }} />
						</div>
					</Col>
				</Row>

				<Card
					title='Danh sách tài liệu trễ hạn trả'
					bordered={false}
					style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
				>
					<Form layout='inline' style={{ marginBottom: 24, gap: 16 }}>
						<Form.Item label='Tên tài liệu/sách'>
							<Input
								placeholder='Nhập tên tài liệu...'
								value={titleSearch}
								onChange={(e) => setTitleSearch(e.target.value)}
								style={{ width: 220 }}
								allowClear
							/>
						</Form.Item>
						<Form.Item label='Tài khoản người mượn'>
							<Input
								placeholder='Nhập tên độc giả...'
								value={readerSearch}
								onChange={(e) => setReaderSearch(e.target.value)}
								style={{ width: 200 }}
								allowClear
							/>
						</Form.Item>
						<Form.Item>
							<Button type='primary' onClick={refresh}>Làm mới</Button>
						</Form.Item>
					</Form>

					<Table
						dataSource={filteredItems}
						columns={columns}
						rowKey={(r: any) => r.borrow_id + '_' + r.document_title}
						loading={loading}
						pagination={{
							pageSize: 10,
							showTotal: (total) => `Tổng số ${total} tài liệu trễ hạn`,
						}}
						style={{ borderRadius: 8, overflow: 'hidden' }}
					/>
				</Card>
			</div>
		</PageSkeleton>
	);
};

export default OverdueDetail;
