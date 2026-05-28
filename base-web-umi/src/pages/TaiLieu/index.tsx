import React, { useEffect, useState } from 'react';
import { Input, Row, Col, message, Empty, Pagination, Select } from 'antd';
import { BookOutlined, CheckCircleOutlined, TagsOutlined } from '@ant-design/icons';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as MuonSach from '@/services/MuonSach';
import DocumentCard from '@/components/DocumentCard';

const { Search } = Input;

export default function DocumentsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [keyword, setKeyword] = useState<string>('');
	const [categories, setCategories] = useState<any[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [total, setTotal] = useState(0);

	const load = async (p = page, ps = pageSize, kw = keyword, category_id?: string) => {
		setLoading(true);
		try {
			const res = await TaiLieuService.searchDocuments({ keyword: kw, page: p, page_size: ps, category_id });
			const data = res.data || {};
			setItems(data.items || data || []);
			setTotal(data.total || data.count || (data.items ? data.items.length : 0));
		} catch (e) {
			message.error('Không tải được danh sách tài liệu');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load(1, pageSize, keyword, selectedCategory);

		const loadCategories = async () => {
			try {
				const res = await TaiLieuService.getCategories();
				setCategories(res.data || []);
			} catch (e) {
				// ignore
			}
		};
		loadCategories();
	}, []);

	const onSearch = (val: string) => {
		setKeyword(val);
		setPage(1);
		load(1, pageSize, val, selectedCategory);
	};

	const onCategoryChange = (val: string | undefined) => {
		setSelectedCategory(val);
		setPage(1);
		load(1, pageSize, keyword, val);
	};

	const handleAddToWishlist = async (doc: any) => {
		try {
			await MuonSach.addToWishlist(doc.id);
			message.success('Đã thêm vào danh sách yêu thích');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào danh sách yêu thích');
		}
	};

	const handleAddToCart = async (doc: any) => {
		try {
			await MuonSach.addToCart(doc.id);
			message.success('Đã thêm vào giỏ mượn');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào giỏ mượn');
		}
	};

	const availableOnPage = items.reduce((sum, it) => sum + Number(it.available_copies || 0), 0);

	return (
		<PageSkeleton title='Danh sách tài liệu'>
			<div className='library-panel'>
				<div className='library-summary-strip'>
					<div className='library-stat'>
						<BookOutlined />
						<div>
							<span>Tổng đầu sách</span>
							<strong>{total}</strong>
						</div>
					</div>
					<div className='library-stat'>
						<CheckCircleOutlined />
						<div>
							<span>Bản sẵn sàng trên trang</span>
							<strong>{availableOnPage}</strong>
						</div>
					</div>
					<div className='library-stat'>
						<TagsOutlined />
						<div>
							<span>Danh mục</span>
							<strong>{categories.length}</strong>
						</div>
					</div>
				</div>

				<div className='library-toolbar'>
					<div>
						<Search placeholder='Tìm theo tiêu đề, tác giả, ISBN...' enterButton onSearch={onSearch} />
					</div>
					<div>
						<Select
							allowClear
							placeholder='Tất cả danh mục'
							style={{ width: '100%' }}
							onChange={onCategoryChange}
							value={selectedCategory}
						>
							{categories.map((c: any) => (
								<Select.Option key={c.id || c.category_id} value={c.id || c.category_id}>
									{c.name || c.category_name}
								</Select.Option>
							))}
						</Select>
					</div>
					<div className='library-count-badge'>{total} tài liệu</div>
				</div>

				{items.length === 0 ? (
					<div className='library-empty-state'>
						<Empty description={loading ? 'Đang tải tài liệu' : 'Không có tài liệu phù hợp'} />
					</div>
				) : (
					<>
						<Row gutter={[24, 24]}>
							{items.map((it: any) => (
								<Col xs={24} sm={12} md={12} lg={8} xl={6} key={it.id || it.document_id}>
									<DocumentCard
										item={it}
										onDetail={(id) => history.push(`/tai-lieu/${id}`)}
										onWishlist={(i) => handleAddToWishlist(i)}
										onCart={(i) => handleAddToCart(i)}
										accent={true}
									/>
								</Col>
							))}
						</Row>
						<div className='library-pagination'>
							<Pagination
								current={page}
								pageSize={pageSize}
								total={total}
								onChange={(p, ps) => {
									setPage(p);
									setPageSize(ps);
									load(p, ps, keyword, selectedCategory);
								}}
							/>
						</div>
					</>
				)}
			</div>
		</PageSkeleton>
	);
}
