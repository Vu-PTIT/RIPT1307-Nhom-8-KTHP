import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Empty, message, Space, Spin, Tag, Row, Col } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as MuonSach from '@/services/MuonSach';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';

export default function DocumentDetailPage(props: any) {
	const id = props?.match?.params?.id;
	const [document, setDocument] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState<'wishlist' | 'cart' | null>(null);

	const load = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await TaiLieuService.getDocumentDetail(id);
			setDocument(res.data?.data || res.data || null);
		} catch (e) {
			message.error('Không tải được chi tiết tài liệu');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id]);

	const handleAddToWishlist = async () => {
		if (!document?.id) return;
		setActionLoading('wishlist');
		try {
			await MuonSach.addToWishlist(document.id);
			message.success('Đã thêm vào danh sách yêu thích');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào danh sách yêu thích');
		} finally {
			setActionLoading(null);
		}
	};

	const handleAddToCart = async () => {
		if (!document?.id) return;
		setActionLoading('cart');
		try {
			await MuonSach.addToCart(document.id);
			message.success('Đã thêm vào giỏ mượn');
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không thêm được vào giỏ mượn');
		} finally {
			setActionLoading(null);
		}
	};

	return (
		<PageSkeleton title='Chi tiết tài liệu'>
			<Card>
				<Spin spinning={loading}>
					{!document ? (
						<Empty description='Không tìm thấy tài liệu' />
					) : (
						<Row gutter={24} align='top'>
							<Col xs={24} sm={8} md={6} lg={6}>
								{(() => {
									let cover =
										document.cover_image ||
										getCoverForTitle(document.title) ||
										document.thumbnail ||
										'/default-cover.png';

									const objIdRegex = /^[a-fA-F0-9]{24}$/;
									if (typeof cover === 'string' && objIdRegex.test(cover)) {
										cover = `${ipLibrary}/documents/covers/${cover}`;
									}
									return (
										<img
											alt={document.title}
											src={cover}
											style={{ maxWidth: 360, width: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
										/>
									);
								})()}
							</Col>
							<Col xs={24} sm={16} md={18} lg={18}>
								<Space direction='vertical' size={8} style={{ width: '100%' }}>
									<Space align='start' size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
										<Space direction='vertical' size={4}>
											<h2 style={{ marginBottom: 0 }}>{document.title}</h2>
											<div>{document.author}</div>
										</Space>
										<Space wrap>
											{document.category?.name ? <Tag color='geekblue'>{document.category.name}</Tag> : null}
											<Tag color={Number(document.available_copies || 0) > 0 ? 'green' : 'volcano'}>
												Còn {document.available_copies || 0} bản
											</Tag>
										</Space>
									</Space>

									<Descriptions bordered column={1} size='small'>
										<Descriptions.Item label='ISBN'>{document.isbn || 'Chưa có'}</Descriptions.Item>
										<Descriptions.Item label='Danh mục'>{document.category?.name || 'Chưa có'}</Descriptions.Item>
										<Descriptions.Item label='Mô tả'>{document.description || 'Chưa có mô tả'}</Descriptions.Item>
										<Descriptions.Item label='Tổng bản'>{document.total_copies ?? 0}</Descriptions.Item>
										<Descriptions.Item label='Bản còn lại'>{document.available_copies ?? 0}</Descriptions.Item>
										<Descriptions.Item label='Người tạo'>
											{document.created_by?.full_name || document.created_by?.username || 'Không rõ'}
										</Descriptions.Item>
										<Descriptions.Item label='Ngày tạo'>{document.created_at || 'Không rõ'}</Descriptions.Item>
									</Descriptions>

									<div style={{ marginTop: 12 }}>
										<Space>
											<Button type='primary' loading={actionLoading === 'cart'} onClick={handleAddToCart}>
												Đưa vào giỏ mượn
											</Button>
											<Button loading={actionLoading === 'wishlist'} onClick={handleAddToWishlist}>
												Thêm vào yêu thích
											</Button>
											<Button onClick={() => history.push('/tai-lieu')}>Quay lại danh sách</Button>
										</Space>
									</div>
								</Space>
							</Col>
						</Row>
					)}
				</Spin>
			</Card>
		</PageSkeleton>
	);
}
