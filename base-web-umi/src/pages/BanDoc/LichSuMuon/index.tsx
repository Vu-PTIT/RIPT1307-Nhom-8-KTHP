import React, { useEffect, useState } from 'react';
import { List, message, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { history } from 'umi';
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

	const statusClass = (status: string) => {
		const value = String(status || '').toLowerCase();
		if (value.includes('return') || value.includes('trả') || value.includes('done')) return 'success';
		if (value.includes('over') || value.includes('late') || value.includes('quá')) return 'danger';
		if (value.includes('borrow') || value.includes('mượn') || value.includes('active')) return 'warning';
		return 'neutral';
	};

	return (
		<PageSkeleton title='Lịch sử mượn'>
			<div className='library-panel'>
				<div className='library-action-bar'>
					<div className='library-action-left'>
						<div className='library-stat'>
							<HistoryOutlined />
							<div>
								<span>Phiếu mượn của bạn</span>
								<strong>{items.length}</strong>
							</div>
						</div>
					</div>
				</div>
				<div className='library-list-card'>
					<List
						loading={loading}
						dataSource={items}
						renderItem={(it: any) => (
							<List.Item onClick={() => history.push(`/lich-su-muon/${it.id}`)} style={{ cursor: 'pointer' }}>
								<List.Item.Meta
									title={`Phiếu mượn ${it.id}`}
									description={`Ngày mượn: ${it.borrow_date || 'Không rõ'} | Hạn trả: ${it.due_date || 'Không rõ'}`}
								/>
								<div>
									<Tag className={`library-status-tag ${statusClass(it.status)}`}>{it.status || 'Đang cập nhật'}</Tag>
								</div>
							</List.Item>
						)}
					/>
				</div>
			</div>
		</PageSkeleton>
	);
}
