import React, { useEffect, useState } from 'react';
import { Card, Button, List, message, Empty } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function CheckinPage() {
	const [history, setHistory] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const res = await MuonSach.getCheckinHistory({ page: 1, page_size: 20 });
			setHistory(res.data?.items || res.data || []);
		} catch (e) {
			message.error('Không tải được lịch sử Check-in');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const doCheck = async (type: 'in' | 'out') => {
		try {
			setLoading(true);
			await MuonSach.selfCheckin({ check_type: type, method: 'self' });
			message.success('Thành công');
			load();
		} catch (e) {
			message.error('Thao tác thất bại');
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageSkeleton title='Check-in / Check-out'>
			<Card>
				<div style={{ marginBottom: 12 }}>
					<Button type='primary' onClick={() => doCheck('in')} style={{ marginRight: 8 }}>
						Check-in
					</Button>
					<Button onClick={() => doCheck('out')}>Check-out</Button>
				</div>

				{history.length === 0 ? (
					<Empty description='Chưa có lịch sử' />
				) : (
					<List
						loading={loading}
						dataSource={history}
						renderItem={(it: any) => (
							<List.Item>
								<List.Item.Meta
									title={it.action || it.check_type}
									description={it.created_at || it.time || JSON.stringify(it)}
								/>
							</List.Item>
						)}
					/>
				)}
			</Card>
		</PageSkeleton>
	);
}
