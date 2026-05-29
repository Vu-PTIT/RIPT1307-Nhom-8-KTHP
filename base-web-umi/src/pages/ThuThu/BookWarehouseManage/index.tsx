import React, { useEffect, useState } from 'react';
import { Input, Select, Row, Col, Typography, message, Pagination, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import BookCard, { BookData } from './components/BookCard';
import * as TaiLieuService from '@/services/TaiLieu';
import * as ThuThuService from '@/services/ThuThu';
import { history } from 'umi';

const { Title } = Typography;
const { Option } = Select;

const BookWarehouseManage: React.FC = () => {
	const [books, setBooks] = useState<BookData[]>([]);
	const [categories, setCategories] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(12);
	const [total, setTotal] = useState(0);

	const buildImageUrl = (cover_image?: string) => {
		if (!cover_image) return undefined;
		// Nếu là GridFS file_id thì dùng API serve, ngược lại dùng trực tiếp
		if (cover_image.startsWith('http')) return cover_image;
		return `http://localhost:8000/api/v1/documents/covers/${cover_image}`;
	};

	const load = async (p = page, kw = searchText, cat_id?: string) => {
		setLoading(true);
		try {
			const res = await TaiLieuService.searchDocuments({
				keyword: kw || undefined,
				category_id: cat_id,
				page: p,
				page_size: pageSize,
			});
			const data = res.data || {};
			const items: any[] = data.items || data || [];

			const mapped: BookData[] = items.map((doc: any) => ({
				id: doc.id || doc._id,
				title: doc.title,
				author: doc.author,
				category: doc.category_name || 'Không có danh mục',
				availableCount: doc.available_copies ?? 0,
				totalCount: doc.total_copies ?? 0,
				image: buildImageUrl(doc.cover_image) || 'https://via.placeholder.com/300x180?text=No+Cover',
			}));

			setBooks(mapped);
			setTotal(data.total || items.length);
		} catch (e) {
			message.error('Không tải được danh sách tài liệu');
		} finally {
			setLoading(false);
		}
	};

	// Load categories từ API
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const res = await TaiLieuService.getCategories();
				setCategories(res.data || []);
			} catch (e) {
				// ignore
			}
		};
		loadCategories();
		load(1, '', undefined);
	}, []);

	const handleSearch = (value: string) => {
		setSearchText(value);
		setPage(1);
		load(1, value, selectedCategory);
	};

	const handleCategoryChange = (value: string | undefined) => {
		setSelectedCategory(value);
		setPage(1);
		load(1, searchText, value);
	};

	const handleViewDetail = (id: string) => {
		history.push(`/thu-thu/tai-lieu/${id}`);
	};

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Header trang */}
			<div style={{ marginBottom: 24 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Tra cứu tài liệu
				</Title>
			</div>

			{/* Thanh bộ lọc */}
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }} align='middle'>
				<Col xs={24} sm={16} md={18}>
					<Input.Search
						size='large'
						placeholder='Tìm kiếm theo tên sách, tác giả, ISBN...'
						prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						onSearch={handleSearch}
						enterButton
						style={{ borderRadius: 8 }}
					/>
				</Col>
				<Col xs={24} sm={8} md={6}>
					<Select
						size='large'
						allowClear
						placeholder='Tất cả danh mục'
						style={{ width: '100%' }}
						onChange={handleCategoryChange}
						value={selectedCategory}
						dropdownStyle={{ borderRadius: 8 }}
					>
						{categories.map((c: any) => (
							<Option key={c.id} value={c.id}>
								{c.name}
							</Option>
						))}
					</Select>
				</Col>
			</Row>

			{/* Lưới danh sách */}
			<Spin spinning={loading}>
				{books.length === 0 && !loading ? (
					<Empty description='Không có tài liệu phù hợp' style={{ marginTop: 60 }} />
				) : (
					<Row gutter={[20, 20]}>
						{books.map((book) => (
							<Col xs={24} sm={12} md={8} lg={8} xl={6} key={book.id}>
								<BookCard book={book} onDetail={handleViewDetail} />
							</Col>
						))}
					</Row>
				)}
			</Spin>

			{/* Pagination */}
			{total > pageSize && (
				<div style={{ textAlign: 'center', marginTop: 32 }}>
					<Pagination
						current={page}
						pageSize={pageSize}
						total={total}
						onChange={(p) => {
							setPage(p);
							load(p, searchText, selectedCategory);
						}}
					/>
				</div>
			)}
		</div>
	);
};

export default BookWarehouseManage;

