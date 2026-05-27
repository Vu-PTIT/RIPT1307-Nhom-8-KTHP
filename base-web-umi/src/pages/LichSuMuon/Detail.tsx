import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Empty, message, Spin, Tag, Table, Space } from 'antd';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
	borrowed: { color: 'blue', label: 'Đang mượn' },
	overdue: { color: 'red', label: 'Quá hạn' },
	returned: { color: 'green', label: 'Đã trả' },
	pending: { color: 'orange', label: 'Chờ xử lý' },
};

const RecordStatus: Record<string, { color: string; label: string }> = {
	active: { color: 'blue', label: 'Đang mượn' },
	returned: { color: 'green', label: 'Đã trả hết' },
	overdue: { color: 'red', label: 'Quá hạn' },
	completed: { color: 'green', label: 'Hoàn thành' },
};

export default function BorrowDetailPage(props: any) {
	const id = props?.match?.params?.id;
	const [record, setRecord] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await MuonSach.getBorrowDetail(id);
			setRecord(res.data || null);
		} catch (e) {
			message.error('Không tải được chi tiết phiếu mượn');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id]);

	const columns = [
		{
			title: 'Mã bản sao',
			dataIndex: 'copy_code',
			key: 'copy_code',
		},
		{
			title: 'Tên tài liệu',
			dataIndex: 'document_title',
			key: 'document_title',
		},
		{
			title: 'Ngày mượn',
			dataIndex: 'borrow_date',
			key: 'borrow_date',
		},
		{
			title: 'Hạn trả',
			dataIndex: 'due_date',
			key: 'due_date',
		},
		{
			title: 'Ngày trả',
			dataIndex: 'return_date',
			key: 'return_date',
			render: (val: any) => val || <span style={{ color: '#999' }}>Chưa trả</span>,
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			render: (val: string) => {
				const s = STATUS_MAP[val] || { color: 'default', label: val };
				return <Tag color={s.color}>{s.label}</Tag>;
			},
		},
	];

	return (
		<PageSkeleton title='Chi tiết phiếu mượn'>
			<Card>
				<Spin spinning={loading}>
					{!record ? (
						<Empty description='Không tìm thấy phiếu mượn' />
					) : (
						<Space direction='vertical' size={16} style={{ width: '100%' }}>
							<Descriptions bordered column={{ xs: 1, sm: 2 }} size='small'>
								<Descriptions.Item label='Mã phiếu'>{String(record.id)}</Descriptions.Item>
								<Descriptions.Item label='Trạng thái'>
									{(() => {
										const s = RecordStatus[record.status] || { color: 'default', label: record.status };
										return <Tag color={s.color}>{s.label}</Tag>;
									})()}
								</Descriptions.Item>
								<Descriptions.Item label='Ngày mượn'>{record.borrow_date}</Descriptions.Item>
								<Descriptions.Item label='Hạn trả'>{record.due_date}</Descriptions.Item>
							</Descriptions>

							<div>
								<h3 style={{ marginBottom: 8 }}>Danh sách sách mượn</h3>
								<Table
									dataSource={record.items || []}
									columns={columns}
									rowKey='id'
									pagination={false}
									size='small'
								/>
							</div>

							<div style={{ textAlign: 'left' }}>
								<Button onClick={() => history.push('/lich-su-muon')}>← Quay lại lịch sử mượn</Button>
							</div>
						</Space>
					)}
				</Spin>
			</Card>
		</PageSkeleton>
	);
}
