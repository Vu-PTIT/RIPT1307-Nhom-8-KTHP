import { useEffect, useState, useRef } from 'react';
import { Button, message, Empty, Alert, Row, Col } from 'antd';
import {
	BookOutlined,
	CheckCircleOutlined,
	DeleteOutlined,
	FieldTimeOutlined,
	SearchOutlined,
	ShoppingCartOutlined,
} from '@ant-design/icons';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';
import DocumentCard from '@/components/DocumentCard';
import BorrowedBookList from '@/components/BorrowedBookList';

const getErrorMessage = (error: any, fallback: string) => {
	const detail = error?.response?.data?.detail;
	if (typeof detail === 'string') return detail;
	if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message;
	if (error?.message) return error.message;
	return fallback;
};

export default function BorrowCartPage() {
	const [items, setItems] = useState<any[]>([]);
	const [borrowedItems, setBorrowedItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [borrowedLoading, setBorrowedLoading] = useState(false);
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

	const loadBorrowedItems = async () => {
		if (mountedRef.current) setBorrowedLoading(true);
		try {
			const res = await MuonSach.getMyBorrows('borrowed');
			const records = Array.isArray(res.data) ? res.data : [];
			const detailResults = await Promise.allSettled(records.map((record: any) => MuonSach.getBorrowDetail(record.id)));
			const activeItems = detailResults.flatMap((result: any) => {
				if (result.status !== 'fulfilled') return [];
				const record = result.value?.data || {};
				const recordItems = Array.isArray(record.items) ? record.items : [];
				return recordItems
					.filter((item: any) => item.status !== 'returned' && !item.return_date)
					.map((item: any) => ({
						...item,
						record_id: record.id,
						record_due_date: record.due_date,
					}));
			});
			if (mountedRef.current) setBorrowedItems(activeItems);
		} catch (e) {
			if (mountedRef.current) setBorrowedItems([]);
		} finally {
			if (mountedRef.current) setBorrowedLoading(false);
		}
	};

	useEffect(() => {
		load();
		loadBorrowedItems();
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
				loadBorrowedItems();
				if (mountedRef.current) setLoading(false);
				return;
			}

			// Proceed to checkout
			await MuonSach.checkoutCart();
			if (mountedRef.current) message.success('Tạo phiếu mượn thành công');
			if (mountedRef.current) setItems([]);
			if (mountedRef.current) history.push('/ban-doc/lich-su-muon');
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
			<div className='library-panel'>
				{error ? <Alert type='error' message={error} style={{ marginBottom: 12 }} /> : null}
				<div className='borrowed-now-panel'>
					<div className='borrowed-now-header'>
						<div className='library-stat'>
							<BookOutlined />
							<div>
								<span>Đang mượn</span>
								<strong>{borrowedItems.length}</strong>
							</div>
						</div>
						<Button icon={<FieldTimeOutlined />} onClick={() => history.push('/ban-doc/lich-su-muon')}>
							Xem lịch sử mượn
						</Button>
					</div>
					{borrowedItems.length === 0 ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={borrowedLoading ? 'Đang tải sách đang mượn' : 'Bạn chưa có sách đang mượn'}
						/>
					) : (
						<BorrowedBookList
							loading={borrowedLoading}
							items={borrowedItems}
							emptyDescription='Bạn chưa có sách đang mượn'
						/>
					)}
				</div>
				{items.length === 0 ? (
					<div className='library-empty-state'>
						<Empty description='Giỏ mượn trống'>
							<Button type='primary' icon={<SearchOutlined />} onClick={() => history.push('/ban-doc/tai-lieu')}>
								Tra cứu sách
							</Button>
						</Empty>
					</div>
				) : (
					<>
						<div className='library-action-bar'>
							<div className='library-action-left'>
								<div className='library-stat'>
									<ShoppingCartOutlined />
									<div>
										<span>Trong giỏ checkout</span>
										<strong>{items.length}</strong>
									</div>
								</div>
							</div>
							<div className='library-action-right'>
								<Button icon={<SearchOutlined />} onClick={() => history.push('/ban-doc/tai-lieu')}>
									Chọn thêm sách
								</Button>
								<Button icon={<DeleteOutlined />} onClick={handleClearCart} danger loading={loading}>
									Xoá toàn bộ giỏ
								</Button>
							</div>
						</div>

						<Row gutter={[24, 24]}>
							{items.map((it: any) => (
								<Col xs={24} sm={12} md={12} lg={8} xl={6} key={it.id}>
									<DocumentCard
										item={it}
										onDetail={(id) => history.push(`/ban-doc/tai-lieu/${id}`)}
										onWishlist={() => {}}
										onCart={() => {}}
										accent={true}
										actions={[
											<Button
												key='detail'
												className='detail-btn small'
												icon={<SearchOutlined />}
												onClick={() => history.push(`/ban-doc/tai-lieu/${it.document_id}`)}
											>
												Chi tiết
											</Button>,
											<Button
												key='remove'
												className='remove-btn'
												icon={<DeleteOutlined />}
												loading={loading}
												onClick={() => handleRemove(it.id)}
											>
												Xóa
											</Button>,
										]}
									/>
								</Col>
							))}
						</Row>

						<div className='library-action-bar checkout-bar'>
							<div className='library-action-left'>
								<span className='library-count-badge'>Sẵn sàng tạo phiếu mượn</span>
							</div>
							<div className='library-action-right'>
								<Button
									type='primary'
									icon={<CheckCircleOutlined />}
									onClick={handleCheckout}
									loading={loading}
									disabled={items.length === 0}
								>
									Tạo phiếu mượn
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</PageSkeleton>
	);
}
