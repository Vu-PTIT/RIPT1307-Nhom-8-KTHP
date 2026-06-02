import React, { useState, useRef } from 'react';
import {
	Input, Button, Tag, Table, message, Empty, Tooltip, Select, Spin, InputRef,
	Typography, Card, Statistic,
} from 'antd';
import { SearchOutlined, RollbackOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { processReturn, getAllBorrowsLibrarian, getBorrowDetailLibrarian } from '@/services/ThuThu';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import { Modal } from 'antd';

const { Text } = Typography;
const { Option } = Select;

const ReturnTab: React.FC = () => {
	const barcodeRef = useRef<InputRef>(null);
	const [barcodeInput, setBarcodeInput] = useState('');
	const [condition, setCondition] = useState<string>('good');
	const [processing, setProcessing] = useState(false);
	const [recentReturns, setRecentReturns] = useState<any[]>([]);

	// Detail Modal state
	const [detailVisible, setDetailVisible] = useState(false);
	const [selectedBorrowId, setSelectedBorrowId] = useState<string | null>(null);

	const { data: borrowDetail, loading: detailLoading, run: fetchDetail } = useRequest(
		(id: string) => getBorrowDetailLibrarian(id),
		{ manual: true, formatResult: (res) => res.data }
	);

	const handleViewDetail = (id: string) => {
		setSelectedBorrowId(id);
		setDetailVisible(true);
		fetchDetail(id);
	};

	// Danh sách phiếu mượn đang active để thủ thư tra cứu
	const { data: activeBorrows, loading: borrowsLoading } = useRequest(
		() => getAllBorrowsLibrarian({ status: 'borrowed', page_size: 20 }),
		{
			formatResult: (res) => res.data || [],
		},
	);

	const handleReturn = async () => {
		const code = barcodeInput.trim();
		if (!code) {
			message.warning('Vui lòng nhập mã vạch bản sao!');
			return;
		}
		setProcessing(true);
		try {
			const res = await processReturn({ copy_code: code, condition_on_return: condition });
			const result = res.data;
			message.success(`✅ Nhận trả thành công! Ngày trả: ${dayjs(result.return_date).format('DD/MM/YYYY HH:mm')}`);
			setRecentReturns((prev) => [
				{ copy_code: code, condition, return_date: result.return_date, key: Date.now() },
				...prev.slice(0, 9),
			]);
			setBarcodeInput('');
			barcodeRef.current?.focus();
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Không tìm thấy bản sao hoặc bản sao chưa được mượn!';
			message.error(`❌ ${detail}`);
		} finally {
			setProcessing(false);
		}
	};

	const returnColumns = [
		{ title: 'Mã vạch', dataIndex: 'copy_code', key: 'copy_code', render: (v: string) => <Tag>{v}</Tag> },
		{
			title: 'Tình trạng trả',
			dataIndex: 'condition',
			key: 'condition',
			render: (v: string) => {
				const map: any = { good: { label: 'Tốt', color: 'success' }, damaged: { label: 'Hư hỏng', color: 'error' }, lost: { label: 'Mất', color: 'error' } };
				return <Tag color={map[v]?.color || 'default'}>{map[v]?.label || v}</Tag>;
			},
		},
		{
			title: 'Thời gian nhận trả',
			dataIndex: 'return_date',
			key: 'return_date',
			render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
		},
	];

	const borrowColumns = [
		{ title: 'Độc giả', dataIndex: 'reader_username', key: 'reader_username', render: (v: string) => <strong>{v}</strong> },
		{ title: 'Email', dataIndex: 'reader_email', key: 'reader_email', render: (v: string) => <Text type='secondary'>{v}</Text> },
		{ title: 'Ngày mượn', dataIndex: 'borrow_date', key: 'borrow_date', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
		{
			title: 'Hạn trả',
			dataIndex: 'due_date',
			key: 'due_date',
			render: (v: string) => {
				const isOverdue = dayjs(v).isBefore(dayjs());
				return <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>{dayjs(v).format('DD/MM/YYYY')}</span>;
			},
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => <Tag color={v === 'borrowed' ? 'processing' : 'default'}>{v === 'borrowed' ? 'Đang mượn' : v}</Tag>,
		},
		{ title: 'Số cuốn', dataIndex: 'item_count', key: 'item_count', render: (v: number) => `${v} cuốn` },
		{
			title: 'Hành động',
			key: 'action',
			render: (_: any, record: any) => (
				<Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
					Chi tiết
				</Button>
			)
		}
	];

	return (
		<div>
			{/* Ô nhập mã vạch nhận trả */}
			<Card style={{ borderRadius: 10, marginBottom: 24 }} bodyStyle={{ padding: 20 }}>
				<div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
					<RollbackOutlined style={{ marginRight: 8 }} /> Nhận trả sách
				</div>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					<Input
						ref={barcodeRef}
						size='large'
						placeholder='Quét mã vạch bản sao hoặc nhập thủ công...'
						value={barcodeInput}
						onChange={(e) => setBarcodeInput(e.target.value)}
						onPressEnter={handleReturn}
						prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
						style={{ flex: 1, minWidth: 200, borderRadius: 8 }}
					/>
					<Select
						size='large'
						value={condition}
						onChange={setCondition}
						style={{ width: 150, borderRadius: 8 }}
					>
						<Option value='good'>Tốt</Option>
						<Option value='damaged'>Hư hỏng</Option>
						<Option value='lost'>Mất</Option>
					</Select>
					<Button
						type='primary'
						size='large'
						icon={<CheckCircleOutlined />}
						onClick={handleReturn}
						loading={processing}
						style={{ background: '#e3000f', borderColor: '#e3000f', borderRadius: 8, fontWeight: 600 }}
					>
						Xác nhận trả
					</Button>
				</div>
			</Card>

			{/* Lịch sử nhận trả vừa xử lý */}
			{recentReturns.length > 0 && (
				<div style={{ marginBottom: 24 }}>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Vừa nhận trả ({recentReturns.length})</div>
					<Table
						dataSource={recentReturns}
						columns={returnColumns}
						rowKey='key'
						pagination={false}
						size='small'
						style={{ borderRadius: 8, overflow: 'hidden' }}
					/>
				</div>
			)}

			{/* Danh sách phiếu mượn đang active */}
			<div>
				<div style={{ fontWeight: 600, marginBottom: 12 }}>
					Phiếu mượn đang hoạt động
				</div>
				<Table
					dataSource={activeBorrows || []}
					columns={borrowColumns}
					loading={borrowsLoading}
					rowKey={(r: any) => String(r.id)}
					pagination={{ pageSize: 10, showSizeChanger: false }}
					locale={{ emptyText: <Empty description='Không có phiếu mượn nào đang hoạt động' /> }}
					style={{ borderRadius: 8, overflow: 'hidden' }}
					size='small'
				/>
			</div>

			<Modal
				title={<div style={{ fontSize: 18, fontWeight: 600 }}>Chi tiết phiếu mượn</div>}
				visible={detailVisible}
				onCancel={() => setDetailVisible(false)}
				footer={[
					<Button key="close" onClick={() => setDetailVisible(false)}>Đóng</Button>
				]}
				width={700}
			>
				{detailLoading ? (
					<div style={{ textAlign: 'center', padding: '40px 0' }}><Spin /></div>
				) : borrowDetail ? (
					<div>
						<div style={{ marginBottom: 16 }}>
							<Text type="secondary">Mã phiếu mượn:</Text> <Text strong>{borrowDetail.id}</Text>
							<br />
							<Text type="secondary">Ngày mượn:</Text> <Text strong>{dayjs(borrowDetail.borrow_date).format('DD/MM/YYYY')}</Text>
							<br />
							<Text type="secondary">Hạn trả:</Text> <Text strong style={{ color: '#d46b08' }}>{dayjs(borrowDetail.due_date).format('DD/MM/YYYY')}</Text>
							<br />
							<Text type="secondary">Trạng thái:</Text>{' '}
							<Tag color={borrowDetail.status === 'borrowed' ? 'processing' : 'default'}>
								{borrowDetail.status === 'borrowed' ? 'Đang mượn' : borrowDetail.status}
							</Tag>
						</div>
						
						<Text strong>Danh sách sách mượn ({borrowDetail.items?.length || 0} cuốn):</Text>
						<Table
							dataSource={borrowDetail.items || []}
							rowKey="id"
							pagination={false}
							size="small"
							style={{ marginTop: 8 }}
							columns={[
								{ title: 'Mã vạch', dataIndex: 'copy_code', render: (v: string) => <Tag>{v}</Tag> },
								{ title: 'Tên sách', dataIndex: 'document_title' },
								{ 
									title: 'Trạng thái', 
									dataIndex: 'status',
									render: (v: string) => {
										const map: any = { 
											borrowed: { label: 'Đang mượn', color: 'processing' }, 
											returned: { label: 'Đã trả', color: 'success' },
											overdue: { label: 'Quá hạn', color: 'error' }
										};
										return <Tag color={map[v]?.color || 'default'}>{map[v]?.label || v}</Tag>;
									}
								},
								{ 
									title: 'Ngày trả', 
									dataIndex: 'return_date',
									render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—'
								}
							]}
						/>
					</div>
				) : (
					<Empty description="Không tìm thấy thông tin phiếu mượn" />
				)}
			</Modal>
		</div>
	);
};

export default ReturnTab;
