import { useEffect, useState, useRef } from 'react';
import { Button, Card, message, Empty, Alert, Space, Tag, Row, Col } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';
import DocumentCard from '@/components/DocumentCard';

const getErrorMessage = (error: any, fallback: string) => {
	const detail = error?.response?.data?.detail;
	if (typeof detail === 'string') return detail;
	if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message;
	if (error?.message) return error.message;
	return fallback;
};

export default function BorrowCartPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		if (mountedRef.current) setLoading(true);
		if (mountedRef.current) setError(null);
		try {
			const res = await MuonSach.getMyCart();
			if (mountedRef.current) setItems(res.data?.items || res.data || []);
		} catch (e) {
			if (mountedRef.current) setError('Không tải được giỏ mượn');
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	const mountedRef = useRef(true);

	useEffect(() => {
		load();
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const handleRemove = async (id: string) => {
		if (mountedRef.current) setLoading(true);
		try {
			await MuonSach.removeFromCart(id);
			message.success('Đã xoá khỏi giỏ');
			if (mountedRef.current) load();
		} catch (e) {
			if (mountedRef.current) setError('Xoá thất bại');
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	const handleCheckout = async () => {
		if (mountedRef.current) setLoading(true);
		if (mountedRef.current) setError(null);
		try {
			// Use backend count endpoint to get accurate current borrowed count
			const countRes = await MuonSach.getCurrentBorrowCount();
			const currentBorrowed =
				countRes.data && typeof countRes.data.current_borrowed === 'number' ? countRes.data.current_borrowed : 0;

			// Get max_books setting from backend
			let maxBooks = 5; // fallback
			try {
				const s = await axios.get(`${ipLibrary}/settings`, { silent: true } as any);
				const settings = s.data || [];
				const maxSetting = (settings || []).find((x: any) => x.setting_key === 'default_max_books');
				if (maxSetting) maxBooks = parseInt(maxSetting.setting_value, 10) || maxBooks;
			} catch (err: any) {
				if (mountedRef.current) {
					setError(getErrorMessage(err, 'Không lấy được cấu hình giới hạn mượn'));
					setLoading(false);
				}
				return;
			}

			if (currentBorrowed + items.length > maxBooks) {
				if (mountedRef.current)
					setError(
						`Bạn đang mượn ${currentBorrowed} cuốn, giới hạn ${maxBooks}. Vui lòng trả bớt hoặc giảm số sách trong giỏ.`,
					);
				if (mountedRef.current) setLoading(false);
				return;
			}

			// Proceed to checkout
			await MuonSach.checkoutCart();
			if (mountedRef.current) message.success('Tạo phiếu mượn thành công');
			if (mountedRef.current) setItems([]);
			if (mountedRef.current) history.push('/lich-su-muon');
		} catch (e: any) {
			if (mountedRef.current) setError(getErrorMessage(e, 'Checkout thất bại'));
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	const handleClearCart = async () => {
		if (mountedRef.current) setLoading(true);
		try {
			await MuonSach.clearCart();
			if (mountedRef.current) setItems([]);
			if (mountedRef.current) message.success('Đã xoá toàn bộ giỏ mượn');
		} catch (e: any) {
			if (mountedRef.current) setError(getErrorMessage(e, 'Không xoá được giỏ mượn'));
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	};

	return (
		<PageSkeleton title='Giỏ mượn sách'>
			<Card style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
				{error ? <Alert type='error' message={error} style={{ marginBottom: 12 }} /> : null}
				{items.length === 0 ? (
					<Empty description='Giỏ mượn trống' />
				) : (
					<>
						<Space style={{ marginBottom: 12 }} wrap>
							<Tag color='blue'>{items.length} tài liệu</Tag>
							<Button onClick={() => history.push('/tai-lieu')}>Tiếp tục chọn tài liệu</Button>
							<Button onClick={handleClearCart} danger loading={loading}>
								Xoá toàn bộ giỏ
							</Button>
						</Space>

						<Row gutter={[24, 24]}>
							{items.map((it: any) => (
								<Col xs={24} sm={12} md={6} lg={6} key={it.id}>
									<DocumentCard
										item={it}
										onDetail={(id) => history.push(`/tai-lieu/${id}`)}
										onWishlist={() => {}}
										onCart={() => {}}
										accent={true}
										actions={[
											<Button
												key='detail'
												className='detail-btn small'
												onClick={() => history.push(`/tai-lieu/${it.document_id}`)}
											>
												Chi tiết
											</Button>,
											<Button key='remove' className='remove-btn' onClick={() => handleRemove(it.id)}>
												Xóa
											</Button>,
										]}
									/>
								</Col>
							))}
						</Row>

						<div style={{ textAlign: 'right', marginTop: 12 }}>
							<Button type='primary' onClick={handleCheckout} loading={loading} disabled={items.length === 0}>
								Tạo phiếu mượn
							</Button>
						</div>
					</>
				)}
			</Card>
		</PageSkeleton>
	);
}
