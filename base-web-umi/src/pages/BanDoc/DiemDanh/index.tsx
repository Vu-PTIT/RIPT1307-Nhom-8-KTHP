import React, { useEffect, useState } from 'react';
import { Alert, List, message, Empty, Tag } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

export default function CheckinPage() {
	const [logs, setLogs] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [loading, setLoading] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);

	const load = async (p = page, s = pageSize, showError = false) => {
		setLoading(true);
		try {
			const res = await MuonSach.getCheckinHistory({ page: p, page_size: s });
			const nextLogs = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
			const totalItems = res.data?.total || nextLogs.length;
			setLogs(nextLogs);
			setTotal(totalItems);
			setPage(p);
			setPageSize(s);
			setHistoryError(null);
		} catch (e) {
			const errorMessage = 'Không tải được lịch sử Check-in';
			setHistoryError(errorMessage);
			if (showError) message.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);


	return (
		<PageSkeleton title='Lịch sử điểm danh'>
			<div className='library-panel'>
				<div style={{ marginBottom: 16 }}>
					<h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--library-ink)', marginBottom: 8 }}>Thống kê điểm danh</h2>
					<p style={{ color: 'var(--library-muted)', fontWeight: 550 }}>Theo dõi lịch sử vào/ra thư viện của bạn.</p>
				</div>
				<div className='library-list-card'>
						{historyError ? (
							<Alert type='warning' showIcon message={historyError} style={{ margin: '16px 16px 0' }} />
						) : null}
						{logs.length === 0 ? (
							<div className='library-empty-state'>
								<Empty description='Chưa có lịch sử check-in/out' />
							</div>
						) : (
							<List
								loading={loading}
								dataSource={logs}
								pagination={{
									current: page,
									pageSize: pageSize,
									total: total,
									onChange: (p, s) => load(p, s),
									showSizeChanger: true,
									pageSizeOptions: ['10', '20', '50'],
									showTotal: (t) => `Tổng số ${t} lượt check-in/out`,
								}}
								renderItem={(it: any) => (
									<List.Item className='checkin-log-item' style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', marginBottom: '12px', border: '1px solid #f0f0f0' }}>
										<List.Item.Meta
											avatar={
												<div style={{
													width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
													background: it.check_type === 'in' ? '#f6ffed' : '#fff1f0',
													color: it.check_type === 'in' ? '#52c41a' : '#ff4d4f',
													fontSize: 18
												}}>
													{it.check_type === 'in' ? <LoginOutlined /> : <LogoutOutlined />}
												</div>
											}
											title={
												<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
													<span style={{ fontWeight: 600, fontSize: 16 }}>{it.check_type === 'in' ? 'Check-in' : 'Check-out'}</span>
													<Tag className={`library-status-tag ${it.check_type === 'in' ? 'success' : 'danger'}`}>
														{it.method === 'self' ? 'Tự phục vụ' : 'Thủ thư thao tác'}
													</Tag>
												</div>
											}
											description={
												<div style={{ marginTop: 4, color: '#8c8c8c' }}>
													{it.check_time ? new Date(it.check_time).toLocaleString('vi-VN') : 'Không rõ thời gian'}
												</div>
											}
										/>
									</List.Item>
								)}
							/>
						)}
				</div>
			</div>
		</PageSkeleton>
	);
}
