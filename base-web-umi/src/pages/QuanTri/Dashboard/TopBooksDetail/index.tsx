import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Table, Tag } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import ColumnChart from '@/components/Chart/ColumnChart';
import { getTopBooks } from '@/services/QuanTri';

const { Option } = Select;

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

const TopBooksDetail: React.FC = () => {
	const [limit, setLimit] = useState<number>(20);
	const [searchKeyword, setSearchKeyword] = useState<string>('');

	// Get top books data
	const { data: topBooks = [], loading, refresh } = useRequest(
		() => getTopBooks(limit),
		{
			refreshDeps: [limit],
			formatResult: (res) => res.data || [],
		},
	);

	// Client-side filtering by title or author
	const filteredBooks = topBooks.filter((book: any) => {
		if (!searchKeyword) return true;
		const keyword = searchKeyword.toLowerCase();
		return (
			book.title?.toLowerCase().includes(keyword) ||
			book.author?.toLowerCase().includes(keyword)
		);
	});

	// For chart, show top 10 from the filtered list (so it doesn't get overcrowded)
	const chartBooks = filteredBooks.slice(0, 10);
	const xAxis = chartBooks.map((b: any) => {
		const title = b.title || '';
		return title.length > 20 ? title.substring(0, 17) + '...' : title;
	});
	const yAxis = [chartBooks.map((b: any) => b.borrow_count ?? 0)];

	const columns = [
		{
			title: 'Thứ hạng',
			key: 'rank',
			width: 100,
			align: 'center' as const,
			render: (_: any, __: any, index: number) => {
				const medalSymbol = MEDAL[index];
				return medalSymbol ? (
					<span style={{ fontSize: 20 }}>{medalSymbol}</span>
				) : (
					<strong style={{ color: '#595959' }}>{index + 1}</strong>
				);
			},
		},
		{
			title: 'Tên tài liệu',
			dataIndex: 'title',
			key: 'title',
			render: (v: string) => <strong style={{ color: '#262626' }}>{v}</strong>,
		},
		{
			title: 'Tác giả',
			dataIndex: 'author',
			key: 'author',
			render: (v: string) => v || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Không rõ</span>,
		},
		{
			title: 'Lượt mượn',
			dataIndex: 'borrow_count',
			key: 'borrow_count',
			width: 150,
			align: 'center' as const,
			render: (v: number) => (
				<Tag color='red' style={{ fontWeight: 700, fontSize: 13, padding: '2px 8px' }}>
					{v} lượt mượn
				</Tag>
			),
		},
	];

	return (
		<PageSkeleton
			title='Chi tiết top tài liệu mượn nhiều nhất'
			subtitle='Báo cáo phân tích và thống kê các tài liệu có tần suất mượn cao nhất trong hệ thống.'
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
										<TrophyOutlined style={{ marginRight: 8, color: '#c90000' }} />
										Biểu đồ Top 10 tài liệu được mượn nhiều nhất
									</span>
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
										yLabel={['Lượt mượn']}
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
					title='Danh sách chi tiết xếp hạng tài liệu'
					bordered={false}
					style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
				>
					<Form layout='inline' style={{ marginBottom: 24, gap: 16 }}>
						<Form.Item label='Tìm kiếm sách'>
							<Input
								placeholder='Nhập tên sách, tác giả...'
								value={searchKeyword}
								onChange={(e) => setSearchKeyword(e.target.value)}
								style={{ width: 250 }}
								allowClear
							/>
						</Form.Item>
						<Form.Item label='Giới hạn số lượng'>
							<Select value={limit} onChange={setLimit} style={{ width: 120 }}>
								<Option value={10}>Top 10</Option>
								<Option value={20}>Top 20</Option>
								<Option value={55}>Top 50</Option>
								<Option value={100}>Top 100</Option>
							</Select>
						</Form.Item>
						<Form.Item>
							<Button type='primary' onClick={refresh}>Làm mới</Button>
						</Form.Item>
					</Form>

					<Table
						dataSource={filteredBooks}
						columns={columns}
						rowKey='id'
						loading={loading}
						pagination={{
							pageSize: 10,
						}}
						style={{ borderRadius: 8, overflow: 'hidden' }}
					/>
				</Card>
			</div>
		</PageSkeleton>
	);
};

export default TopBooksDetail;
