import React, { useEffect, useState } from 'react';
import { Card, Input, Row, Col, message, Empty, Pagination, Space, Button, Tag, Select } from 'antd';
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
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const [actionType, setActionType] = useState<'wishlist' | 'cart' | null>(null);

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
		setActionLoadingId(doc.id);
		setActionType('wishlist');
		try {
			await MuonSach.addToWishlist(doc.id);
			message.success('Đã thêm vào danh sách yêu thích');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào danh sách yêu thích');
		} finally {
			setActionLoadingId(null);
			setActionType(null);
		}
	};

	const handleAddToCart = async (doc: any) => {
		setActionLoadingId(doc.id);
		setActionType('cart');
		try {
			await MuonSach.addToCart(doc.id);
			message.success('Đã thêm vào giỏ mượn');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào giỏ mượn');
		} finally {
			setActionLoadingId(null);
			setActionType(null);
		}
	};

	return (
		<PageSkeleton title='Danh sách tài liệu'>
			<Card style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
				<Row gutter={12} style={{ marginBottom: 12 }} align='middle'>
					<Col xs={24} sm={12} md={14} lg={16}>
						<Search placeholder='Tìm theo tiêu đề, tác giả, ISBN...' enterButton onSearch={onSearch} />
					</Col>
					<Col xs={24} sm={6} md={4} lg={4}>
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
					</Col>
					<Col xs={24} sm={6} md={6} lg={4} style={{ textAlign: 'right' }}>
						<Tag color='blue'>{total} tài liệu</Tag>
					</Col>
				</Row>

				{items.length === 0 ? (
					<Empty description={loading ? 'Đang tải tài liệu' : 'Không có tài liệu'} />
				) : (
					<>
						<Row gutter={[24, 24]}>
							{items.map((it: any) => (
								<Col xs={24} sm={12} md={6} lg={6} key={it.id || it.document_id}>
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
						<div style={{ textAlign: 'right', marginTop: 12 }}>
							<Pagination
								current={page}
								pageSize={pageSize}
								total={total}
								onChange={(p, ps) => {
									setPage(p);
									setPageSize(ps);
									load(p, ps, keyword);
								}}
							/>
						</div>
					</>
				)}
			</Card>
		</PageSkeleton>
	);
}
