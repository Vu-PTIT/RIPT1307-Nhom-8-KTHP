import React, { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, message, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as MuonSach from '@/services/MuonSach';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';
import DocumentDetailView from '@/components/DocumentDetailView';

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
			<DocumentDetailView
				document={document}
				loading={loading}
				actions={
					<>
						<Button
							type='primary'
							icon={<ShoppingCartOutlined />}
							loading={actionLoading === 'cart'}
							disabled={Number(document?.available_copies || 0) <= 0}
							onClick={handleAddToCart}
						>
							Đưa vào giỏ mượn
						</Button>
						<Button icon={<HeartOutlined />} loading={actionLoading === 'wishlist'} onClick={handleAddToWishlist}>
							Thêm vào yêu thích
						</Button>
						<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/ban-doc/tai-lieu')}>
							Quay lại danh sách
						</Button>
					</>
				}
			/>
		</PageSkeleton>
	);
}
