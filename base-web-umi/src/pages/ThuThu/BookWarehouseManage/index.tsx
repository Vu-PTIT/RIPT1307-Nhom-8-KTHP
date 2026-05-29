import React, { useEffect, useState } from 'react';
import {
	Input, Select, Row, Col, Typography, message, Pagination, Empty, Spin,
	Button, Modal, Form,
} from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import BookCard, { BookData } from './components/BookCard';
import * as TaiLieuService from '@/services/TaiLieu';
import * as ThuThuService from '@/services/ThuThu';
import { history } from 'umi';
import { ipLibrary } from '@/utils/ip';
import getCoverForTitle from '@/utils/coverMap';

const { Title } = Typography;
const { Option } = Select;

const OBJ_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const buildImageUrl = (doc: any): string => {
	const mapped = getCoverForTitle(doc.title);
	let cover = doc.cover_image || mapped || '/default-cover.png';
	if (typeof cover === 'string' && OBJ_ID_REGEX.test(cover)) {
		return `${ipLibrary}/documents/covers/${cover}`;
	}
	return cover;
};

const BookWarehouseManage: React.FC = () => {
	const [books, setBooks] = useState<BookData[]>([]);
	const [categories, setCategories] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(12);
	const [total, setTotal] = useState(0);

	// Modal Thêm đầu sách mới
	const [addBookVisible, setAddBookVisible] = useState(false);
	const [addBookLoading, setAddBookLoading] = useState(false);
	const [addBookForm] = Form.useForm();

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
				category_id: doc.category_id,
				availableCount: doc.available_copies ?? 0,
				totalCount: doc.total_copies ?? 0,
				image: buildImageUrl(doc),
				isbn: doc.isbn,
				description: doc.description,
			}));

			setBooks(mapped);
			setTotal(data.total || items.length);
		} catch (e) {
			message.error('Không tải được danh sách tài liệu');
		} finally {
			setLoading(false);
		}
	};

	const loadCategories = async () => {
		try {
			const res = await TaiLieuService.getCategories();
			setCategories(res.data || []);
		} catch (e) {
			// ignore
		}
	};

	useEffect(() => {
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

	const handleRefresh = () => {
		load(page, searchText, selectedCategory);
	};

	const handleAddBook = async (values: any) => {
		setAddBookLoading(true);
		try {
			await ThuThuService.createDocument({
				title: values.title,
				author: values.author,
				isbn: values.isbn,
				category_id: values.category_id,
				description: values.description,
			});
			message.success(`Đã thêm đầu sách "${values.title}" thành công!`);
			setAddBookVisible(false);
			addBookForm.resetFields();
			load(1, '', undefined);
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Thêm đầu sách thất bại!');
		} finally {
			setAddBookLoading(false);
		}
	};

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Header trang */}
			<div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div>
					<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
						Quản lý kho sách
					</Title>
					<span style={{ color: '#8c8c8c' }}>
						{total} đầu sách · Thủ thư có thể thêm, sửa, xóa và quản lý bản sao
					</span>
				</div>
				<Button
					type='primary'
					icon={<PlusOutlined />}
					size='large'
					style={{ background: '#e3000f', borderColor: '#e3000f', borderRadius: 8, fontWeight: 600 }}
					onClick={() => setAddBookVisible(true)}
				>
					Thêm đầu sách
				</Button>
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
								<BookCard
									book={book}
									categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
									onDetail={handleViewDetail}
									onRefresh={handleRefresh}
								/>
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

			{/* Modal Thêm đầu sách mới */}
			<Modal
				title={<><PlusOutlined style={{ marginRight: 8 }} />Thêm đầu sách mới</>}
				open={addBookVisible}
				onCancel={() => { setAddBookVisible(false); addBookForm.resetFields(); }}
				onOk={() => addBookForm.submit()}
				okText='Thêm đầu sách'
				cancelText='Hủy'
				confirmLoading={addBookLoading}
				okButtonProps={{ style: { background: '#e3000f', borderColor: '#e3000f' } }}
				width={600}
			>
				<Form form={addBookForm} layout='vertical' onFinish={handleAddBook} style={{ marginTop: 16 }}>
					<Form.Item name='title' label='Tên sách' rules={[{ required: true, message: 'Vui lòng nhập tên sách!' }]}>
						<Input size='large' placeholder='Nhập tên đầu sách...' />
					</Form.Item>
					<Form.Item name='author' label='Tác giả' rules={[{ required: true, message: 'Vui lòng nhập tác giả!' }]}>
						<Input size='large' placeholder='Nhập tên tác giả...' />
					</Form.Item>
					<Form.Item name='isbn' label='ISBN'>
						<Input size='large' placeholder='Ví dụ: 978-0-13-468599-1' />
					</Form.Item>
					<Form.Item name='category_id' label='Danh mục' rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
						<Select size='large' placeholder='Chọn danh mục'>
							{categories.map((c: any) => (
								<Option key={c.id} value={c.id}>
									{c.name}
								</Option>
							))}
						</Select>
					</Form.Item>
					<Form.Item name='description' label='Mô tả'>
						<Input.TextArea rows={3} placeholder='Mô tả nội dung sách...' />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default BookWarehouseManage;
