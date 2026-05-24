import React, { useEffect, useState } from 'react';
import { List, Card, message, Tag } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function RenewalsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const res = await MuonSach.getMyRenewals();
			setItems(res.data || []);
		} catch (e) {
			message.error('Không tải được yêu cầu gia hạn');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<PageSkeleton title='Yêu cầu gia hạn'>
			<Card>
				<List
					loading={loading}
					dataSource={items}
					renderItem={(it: any) => (
						<List.Item>
							<List.Item.Meta
								title={it.document_title || 'Yêu cầu gia hạn'}
								description={`Hạn cũ: ${it.old_due_date} — Mới: ${it.new_due_date}`}
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
