import React, { useState } from 'react';
import { Typography, message } from 'antd';
import PendingList, { PendingRenewalItem } from './components/PendingList';
import HistoryList, { HistoryRenewalItem } from './components/HistoryList';

const { Title, Text } = Typography;

const RenewalReview: React.FC = () => {
	// Mock dữ liệu chờ duyệt đúng chuẩn ảnh Figma mẫu
	const [pendingData, setPendingData] = useState<PendingRenewalItem[]>([
		{
			id: 'req_01',
			bookTitle: 'The Pragmatic Programmer',
			bookImage: 'https://images-na.ssl-images-amazon.com/images/I/41as+w6Z7gL._SX396_BO1,204,203,200_.jpg', // Link ảnh mẫu
			readerName: 'Nguyễn Văn An',
			borrowDate: '20/04/2026',
			currentDueDate: '05/05/2026',
			renewalCount: '1/2',
			requestTime: '04/05/2026 07:00',
			isOverdue: true,
			overdueDays: 20,
		},
	]);

	// Mock dữ liệu lịch sử đã duyệt giống Figma
	const [historyData, setHistoryData] = useState<HistoryRenewalItem[]>([
		{
			id: 'req_02',
			bookTitle: 'Clean Code',
			readerName: 'Nguyễn Văn An',
			requestTime: '08/05/2026 07:00',
			handleTime: '09/05/2026 07:00',
			status: 'APPROVED',
		},
	]);

	// Hàm xử lý khi bấm nút "Duyệt"
	const handleAccept = (id: string) => {
		const target = pendingData.find((item) => item.id === id);
		if (!target) return;

		message.success(`Đã phê duyệt gia hạn sách: ${target.bookTitle}`);

		// Xóa khỏi hàng chờ
		setPendingData(pendingData.filter((item) => item.id !== id));
		// Đẩy vào bảng lịch sử lịch trình xử lý
		setHistoryData([
			{
				id: target.id,
				bookTitle: target.bookTitle,
				readerName: target.readerName,
				requestTime: target.requestTime,
				handleTime: '25/05/2026 22:30', // Lấy mốc thời gian hiện tại
				status: 'APPROVED',
			},
			...historyData,
		]);
	};

	// Hàm xử lý khi bấm nút "Từ chối"
	const handleReject = (id: string) => {
		const target = pendingData.find((item) => item.id === id);
		if (!target) return;

		message.info(`Đã từ chối yêu cầu của độc giả: ${target.readerName}`);
		setPendingData(pendingData.filter((item) => item.id !== id));
		setHistoryData([
			{
				id: target.id,
				bookTitle: target.bookTitle,
				readerName: target.readerName,
				requestTime: target.requestTime,
				handleTime: '25/05/2026 22:30',
				status: 'REJECTED',
			},
			...historyData,
		]);
	};

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Tiêu đề trang */}
			<div style={{ marginBottom: 24 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Phê duyệt gia hạn
				</Title>
				<Text type='secondary'>Xem xét và xử lý yêu cầu gia hạn từ độc giả</Text>
			</div>

			{/* 1. Phần danh sách chờ duyệt */}
			<PendingList data={pendingData} onAccept={handleAccept} onReject={handleReject} />

			{/* 2. Phần danh sách lịch sử xử lý */}
			<HistoryList data={historyData} />
		</div>
	);
};

export default RenewalReview;
