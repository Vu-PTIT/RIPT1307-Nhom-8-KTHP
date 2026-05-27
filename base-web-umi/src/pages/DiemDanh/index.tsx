import React, { useEffect, useState } from 'react';
import { Card, Button, List, message, Empty, Tag } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function CheckinPage() {
	const [logs, setLogs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const res = await MuonSach.getCheckinHistory({ page: 1, page_size: 20 });
			setLogs(res.data?.items || res.data || []);
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
					<Button type='primary' onClick={() => doCheck('in')} style={{ marginRight: 8 }} loading={loading}>
						Check-in
					</Button>
					<Button onClick={() => doCheck('out')} loading={loading}>Check-out</Button>
				</div>

				{logs.length === 0 ? (
					<Empty description='Chưa có lịch sử' />
				) : (
					<List
						loading={loading}
						dataSource={logs}
						renderItem={(it: any) => (
							<List.Item>
								<List.Item.Meta
									title={
										<Tag color={it.check_type === 'in' ? 'green' : 'volcano'}>
											{it.check_type === 'in' ? '🟢 Check-in' : '🔴 Check-out'}
										</Tag>
									}
									description={
										it.check_time
											? new Date(it.check_time).toLocaleString('vi-VN')
											: 'Không rõ thời gian'
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
