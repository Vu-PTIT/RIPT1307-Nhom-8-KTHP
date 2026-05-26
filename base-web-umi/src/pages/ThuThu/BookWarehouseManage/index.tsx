import React, { useState } from 'react';
import { Input, Select, Row, Col, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import BookCard, { BookData } from './components/BookCard';

const { Title } = Typography;
const { Option } = Select;

const BookWarehouseManage: React.FC = () => {
	// Mock trọn vẹn 6 cuốn sách đúng như ảnh mẫu thiết kế Figma của bạn
	const mockBooks: BookData[] = [
		{
			id: '1',
			title: 'Clean Code',
			author: 'Robert C. Martin',
			category: 'Programming',
			availableCount: 2,
			image: 'https://images-na.ssl-images-amazon.com/images/I/41xShOLdg3L._SX379_BO1,204,203,200_.jpg',
		},
		{
			id: '2',
			title: 'The Pragmatic Programmer',
			author: 'Andrew Hunt & David Thomas',
			category: 'Programming',
			availableCount: 1,
			image: 'https://images-na.ssl-images-amazon.com/images/I/41as+w6Z7gL._SX396_BO1,204,203,200_.jpg',
		},
		{
			id: '3',
			title: 'Design Patterns',
			author: 'Erich Gamma et al.',
			category: 'Software Engineering',
			availableCount: 3,
			image: 'https://images-na.ssl-images-amazon.com/images/I/51szD9HC9pL._SX395_BO1,204,203,200_.jpg',
		},
		{
			id: '4',
			title: 'Introduction to Algorithms',
			author: 'Thomas H. Cormen',
			category: 'Computer Science',
			availableCount: 4,
			image: 'https://images-na.ssl-images-amazon.com/images/I/41vOepgS7DL._SX376_BO1,204,203,200_.jpg',
		},
		{
			id: '5',
			title: "You Don't Know JS",
			author: 'Kyle Simpson',
			category: 'Programming',
			availableCount: 0,
			image: 'https://images-na.ssl-images-amazon.com/images/I/51F6vS8S4wL._SX329_BO1,204,203,200_.jpg',
		},
		{
			id: '6',
			title: 'Refactoring',
			author: 'Martin Fowler',
			category: 'Software Engineering',
			availableCount: 2,
			image: 'https://images-na.ssl-images-amazon.com/images/I/41odx7mY7FL._SX401_BO1,204,203,200_.jpg',
		},
	];

	const [searchText, setSearchText] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');

	// Xử lý khi nhấn nút xem chi tiết cuốn sách
	const handleViewDetail = (id: string) => {
		const book = mockBooks.find((b) => b.id === id);
		if (book) {
			message.info(`Xem chi tiết tài liệu: ${book.title}`);
		}
	};

	// Logic lọc dữ liệu kết hợp cả ô tìm kiếm và ô danh mục
	const filteredBooks = mockBooks.filter((book) => {
		const matchSearch =
			book.title.toLowerCase().includes(searchText.toLowerCase()) ||
			book.author.toLowerCase().includes(searchText.toLowerCase());
		const matchCategory = selectedCategory === 'all' || book.category === selectedCategory;
		return matchSearch && matchCategory;
	});

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Header trang */}
			<div style={{ marginBottom: 24 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Tra cứu tài liệu
				</Title>
			</div>

			{/* Thanh bộ lọc phía trên (Tìm kiếm + Thể loại) */}
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }} align='middle'>
				<Col xs={24} sm={16} md={18}>
					<Input
						size='large'
						placeholder='Tìm kiếm theo tên sách, tác giả, ISBN...'
						prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						style={{ borderRadius: 8, height: 42 }}
					/>
				</Col>
				<Col xs={24} sm={8} md={6}>
					<Select
						size='large'
						defaultValue='all'
						style={{ width: '100%' }}
						onChange={(value) => setSelectedCategory(value)}
						dropdownStyle={{ borderRadius: 8 }}
					>
						<Option value='all'>Tất cả danh mục</Option>
						<Option value='Programming'>Programming</Option>
						<Option value='Software Engineering'>Software Engineering</Option>
						<Option value='Computer Science'>Computer Science</Option>
					</Select>
				</Col>
			</Row>

			{/* Lưới danh sách các Card Sách */}
			<Row gutter={[20, 20]}>
				{filteredBooks.map((book) => (
					<Col xs={24} sm={12} md={8} lg={8} xl={8} key={book.id}>
						<BookCard book={book} onDetail={handleViewDetail} />
					</Col>
				))}
			</Row>
		</div>
	);
};

export default BookWarehouseManage;
