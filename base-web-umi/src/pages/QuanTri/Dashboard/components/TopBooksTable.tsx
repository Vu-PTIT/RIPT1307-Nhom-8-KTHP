import React from 'react';
import { Card, Empty, Table, Tag, Typography, Button } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Text } = Typography;

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

const columns = [
	{
		title: '#',
		key: 'rank',
		width: 50,
		render: (_: any, __: any, index: number) => (
			<Text strong style={{ color: index < 3 ? '#c90000' : '#606060' }}>
				{MEDAL[index] ?? `${index + 1}`}
			</Text>
		),
	},
	{
		title: 'Tên tài liệu',
		dataIndex: 'title',
		key: 'title',
		render: (v: string) => <Text strong>{v}</Text>,
	},
	{
		title: 'Lượt mượn',
		dataIndex: 'borrow_count',
		key: 'borrow_count',
		width: 110,
		render: (v: number) => (
			<Tag color='red' style={{ fontWeight: 700, fontSize: 13 }}>
				{v} lượt
			</Tag>
		),
	},
];

interface TopBooksTableProps {
	topBooks: any[];
	loading: boolean;
}

const TopBooksTable: React.FC<TopBooksTableProps> = ({ topBooks, loading }) => (
	<Card
		title={
			<span>
				<TrophyOutlined style={{ marginRight: 8, color: '#c90000' }} />
				Top tài liệu được mượn nhiều nhất
			</span>
		}
		extra={
			<Button type='link' size='small' onClick={() => history.push('/quan-tri/thong-ke/top-sach')} style={{ color: '#c90000', padding: 0, fontWeight: 500 }}>
				Xem chi tiết
			</Button>
		}
		bordered={false}
		style={{ borderRadius: 10, border: '1px solid var(--library-line)' }}
	>
		<Table
			dataSource={topBooks}
			columns={columns}
			rowKey={(r: any) => String(r.document_id || r.id || Math.random())}
			loading={loading}
			pagination={false}
			size='small'
			locale={{ emptyText: <Empty description='Chưa có dữ liệu' /> }}
		/>
	</Card>
);

export default TopBooksTable;
