import React, { useEffect, useState } from 'react';
import { Button, Empty, List, message, Tag } from 'antd';
import { BookOutlined, FieldTimeOutlined, SyncOutlined } from '@ant-design/icons';
import PageSkeleton from '@/components/PageSkeleton';
import BorrowedBookList from '@/components/BorrowedBookList';
import * as MuonSach from '@/services/MuonSach';

const addDays = (value: string, days: number) => {
	const dueDate = value ? new Date(`${value}T00:00:00`) : new Date();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const baseDate = dueDate > today ? dueDate : today;
	baseDate.setDate(baseDate.getDate() + days);
	return baseDate.toISOString().slice(0, 10);
};

export default function RenewalsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [borrowedItems, setBorrowedItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [borrowedLoading, setBorrowedLoading] = useState(false);
	const [requestingId, setRequestingId] = useState<string | null>(null);

	const loadRenewals = async () => {
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

	const loadBorrowedItems = async () => {
		setBorrowedLoading(true);
		try {
			const res = await MuonSach.getMyBorrows();
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
			setBorrowedItems(activeItems);
		} catch (e) {
			message.error('Không tải được danh sách sách đang mượn');
		} finally {
			setBorrowedLoading(false);
		}
	};

	useEffect(() => {
		loadRenewals();
		loadBorrowedItems();
	}, []);

	const statusClass = (status: string) => {
		const value = String(status || '').toLowerCase();
		if (value.includes('approve') || value.includes('duyệt') || value.includes('accepted')) return 'success';
		if (value.includes('reject') || value.includes('từ chối')) return 'danger';
		if (value.includes('pending') || value.includes('chờ')) return 'warning';
		return 'neutral';
	};

	const getPendingRenewal = (borrowed: any) =>
		items.find(
			(renewal: any) =>
				renewal.borrow_record_item_id === String(borrowed.id) && String(renewal.status).toLowerCase() === 'pending',
		);

	const handleRequestRenewal = async (borrowed: any) => {
		setRequestingId(borrowed.id);
		try {
			await MuonSach.requestRenewal({
				borrow_record_item_id: String(borrowed.id),
				new_due_date: addDays(borrowed.due_date || borrowed.record_due_date, 7),
			});
			message.success('Đã gửi yêu cầu gia hạn');
			loadRenewals();
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không gửi được yêu cầu gia hạn');
		} finally {
			setRequestingId(null);
		}
	};

	return (
		<PageSkeleton title='Yêu cầu gia hạn'>
			<div className='library-panel'>
				<div className='borrowed-now-panel'>
					<div className='borrowed-now-header'>
						<div className='library-stat'>
							<BookOutlined />
							<div>
								<span>Sách đang mượn có thể gia hạn</span>
								<strong>{borrowedItems.length}</strong>
							</div>
						</div>
					</div>
					{borrowedItems.length === 0 ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={borrowedLoading ? 'Đang tải sách đang mượn' : 'Không có sách đang mượn để gia hạn'}
						/>
					) : (
						<BorrowedBookList
							loading={borrowedLoading}
							items={borrowedItems}
							emptyDescription='Không có sách đang mượn để gia hạn'
							actionRender={(borrowed: any) => {
								const pending = getPendingRenewal(borrowed);
								return pending ? (
									<Tag className='library-status-tag neutral'>Đã gửi yêu cầu</Tag>
								) : (
									<Button
										type='primary'
										icon={<FieldTimeOutlined />}
										loading={requestingId === borrowed.id}
										onClick={() => handleRequestRenewal(borrowed)}
									>
										Gia hạn thêm 7 ngày
									</Button>
								);
							}}
						/>
					)}
				</div>

				<div className='library-action-bar'>
					<div className='library-action-left'>
						<div className='library-stat'>
							<SyncOutlined />
							<div>
								<span>Yêu cầu gia hạn</span>
								<strong>{items.length}</strong>
							</div>
						</div>
					</div>
				</div>
				<div className='library-list-card'>
					{items.length === 0 ? (
						<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Chưa có yêu cầu gia hạn nào' />
					) : (
						<List
							loading={loading}
							dataSource={items}
							renderItem={(it: any) => (
								<List.Item>
									<List.Item.Meta
										title={it.document_title || 'Yêu cầu gia hạn'}
										description={`Hạn cũ: ${it.old_due_date || 'Không rõ'} | Hạn mới: ${it.new_due_date || 'Không rõ'}`}
									/>
									<div>
										<Tag className={`library-status-tag ${statusClass(it.status)}`}>{it.status || 'Đang cập nhật'}</Tag>
									</div>
								</List.Item>
							)}
						/>
					)}
				</div>
			</div>
		</PageSkeleton>
	);
}
