import React, { useState } from 'react';
import { Typography, message, Spin, Empty } from 'antd';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import PendingList, { PendingRenewalItem } from './components/PendingList';
import HistoryList, { HistoryRenewalItem } from './components/HistoryList';
import { getPendingRenewals, reviewRenewal } from '@/services/ThuThu';

const { Title, Text } = Typography;

/** Map dữ liệu từ API sang cấu trúc PendingList component mong đợi */
function mapToPending(item: any): PendingRenewalItem {
	const dueDate = dayjs(item.old_due_date);
	const now = dayjs();
	const overdueDays = now.diff(dueDate, 'day');
	const isOverdue = overdueDays > 0;

	return {
		id: String(item.id),
		bookTitle: item.document_title || 'Không rõ tên sách',
		bookImage: item.cover_image,
		readerName: item.reader_name || item.reader_username || 'Độc giả',
		borrowDate: item.borrow_date ? dayjs(item.borrow_date).format('DD/MM/YYYY') : '—',
		currentDueDate: dueDate.format('DD/MM/YYYY'),
		renewalCount: item.renewal_count != null ? `${item.renewal_count}/2` : '0/2',
		requestTime: dayjs(item.request_date).format('DD/MM/YYYY HH:mm'),
		isOverdue,
		overdueDays: isOverdue ? overdueDays : undefined,
	};
}

function mapToHistory(item: any, status: 'APPROVED' | 'REJECTED'): HistoryRenewalItem {
	return {
		id: String(item.id),
		bookTitle: item.document_title || 'Không rõ tên sách',
		readerName: item.reader_name || item.reader_username || 'Độc giả',
		requestTime: dayjs(item.request_date).format('DD/MM/YYYY HH:mm'),
		handleTime: item.reviewed_at ? dayjs(item.reviewed_at).format('DD/MM/YYYY HH:mm') : dayjs().format('DD/MM/YYYY HH:mm'),
		status,
	};
}

const RenewalReview: React.FC = () => {
	const [historyData, setHistoryData] = useState<HistoryRenewalItem[]>([]);

	// Lấy danh sách chờ duyệt từ API
	const {
		data: pendingApiData,
		loading,
		mutate: mutatePending,
	} = useRequest(() => getPendingRenewals('pending'), {
		formatResult: (res) => res.data,
	});

	// Lấy lịch sử đã xử lý (approved + rejected)
	const { data: historyApiData } = useRequest(() => getPendingRenewals('approved'), {
		formatResult: (res) => res.data as any[],
		onSuccess: (data) => {
			const approvedItems = (data || []).map((item: any) => mapToHistory(item, 'APPROVED'));
			setHistoryData((prev) => {
				// Merge: ưu tiên local state (vừa thao tác), thêm từ API nếu chưa có
				const existingIds = new Set(prev.map((h) => h.id));
				const fromApi = approvedItems.filter((h: HistoryRenewalItem) => !existingIds.has(h.id));
				return [...prev, ...fromApi];
			});
		},
	});

	const pendingData: PendingRenewalItem[] = (pendingApiData || []).map(mapToPending);

	// Hàm xử lý Duyệt
	const handleAccept = async (id: string) => {
		const target = pendingApiData?.find((item: any) => String(item.id) === id);
		try {
			await reviewRenewal(id, { status: 'approved' });
			message.success(`✅ Đã phê duyệt gia hạn: ${target?.document_title}`);
			// Cập nhật local state
			mutatePending((prev: any[]) => prev?.filter((item: any) => String(item.id) !== id) ?? []);
			if (target) {
				setHistoryData((prev) => [mapToHistory({ ...target, reviewed_at: new Date().toISOString() }, 'APPROVED'), ...prev]);
			}
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			message.error(`❌ ${detail}`);
		}
	};

	// Hàm xử lý Từ chối
	const handleReject = async (id: string) => {
		const target = pendingApiData?.find((item: any) => String(item.id) === id);
		try {
			await reviewRenewal(id, { status: 'rejected' });
			message.info(`Đã từ chối yêu cầu của: ${target?.reader_name || target?.reader_username}`);
			mutatePending((prev: any[]) => prev?.filter((item: any) => String(item.id) !== id) ?? []);
			if (target) {
				setHistoryData((prev) => [mapToHistory({ ...target, reviewed_at: new Date().toISOString() }, 'REJECTED'), ...prev]);
			}
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			message.error(`❌ ${detail}`);
		}
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

			{loading ? (
				<div style={{ textAlign: 'center', padding: 80 }}>
					<Spin size='large' />
				</div>
			) : (
				<>
					{/* 1. Danh sách chờ duyệt */}
					{pendingData.length === 0 ? (
						<Empty
							description='Không có yêu cầu gia hạn đang chờ duyệt'
							style={{
								background: '#fff',
								padding: '40px 20px',
								borderRadius: 12,
								marginBottom: 32,
							}}
						/>
					) : (
						<PendingList data={pendingData} onAccept={handleAccept} onReject={handleReject} />
					)}

					{/* 2. Lịch sử xử lý */}
					<HistoryList data={historyData} />
				</>
			)}
		</div>
	);
};

export default RenewalReview;
