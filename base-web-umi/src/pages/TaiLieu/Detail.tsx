import React, { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, message, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
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
			<div className='library-panel'>
				<Spin spinning={loading}>
					{!document ? (
						<div className='library-empty-state'>
							<Empty description='Không tìm thấy tài liệu' />
						</div>
					) : (
						<div className='library-detail'>
							<div className='library-detail-cover'>
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
									return <img alt={document.title} src={cover} />;
								})()}
							</div>
							<div className='library-detail-main'>
								<div className='library-detail-header'>
									<div>
										<h2>{document.title}</h2>
										<div className='library-detail-author'>{document.author || 'Chưa rõ tác giả'}</div>
									</div>
									<div>
										{document.category?.name ? (
											<Tag className='library-status-tag neutral'>{document.category.name}</Tag>
										) : null}
										<Tag
											className={`library-status-tag ${
												Number(document.available_copies || 0) > 0 ? 'success' : 'danger'
											}`}
										>
											{Number(document.available_copies || 0) > 0
												? `Còn ${document.available_copies || 0} bản`
												: 'Hết bản'}
										</Tag>
									</div>
								</div>

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

								<div className='library-detail-actions'>
									<Button
										type='primary'
										icon={<ShoppingCartOutlined />}
										loading={actionLoading === 'cart'}
										disabled={Number(document.available_copies || 0) <= 0}
										onClick={handleAddToCart}
									>
										Đưa vào giỏ mượn
									</Button>
									<Button icon={<HeartOutlined />} loading={actionLoading === 'wishlist'} onClick={handleAddToWishlist}>
										Thêm vào yêu thích
									</Button>
									<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/tai-lieu')}>
										Quay lại danh sách
									</Button>
								</div>
							</div>
						</div>
					)}
				</Spin>
			</div>
		</PageSkeleton>
	);
}
