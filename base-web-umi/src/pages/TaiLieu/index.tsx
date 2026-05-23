import React, { useEffect, useState } from 'react';
import { Card, List, Input, Row, Col, message, Empty, Pagination, Space, Button, Tag } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as MuonSach from '@/services/MuonSach';

const { Search } = Input;

export default function DocumentsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [keyword, setKeyword] = useState<string>('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [total, setTotal] = useState(0);
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const [actionType, setActionType] = useState<'wishlist' | 'cart' | null>(null);

	const load = async (p = page, ps = pageSize, kw = keyword) => {
		setLoading(true);
		try {
			const res = await TaiLieuService.searchDocuments({ keyword: kw, page: p, page_size: ps });
			const data = res.data || {};
			setItems(data.items || data || []);
			setTotal(data.total || data.count || (data.items ? data.items.length : 0));
		} catch (e) {
			message.error('Không tải được danh sách tài liệu');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(1, pageSize, keyword); }, []);

	const onSearch = (val: string) => {
		setKeyword(val);
		setPage(1);
		load(1, pageSize, val);
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
		<PageSkeleton title="Danh sách tài liệu">
			<Card>
				<Row gutter={12} style={{ marginBottom: 12 }} align="middle">
					<Col xs={24} sm={16} md={18} lg={20}>
						<Search placeholder="Tìm theo tiêu đề, tác giả, ISBN..." enterButton onSearch={onSearch} />
					</Col>
					<Col xs={24} sm={8} md={6} lg={4} style={{ textAlign: 'right' }}>
						<Tag color="blue">{total} tài liệu</Tag>
					</Col>
				</Row>

				{items.length === 0 ? (
					<Empty description={loading ? 'Đang tải tài liệu' : 'Không có tài liệu'} />
				) : (
					<>
						<List
							loading={loading}
							dataSource={items}
							renderItem={(it: any) => {
								const isBusy = actionLoadingId === it.id;
								return (
									<List.Item
										actions={[
										<Button
											size="small"
											onClick={() => history.push(`/tai-lieu/${it.id}`)}
										>
											Chi tiết
										</Button>,
										<Button
											size="small"
											loading={isBusy && actionType === 'wishlist'}
											onClick={() => handleAddToWishlist(it)}
										>
											Yêu thích
										</Button>,
										<Button
											type="primary"
											size="small"
											loading={isBusy && actionType === 'cart'}
											onClick={() => handleAddToCart(it)}
										>
											Đưa vào giỏ
										</Button>,
									]}
								>
									<List.Item.Meta
										title={
											<a onClick={() => history.push(`/tai-lieu/${it.id}`)}>{it.title || it.document_title || 'Không có tiêu đề'}</a>
										}
										description={
											<Space direction="vertical" size={2}>
												<span>{it.author || it.authors || 'Không rõ tác giả'}</span>
												<Space wrap size={8}>
													{it.isbn ? <Tag>ISBN: {it.isbn}</Tag> : null}
													{it.category_name ? <Tag color="geekblue">{it.category_name}</Tag> : null}
													<Tag color={Number(it.available_copies || 0) > 0 ? 'green' : 'volcano'}>
														Còn {it.available_copies || 0} bản
													</Tag>
												</Space>
											</Space>
										}
									/>
								</List.Item>
								);
							}}
						/>
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
