import React, { useEffect, useState } from 'react';
import { Card, Empty, Alert, Button, Space, Tag, message, Row, Col } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import DocumentCard from '@/components/DocumentCard';

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

	useEffect(() => {
		load();
	}, []);

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
		<PageSkeleton title='Danh sách yêu thích'>
			<Card style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
				{error ? <Alert type='error' message={error} style={{ marginBottom: 12 }} /> : null}
				{items.length === 0 ? (
					<Empty description='Danh sách trống' />
				) : (
					<Row gutter={[24, 24]}>
						{items.map((it: any) => (
							<Col xs={24} sm={12} md={6} lg={6} key={it.id}>
								<DocumentCard
									item={it}
									onDetail={() => history.push(`/tai-lieu/${it.document_id}`)}
									onWishlist={() => {}}
									onCart={() => handleMoveToCart(it)}
									accent={true}
									actions={[
										<Button key='add' type='primary' onClick={() => handleMoveToCart(it)}>
											Thêm vào giỏ
										</Button>,
										<Button key='del' danger onClick={() => handleRemove(it.id)}>
											Xóa
										</Button>,
									]}
								/>
							</Col>
						))}
					</Row>
				)}
			</Card>
		</PageSkeleton>
	);
}
