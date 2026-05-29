import React, { useState } from 'react';
import { Table, Button, Tag, message, Empty, Tooltip, Typography, Popconfirm, Spin } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import { getAllBorrowsLibrarian, confirmReservation, cancelReservation } from '@/services/ThuThu';

const { Text } = Typography;

const ReserveTab: React.FC = () => {
	const { data: pendingBorrows, loading, mutate } = useRequest(
		() => getAllBorrowsLibrarian({ status: 'pending', page_size: 50 }),
		{
			formatResult: (res) => res.data || [],
		},
	);

	const [processingId, setProcessingId] = useState<string | null>(null);

	const handleConfirm = async (id: string) => {
		setProcessingId(id);
		try {
			await confirmReservation(id);
			message.success('✅ Đã xác nhận giao sách thành công!');
			mutate((prev: any[]) => prev.filter((item: any) => String(item.id) !== id));
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			message.error(`❌ ${detail}`);
		} finally {
			setProcessingId(null);
		}
	};

	const handleCancel = async (id: string) => {
		setProcessingId(id);
		try {
			await cancelReservation(id);
			message.success('Đã hủy phiếu đặt trước!');
			mutate((prev: any[]) => prev.filter((item: any) => String(item.id) !== id));
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			message.error(`❌ ${detail}`);
		} finally {
			setProcessingId(null);
		}
	};

	const columns = [
		{
			title: 'Độc giả',
			dataIndex: 'reader_username',
			key: 'reader_username',
			render: (v: string, record: any) => (
				<div>
					<div style={{ fontWeight: 600 }}>{v}</div>
					<Text type='secondary' style={{ fontSize: 12 }}>{record.reader_email}</Text>
				</div>
			),
		},
		{
			title: 'Thời gian đặt',
			dataIndex: 'created_at',
			key: 'created_at',
			render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
		},
		{
			title: 'Mã vạch cần lấy',
			dataIndex: 'copy_codes',
			key: 'copy_codes',
			render: (codes: string[]) => (
				<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
					{codes && codes.length > 0 ? (
						codes.map((code) => <Tag color='blue' key={code}>{code}</Tag>)
					) : (
						<Text type='secondary'>Không có</Text>
					)}
				</div>
			),
		},
		{
			title: 'Hành động',
			key: 'action',
			render: (_: any, record: any) => {
				const id = String(record.id);
				const isProcessing = processingId === id;
				return (
					<div style={{ display: 'flex', gap: 8 }}>
						<Button
							type='primary'
							icon={<CheckCircleOutlined />}
							size='small'
							loading={isProcessing}
							onClick={() => handleConfirm(id)}
							style={{ background: '#52c41a', borderColor: '#52c41a' }}
						>
							Xác nhận giao
						</Button>
						<Popconfirm
							title='Hủy đơn đặt trước này?'
							onConfirm={() => handleCancel(id)}
							okText='Hủy đơn'
							cancelText='Bỏ qua'
							okButtonProps={{ danger: true }}
						>
							<Button
								type='text'
								danger
								icon={<CloseCircleOutlined />}
								size='small'
								loading={isProcessing}
							>
								Hủy
							</Button>
						</Popconfirm>
					</div>
				);
			},
		},
	];

	return (
		<div>
			<div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>
				<ClockCircleOutlined style={{ marginRight: 8 }} /> Sách chờ độc giả đến nhận
			</div>
			<Table
				dataSource={pendingBorrows || []}
				columns={columns}
				loading={loading && !processingId}
				rowKey={(r: any) => String(r.id)}
				pagination={{ pageSize: 10, showSizeChanger: false }}
				locale={{ emptyText: <Empty description='Không có đơn đặt trước nào' /> }}
				style={{ borderRadius: 8, overflow: 'hidden' }}
				size='middle'
			/>
		</div>
	);
};

export default ReserveTab;
