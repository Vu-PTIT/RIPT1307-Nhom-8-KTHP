import React from 'react';
import { Card, Typography, Tag, List } from 'antd';

const { Title, Text } = Typography;

export interface HistoryRenewalItem {
	id: string;
	bookTitle: string;
	readerName: string;
	requestTime: string;
	handleTime: string;
	status: 'APPROVED' | 'REJECTED';
}

interface HistoryListProps {
	data: HistoryRenewalItem[];
}

const HistoryList: React.FC<HistoryListProps> = ({ data }) => {
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
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div>
								<Title level={5} style={{ margin: '0 0 4px 0', fontSize: 15 }}>
									{item.bookTitle}
								</Title>
								<Text type='secondary' style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
									{item.readerName}
								</Text>
								<Text type='secondary' style={{ fontSize: 12, color: '#bfbfbf' }}>
									Yêu cầu: {item.requestTime} | Xử lý: {item.handleTime}
								</Text>
							</div>

							<div>
								{item.status === 'APPROVED' ? (
									<Tag color='success' style={{ borderRadius: 10, padding: '2px 12px', fontWeight: 500 }}>
										Đã duyệt
									</Tag>
								) : (
									<Tag color='error' style={{ borderRadius: 10, padding: '2px 12px', fontWeight: 500 }}>
										Từ chối
									</Tag>
								)}
							</div>
						</div>
					</Card>
				)}
			/>
		</div>
	);
};

export default HistoryList;
