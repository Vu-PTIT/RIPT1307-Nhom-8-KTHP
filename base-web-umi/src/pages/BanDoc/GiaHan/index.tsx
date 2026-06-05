import React, { useEffect, useState } from 'react';
import { Button, Empty, List, message, Tag } from 'antd';
import { BookOutlined, FieldTimeOutlined, SyncOutlined, CalendarOutlined } from '@ant-design/icons';
import PageSkeleton from '@/components/PageSkeleton';
import BorrowedBookList from '@/components/BorrowedBookList';
import * as MuonSach from '@/services/MuonSach';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';

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
	const [activeTab, setActiveTab] = useState<'borrowed' | 'requests'>('borrowed');

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

	const getApprovedRenewal = (borrowed: any) =>
		items.find(
			(renewal: any) =>
				renewal.borrow_record_item_id === String(borrowed.id) && String(renewal.status).toLowerCase() === 'approved',
		);

	const canRenewItems = borrowedItems.filter(
		(borrowed: any) => !getPendingRenewal(borrowed) && !getApprovedRenewal(borrowed) && (borrowed.renewal_count || 0) < 1,
	);

	const displayBorrowedItems = borrowedItems.map((borrowed: any) => {
		const approved = getApprovedRenewal(borrowed);
		if (!approved) return borrowed;
		return {
			...borrowed,
			original_due_date: approved.old_due_date || borrowed.record_due_date,
			renewed_due_date: approved.new_due_date || borrowed.due_date,
		};
	});

	const handleRequestRenewal = async (borrowed: any) => {
		setRequestingId(borrowed.id);
		try {
			await MuonSach.requestRenewal({
				borrow_record_item_id: String(borrowed.id),
				new_due_date: addDays(borrowed.due_date || borrowed.record_due_date, 7),
			});
			message.success('Đã gửi yêu cầu gia hạn');
			await Promise.all([loadRenewals(), loadBorrowedItems()]);
		} catch (e: any) {
			message.error(e?.response?.data?.detail || 'Không gửi được yêu cầu gia hạn');
		} finally {
			setRequestingId(null);
		}
	};

	return (
		<PageSkeleton title='Yêu cầu gia hạn'>
			<div className='library-panel'>
				<div
					className='library-stats-switch'
					style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}
				>
					<div 
						className={`library-stat clickable ${activeTab === 'borrowed' ? 'active' : ''}`}
						role='button'
						tabIndex={0}
						onClick={() => setActiveTab('borrowed')}
						onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('borrowed')}
					>
						<BookOutlined />
						<div>
							<span>Sách đang mượn có thể gia hạn</span>
							<strong>{canRenewItems.length}</strong>
						</div>
					</div>
					<div 
						className={`library-stat clickable ${activeTab === 'requests' ? 'active' : ''}`}
						role='button'
						tabIndex={0}
						onClick={() => setActiveTab('requests')}
						onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('requests')}
					>
						<SyncOutlined />
						<div>
							<span>Yêu cầu gia hạn</span>
							<strong>{items.length}</strong>
						</div>
					</div>
				</div>

				{activeTab === 'borrowed' && (
					<div style={{ marginTop: 12 }}>
						{borrowedItems.length === 0 ? (
							<Empty
								image={Empty.PRESENTED_IMAGE_SIMPLE}
								description={borrowedLoading ? 'Đang tải sách đang mượn' : 'Không có sách đang mượn để gia hạn'}
							/>
						) : (
							<BorrowedBookList
								loading={borrowedLoading}
								items={displayBorrowedItems}
								emptyDescription='Không có sách đang mượn để gia hạn'
								actionRender={(borrowed: any) => {
									const pending = getPendingRenewal(borrowed);
									const renewed = getApprovedRenewal(borrowed) || (borrowed.renewal_count || 0) >= 1;
									return pending ? (
										<Tag className='library-status-tag neutral'>Đã gửi yêu cầu</Tag>
									) : renewed ? (
										<Tag className='library-status-tag success'>Đã gia hạn</Tag>
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
				)}

				{activeTab === 'requests' && (
					<div style={{ marginTop: 12 }}>
						{items.length === 0 ? (
							<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Chưa có yêu cầu gia hạn nào' />
						) : (
							<List
								className='borrowed-book-list'
								loading={loading}
								dataSource={items}
								renderItem={(it: any) => {
									let cover = it.cover_image || getCoverForTitle(it.document_title) || '/default-cover.png';
									if (typeof cover === 'string' && /^[a-fA-F0-9]{24}$/.test(cover)) {
										cover = `${ipLibrary}/documents/covers/${cover}`;
									}
									const statusText = it.status === 'pending' ? 'Chờ duyệt' : it.status === 'approved' ? 'Đã duyệt' : it.status === 'rejected' ? 'Từ chối' : it.status;
									return (
										<List.Item className="borrowed-book-card">
											<div className="borrowed-book-cover" style={{ backgroundImage: `url(${cover})` }} />
											<div className="borrowed-book-main">
												<div className="borrowed-book-heading">
													<div>
														<h3>{it.document_title || 'Yêu cầu gia hạn'}</h3>
														<p>{it.author || 'Chưa rõ tác giả'}</p>
													</div>
													<div className="borrowed-book-status">
														<Tag className={`library-status-tag ${statusClass(it.status)}`}>{statusText}</Tag>
													</div>
												</div>
												<div className="borrowed-book-dates">
													<div>
														<span>Ngày mượn</span>
														<strong>
															<CalendarOutlined /> {it.borrow_date ? new Date(`${it.borrow_date}`.includes('T') ? it.borrow_date : `${it.borrow_date}T00:00:00`).toLocaleDateString('vi-VN') : 'Không rõ'}
														</strong>
													</div>
													<div>
														<span>Hạn cũ</span>
														<strong>
															<CalendarOutlined /> {it.old_due_date ? new Date(`${it.old_due_date}`.includes('T') ? it.old_due_date : `${it.old_due_date}T00:00:00`).toLocaleDateString('vi-VN') : 'Không rõ'}
														</strong>
													</div>
													<div>
														<span>Hạn mới</span>
														<strong>
															<CalendarOutlined /> {it.new_due_date ? new Date(`${it.new_due_date}`.includes('T') ? it.new_due_date : `${it.new_due_date}T00:00:00`).toLocaleDateString('vi-VN') : 'Không rõ'}
														</strong>
													</div>
													<div>
														<span>Mã bản sao</span>
														<strong>{it.copy_code || 'Không rõ'}</strong>
													</div>
												</div>
											</div>
										</List.Item>
									);
								}}
							/>
						)}
					</div>
				)}
			</div>
		</PageSkeleton>
	);
}
