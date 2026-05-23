import React, { useEffect, useState } from 'react';
import { Button, List, Card, message, Empty, Alert, Space, Tag } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function BorrowCartPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await MuonSach.getMyCart();
			setItems(res.data?.items || res.data || []);
		} catch (e) {
			setError('Không tải được giỏ mượn');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const handleRemove = async (id: string) => {
		setLoading(true);
		try {
			await MuonSach.removeFromCart(id);
			message.success('Đã xoá khỏi giỏ');
			load();
		} catch (e) {
			setError('Xoá thất bại');
		} finally {
			setLoading(false);
		}
	};

	const handleCheckout = async () => {
		try {
			setLoading(true);
			const res = await MuonSach.checkoutCart();
			message.success('Tạo phiếu mượn thành công');
			setItems([]);
			history.push('/lich-su-muon');
		} catch (e: any) {
			setError(e?.response?.data?.detail || 'Checkout thất bại');
		} finally {
			setLoading(false);
		}
	};

	const handleClearCart = async () => {
		setLoading(true);
		try {
			await MuonSach.clearCart();
			setItems([]);
			message.success('Đã xoá toàn bộ giỏ mượn');
		} catch (e: any) {
			setError(e?.response?.data?.detail || 'Không xoá được giỏ mượn');
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageSkeleton title="Giỏ mượn sách">
			<Card>
				{error ? <Alert type="error" message={error} style={{ marginBottom: 12 }} /> : null}
				{items.length === 0 ? (
					<Empty description="Giỏ mượn trống" />
				) : (
					<>
						<Space style={{ marginBottom: 12 }} wrap>
							<Tag color="blue">{items.length} tài liệu</Tag>
							<Button onClick={() => history.push('/tai-lieu')}>Tiếp tục chọn tài liệu</Button>
							<Button onClick={handleClearCart} danger loading={loading}>Xoá toàn bộ giỏ</Button>
						</Space>
						<List
							loading={loading}
							dataSource={items}
							renderItem={(it: any) => (
								<List.Item
									actions={[
										<Button size="small" onClick={() => history.push(`/tai-lieu/${it.document_id}`)}>Chi tiết</Button>,
										<Button size="small" danger onClick={() => handleRemove(it.id)}>Xoá</Button>,
									]}
								>
									<List.Item.Meta
										title={<a onClick={() => history.push(`/tai-lieu/${it.document_id}`)}>{it.document_title}</a>}
										description={
											<Space direction="vertical" size={2}>
												<span>{it.author}</span>
												<Tag color="gold">Đã thêm {it.added_at || ''}</Tag>
											</Space>
										}
									/>
								</List.Item>
							)}
						/>
						<div style={{ textAlign: 'right', marginTop: 12 }}>
							<Button type="primary" onClick={handleCheckout} loading={loading} disabled={items.length === 0}>
								Tạo phiếu mượn
							</Button>
						</div>
					</>
				)}
			</Card>
		</PageSkeleton>
	);
}
