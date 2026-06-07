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
			const records = Array.isArray(res.data) ? res.data : [];
			const detailResults = await Promise.allSettled(records.map((record: any) => MuonSach.getBorrowDetail(record.id)));
			
			const itemsWithDetails = records.map((record: any, index: number) => {
				const detailRes = detailResults[index];
				if (detailRes.status === 'fulfilled') {
					return { ...record, items: detailRes.value?.data?.items || [] };
				}
				return { ...record, items: [] };
			});
			setItems(itemsWithDetails);
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
		if (value.includes('borrow') || value.includes('mượn') || value.includes('active') || value.includes('pending')) return 'warning';
		return 'neutral';
	};

	const statusLabel = (status: string) => {
		const v = String(status || '').toLowerCase();
		if (v.includes('return') || v.includes('done')) return 'Đã trả';
		if (v.includes('over') || v.includes('late')) return 'Quá hạn';
		if (v.includes('pending')) return 'Chờ duyệt';
		if (v.includes('borrow') || v.includes('active')) return 'Đang mượn';
		return status || 'Đang cập nhật';
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
				<div style={{ marginTop: 12 }}>
					<List
						className="borrowed-book-list"
						loading={loading}
						dataSource={items}
						pagination={{
							pageSize: 5,
						}}
						renderItem={(it: any) => (
							<List.Item 
								onClick={() => history.push(`/ban-doc/lich-su-muon/${it.id}`)} 
								style={{ 
									cursor: 'pointer',
									background: '#ffffff',
									border: '1px solid var(--library-line)',
									borderRadius: 8,
									padding: 20
								}}
							>
								<List.Item.Meta
									title={
										<div style={{ fontWeight: 600, fontSize: 16 }}>
											Phiếu mượn {it.id ? `#${it.id.substring(0, 8).toUpperCase()}` : ''}
										</div>
									}
									description={
										<div style={{ marginTop: 4 }}>
											<div>Ngày mượn: <strong>{it.borrow_date ? new Date(`${it.borrow_date}`.includes('T') ? it.borrow_date : `${it.borrow_date}T00:00:00`).toLocaleDateString('vi-VN') : 'Không rõ'}</strong> | Hạn trả: <strong>{it.due_date ? new Date(`${it.due_date}`.includes('T') ? it.due_date : `${it.due_date}T00:00:00`).toLocaleDateString('vi-VN') : 'Không rõ'}</strong></div>
											{it.items && it.items.length > 0 && (
												<div style={{ marginTop: 8, color: '#666', fontSize: 13, background: '#f5f5f5', padding: '8px 12px', borderRadius: 6 }}>
													<div style={{ marginBottom: 4, fontWeight: 500, color: '#333' }}>Sách trong phiếu:</div>
													<ul style={{ margin: 0, paddingLeft: 20 }}>
														{it.items.map((book: any, idx: number) => (
															<li key={idx}>
																{book.document_title || book.title || 'Không rõ tên sách'} {book.copy_code ? `(${book.copy_code})` : ''} 
																{book.status === 'returned' && ' - Đã trả'}
															</li>
														))}
													</ul>
												</div>
											)}
										</div>
									}
								/>
								<div style={{ alignSelf: 'flex-start', marginTop: 4 }}>
									<Tag className={`library-status-tag ${statusClass(it.status)}`}>{statusLabel(it.status)}</Tag>
								</div>
							</List.Item>
						)}
					/>
				</div>
			</div>
		</PageSkeleton>
	);
}
