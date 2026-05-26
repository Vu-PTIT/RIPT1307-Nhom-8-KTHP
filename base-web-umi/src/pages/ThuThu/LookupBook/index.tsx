import React, { useState } from 'react';
import { Input, Select, Row, Col, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import BookCard, { BookItemData } from './components/BookCard';

const { Title } = Typography;
const { Option } = Select;

const LookupBook: React.FC = () => {
	// Đổ toàn bộ data mẫu hiển thị trực quan lên màn hình
	const mockBooks: BookItemData[] = [
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

	const handleViewDetail = (id: string) => {
		const book = mockBooks.find((b) => b.id === id);
		if (book) message.success(`Đang mở chi tiết sách: ${book.title}`);
	};

	// Logic bộ lọc kết hợp Tìm kiếm chữ và Chọn danh mục xổ xuống
	const filteredBooks = mockBooks.filter((book) => {
		const matchSearch =
			book.title.toLowerCase().includes(searchText.toLowerCase()) ||
			book.author.toLowerCase().includes(searchText.toLowerCase());
		const matchCategory = selectedCategory === 'all' || book.category === selectedCategory;
		return matchSearch && matchCategory;
	});

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Tiêu đề trang */}
			<div style={{ marginBottom: 24 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Tra cứu tài liệu
				</Title>
			</div>

			{/* Bộ lọc Tìm kiếm + Ô chọn danh mục (Xổ danh sách y như ảnh bạn chụp) */}
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
						<Option value='Web Development'>Web Development</Option>
						<Option value='Data Science'>Data Science</Option>
						<Option value='Machine Learning'>Machine Learning</Option>
						<Option value='Database'>Database</Option>
						<Option value='Network'>Network</Option>
						<Option value='Security'>Security</Option>
						<Option value='Mobile Development'>Mobile Development</Option>
					</Select>
				</Col>
			</Row>

			{/* Lưới danh sách Card sách */}
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

export default LookupBook;
