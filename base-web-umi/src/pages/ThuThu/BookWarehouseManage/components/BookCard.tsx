import React from 'react';
import { Card, Tag, Button, Space, Typography } from 'antd';
import { HeartOutlined, ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface BookData {
	id: string;
	title: string;
	author: string;
	category: string;
	availableCount: number;
	totalCount?: number;
	image: string;
}

interface BookCardProps {
	book: BookData;
	onDetail: (id: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDetail }) => {
	const isOutOfStock = book.availableCount === 0;

	return (
		<Card
			hoverable
			style={{ borderRadius: 12, overflow: 'hidden', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
			bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: 'calc(100% - 180px)' }}
			cover={<img alt={book.title} src={book.image} style={{ height: 180, objectFit: 'cover' }} />}
		>
			{/* Tên sách và Tác giả */}
			<div style={{ flexGrow: 1, marginBottom: 12 }}>
				<Title level={5} ellipsis={{ rows: 1 }} style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>
					{book.title}
				</Title>
				<Text type='secondary' ellipsis style={{ display: 'block', fontSize: 13 }}>
					{book.author}
				</Text>
			</div>

			{/* Khu vực hiển thị Tags trạng thái */}
			<div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
				{/* Tag Thể loại (Màu đỏ nhẹ giống Figma) */}
				<Tag color='#fff1f0' style={{ color: '#ff4d4f', borderColor: '#ffccc7', borderRadius: 4 }}>
					{book.category}
				</Tag>

				{/* Tag Số lượng khả dụng */}
				{isOutOfStock ? (
					<Tag color='#fff1f0' style={{ color: '#ff4d4f', borderColor: '#ffccc7', borderRadius: 4 }}>
						Hết sách
					</Tag>
				) : (
					<Tag color='#f6ffed' style={{ color: '#52c41a', borderColor: '#b7eb8f', borderRadius: 4 }}>
						{book.availableCount} bản khả dụng
					</Tag>
				)}
			</div>

			{/* Thanh hành động phía dưới cùng */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
				<Button
					type='text'
					icon={<InfoCircleOutlined />}
					style={{
						flexGrow: 1,
						background: '#f5f5f5',
						borderRadius: 6,
						fontWeight: 500,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={() => onDetail(book.id)}
				>
					Chi tiết
				</Button>
				<Button
					icon={<HeartOutlined />}
					style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
				/>
				<Button
					type='primary'
					ghost
					icon={<ShoppingCartOutlined />}
					style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					disabled={isOutOfStock}
				/>
			</div>
		</Card>
	);
};

export default BookCard;
