import React, { useEffect, useState } from 'react';
import { List, Card, Empty, Alert, Button, Space, Tag, message } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function WishlistPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await MuonSach.getMyWishlist();
			setItems(res.data?.items || res.data || []);
		} catch (e) {
			setError('Không tải được danh sách yêu thích');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const handleRemove = async (id: string) => {
		setBusyId(id);
		try {
			await MuonSach.removeFromWishlist(id);
			load();
		} catch (e) {
			setError('Xoá thất bại');
		} finally {
			setBusyId(null);
		}
	};

	const handleMoveToCart = async (item: any) => {
		setBusyId(item.id);
		try {
			await MuonSach.addToCart(item.document_id);
			message.success('Đã chuyển sang giỏ mượn');
			load();
		} catch (e: any) {
			setError(e?.response?.data?.detail || 'Chuyển sang giỏ mượn thất bại');
		} finally {
			setBusyId(null);
		}
	};

	return (
		<PageSkeleton title="Danh sách yêu thích">
			<Card>
				{error ? <Alert type="error" message={error} style={{ marginBottom: 12 }} /> : null}
				{items.length === 0 ? (
					<Empty description="Danh sách trống" />
				) : (
					<List
						loading={loading}
						dataSource={items}
						renderItem={(it: any) => (
							<List.Item
								actions={[
									<Button size="small" onClick={() => history.push(`/tai-lieu/${it.document_id}`)}>Chi tiết</Button>,
									<Button size="small" loading={busyId === it.id} onClick={() => handleMoveToCart(it)}>Đưa vào giỏ</Button>,
									<Button size="small" danger loading={busyId === it.id} onClick={() => handleRemove(it.id)}>Xoá</Button>,
								]}
							>
								<List.Item.Meta
									title={<a onClick={() => history.push(`/tai-lieu/${it.document_id}`)}>{it.document_title}</a>}
									description={
										<Space direction="vertical" size={2}>
											<span>{it.author}</span>
											<Tag color="magenta">Đã lưu {it.added_at || ''}</Tag>
										</Space>
									}
								/>
							</List.Item>
						)}
					/>
				)}
			</Card>
		</PageSkeleton>
	);
}
