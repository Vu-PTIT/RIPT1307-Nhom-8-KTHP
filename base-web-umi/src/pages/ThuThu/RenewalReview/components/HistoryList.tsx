import React from 'react';
import { Card, Typography, Tag, List } from 'antd';
import LibraryPagination from '@/components/LibraryPagination';

const { Title, Text } = Typography;

export interface HistoryRenewalItem {
	id: string;
	bookTitle: string;
	readerName: string;
	requestTime: string;
	handleTime: string;
	status: 'APPROVED' | 'REJECTED';
	copyCode?: string;
	bookImage?: string;
	newDueDate?: string;
}

interface HistoryListProps {
	data: HistoryRenewalItem[];
	total: number;
	page: number;
	pageSize: number;
	onPageChange: (page: number, pageSize: number) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ data, total, page, pageSize, onPageChange }) => {
	return (
		<div>
			<Title level={5} style={{ marginBottom: 16, fontWeight: 600 }}>
				Lịch sử xử lý
			</Title>

			<List
				dataSource={data}
				renderItem={(item) => (
					<Card
						bordered
						style={{ borderRadius: 8, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}
						bodyStyle={{ padding: '16px 20px' }}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
							<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1, flexWrap: 'wrap', minWidth: 250 }}>
								<img
									src={item.bookImage || 'https://via.placeholder.com/60x85?text=Book'}
									alt={item.bookTitle}
									style={{
										width: 50,
										height: 70,
										objectFit: 'cover',
										borderRadius: 6,
										boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
									}}
								/>
								<div style={{ flex: 1 }}>
									<Title level={5} style={{ margin: '0 0 4px 0', fontSize: 15 }}>
										{item.bookTitle}
									</Title>
									<Text type='secondary' style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>
										Mã bản sao: <Text strong>{item.copyCode || '—'}</Text>
									</Text>
									<Text type='secondary' style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
										Người dùng: {item.readerName}
									</Text>
									<Text type='secondary' style={{ fontSize: 12, color: '#bfbfbf' }}>
										Yêu cầu: {item.requestTime} | Xử lý: {item.handleTime}
									</Text>
								</div>
								
								<div style={{ padding: '0', textAlign: 'left', minWidth: 150 }}>
									{item.newDueDate && (
										<>
											<div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Gia hạn đến</div>
											<div style={{ 
												fontWeight: 500, 
												color: item.status === 'APPROVED' ? '#52c41a' : '#ff4d4f',
												textDecoration: item.status === 'REJECTED' ? 'line-through' : 'none'
											}}>
												{item.newDueDate}
											</div>
										</>
									)}
								</div>
							</div>

							<div style={{ minWidth: 100, textAlign: 'left' }}>
								{item.status === 'APPROVED' ? (
									<Tag color='success' style={{ borderRadius: 10, padding: '2px 12px', fontWeight: 500, margin: 0 }}>
										Đã duyệt
									</Tag>
								) : (
									<Tag color='error' style={{ borderRadius: 10, padding: '2px 12px', fontWeight: 500, margin: 0 }}>
										Từ chối
									</Tag>
								)}
							</div>
						</div>
					</Card>
				)}
			/>

			{total > 0 && (
				<LibraryPagination
					current={page}
					pageSize={pageSize}
					total={total}
					onChange={onPageChange}
					complex={true}
				/>
			)}
		</div>
	);
};

export default HistoryList;
