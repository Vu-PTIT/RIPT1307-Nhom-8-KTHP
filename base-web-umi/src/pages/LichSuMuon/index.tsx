import React, { useEffect, useState } from 'react';
import { List, Card, message, Tag } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function BorrowHistoryPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const res = await MuonSach.getMyBorrows();
			setItems(res.data || []);
		} catch (e) {
			message.error('Không tải được lịch sử mượn');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<PageSkeleton title='Lịch sử mượn'>
			<Card>
				<List
					loading={loading}
					dataSource={items}
					renderItem={(it: any) => (
						<List.Item onClick={() => history.push(`/lich-su-muon/${it.id}`)} style={{ cursor: 'pointer' }}>
							<List.Item.Meta
								title={`Phiếu mượn ${it.id}`}
								description={`Ngày mượn: ${it.borrow_date} — Hạn trả: ${it.due_date}`}
							/>
							<div>
								<Tag>{it.status}</Tag>
							</div>
						</List.Item>
					)}
				/>
			</Card>
		</PageSkeleton>
	);
}
