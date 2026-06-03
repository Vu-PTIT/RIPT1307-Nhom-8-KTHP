import React, { useState } from 'react';
import {
	Button, Tag, Table, message, Empty, Select, Typography, Row, Col, Spin, Tooltip
} from 'antd';
import { RollbackOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { processReturn, getAllBorrowsLibrarian, getBorrowDetailLibrarian, getReturnHistoryLibrarian } from '@/services/ThuThu';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import ReaderSelector, { ReaderInfo } from './ReaderSelector';

const { Text } = Typography;
const { Option } = Select;

const ReturnTab: React.FC = () => {
	const [selectedReader, setSelectedReader] = useState<ReaderInfo | null>(null);
	const [processing, setProcessing] = useState(false);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const { data: returnHistoryData, loading: loadingHistory, refresh: refreshHistory } = useRequest(
		() => getReturnHistoryLibrarian({ page, page_size: pageSize }),
		{ 
			refreshDeps: [page, pageSize],
			formatResult: (res: any) => res?.data || res || [] 
		}
	);

	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [conditions, setConditions] = useState<Record<string, string>>({}); // { copy_code: 'good' }

	// Lấy danh sách sách đang mượn của độc giả
	const { data: borrowedItems, loading: loadingItems, refresh: refreshItems } = useRequest(
		async () => {
			if (!selectedReader) return [];
			const res = await getAllBorrowsLibrarian({ reader_id: selectedReader.id, page_size: 100 });
			let borrows = res.data?.items || res.data || [];

			// Filter out returned or cancelled records
			borrows = borrows.filter((b: any) => ['pending', 'borrowed', 'overdue'].includes(b.status));

			// Fetch details to get items safely
			const details = await Promise.all(
				borrows.map((b: any) => getBorrowDetailLibrarian(b.id || b._id).catch(() => null))
			);

			let allItems: any[] = [];
			details.forEach((r) => {
				if (!r) return;
				const items = r.data?.items || [];
				allItems = [...allItems, ...items.filter((i: any) => ['borrowed', 'overdue', 'pending'].includes(i.status))];
			});
			return allItems;
		},
		{
			refreshDeps: [selectedReader],
			formatResult: (res) => res || []
		}
	);

	const handleConditionChange = (copy_code: string, value: string) => {
		setConditions(prev => ({ ...prev, [copy_code]: value }));
	};

	const handleReturnSelected = async () => {
		if (selectedRowKeys.length === 0) {
			message.warning('Vui lòng chọn ít nhất 1 sách để trả!');
			return;
		}
		setProcessing(true);
		try {
			for (const copy_code of selectedRowKeys) {
				const cond = conditions[copy_code as string] || 'good';
				await processReturn({ copy_code: copy_code as string, condition_on_return: cond });
			}
			message.success(`✅ Nhận trả thành công ${selectedRowKeys.length} cuốn!`);

			setSelectedRowKeys([]);
			setConditions({});
			refreshItems();
			refreshHistory();
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra khi nhận trả!';
			message.error(`❌ ${detail}`);
		} finally {
			setProcessing(false);
		}
	};

	const itemsColumns = [
		{ title: 'Mã vạch', dataIndex: 'copy_code', key: 'copy_code', width: 120, render: (v: string) => <Tag>{v}</Tag> },
		{ title: 'Tên sách', dataIndex: 'document_title', key: 'document_title' },
		{
			title: 'Ngày mượn',
			dataIndex: 'borrow_date',
			key: 'borrow_date',
			render: (v: string) => dayjs(v).format('DD/MM/YYYY')
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => {
				return v === 'overdue' ? <Tag color="error">Quá hạn</Tag> : <Tag color="processing">Đang mượn</Tag>;
			}
		},
		{
			title: 'Tình trạng trả',
			key: 'condition',
			width: 140,
			render: (_: any, record: any) => (
				<Select
					size="small"
					value={conditions[record.copy_code] || 'good'}
					onChange={(val) => handleConditionChange(record.copy_code, val)}
					style={{ width: '100%' }}
					onClick={e => e.stopPropagation()}
				>
					<Option value="good">Tốt</Option>
					<Option value="damaged">Hư hỏng</Option>
					<Option value="lost">Mất</Option>
				</Select>
			)
		}
	];

	const returnColumns = [
		{ title: 'Mã vạch', dataIndex: 'copy_code', key: 'copy_code', render: (v: string) => <Tag>{v}</Tag> },
		{ title: 'Tên sách', dataIndex: 'document_title', key: 'document_title' },
		{ 
			title: 'Độc giả', 
			key: 'reader', 
			render: (_: any, record: any) => (
				<div>
					<div>{record.reader_name}</div>
					<div style={{ fontSize: 12, color: '#888' }}>{record.reader_email}</div>
				</div>
			) 
		},
		{
			title: 'Tình trạng trả',
			dataIndex: 'condition_on_return',
			key: 'condition_on_return',
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

	return (
		<div>
			<Row gutter={24}>
				{/* Cột Trái: Chọn Độc giả */}
				<Col xs={24} md={9} lg={8}>
					<ReaderSelector
						selectedReader={selectedReader}
						onSelectReader={(reader) => {
							setSelectedReader(reader);
							setSelectedRowKeys([]);
							setConditions({});
						}}
					/>
				</Col>

				{/* Cột Phải: Sách đang mượn */}
				<Col xs={24} md={15} lg={16}>
					<div style={{ marginBottom: 20 }}>
						<div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, display: 'flex', alignItems: 'center' }}>
							<SearchOutlined style={{ marginRight: 6 }} /> Chọn sách để trả
						</div>

						{!selectedReader ? (
							<div style={{ padding: '40px 0', textAlign: 'center', background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9' }}>
								<Empty description="Vui lòng chọn độc giả trước" />
							</div>
						) : (
							<Table
								dataSource={borrowedItems}
								columns={itemsColumns}
								rowKey="copy_code"
								loading={loadingItems}
								pagination={false}
								rowSelection={{
									selectedRowKeys,
									onChange: setSelectedRowKeys,
								}}
								locale={{ emptyText: <Empty description="Độc giả này không có sách nào cần trả" /> }}
								style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
								size="middle"
							/>
						)}
					</div>
				</Col>
			</Row>

			{/* Nút xác nhận */}
			<div style={{
				marginTop: 24,
				paddingTop: 16,
				borderTop: '1px solid #f0f0f0',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: 16
			}}>
				<div>
					{selectedRowKeys.length > 0 && (
						<Text strong style={{ fontSize: 15 }}>
							Đã chọn: <span style={{ color: '#c90000', fontSize: 16 }}>{selectedRowKeys.length}</span> cuốn để trả
						</Text>
					)}
				</div>
				<div>
					<Button
						type='primary'
						size='large'
						icon={<CheckCircleOutlined />}
						onClick={handleReturnSelected}
						disabled={selectedRowKeys.length === 0}
						loading={processing}
						className='btn-primary-danger'
						style={{ minWidth: 200, height: 48, fontSize: 16, fontWeight: 600 }}
					>
						XÁC NHẬN TRẢ SÁCH
					</Button>
				</div>
			</div>

			{/* Lịch sử nhận trả */}
			<div style={{ marginTop: 32 }}>
				<div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Lịch sử trả sách</div>
				<Table
					dataSource={returnHistoryData?.items || returnHistoryData || []}
					columns={returnColumns}
					rowKey='id'
					loading={loadingHistory}
					pagination={{
						current: page,
						pageSize: pageSize,
						total: returnHistoryData?.total || 0,
						onChange: (p, s) => {
							setPage(p);
							setPageSize(s || 10);
						},
						showSizeChanger: false,
						showTotal: (total) => `Tổng ${total} bản ghi`
					}}
					size='small'
					style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
					locale={{ emptyText: <Empty description='Chưa có sách nào vừa được trả' /> }}
				/>
			</div>
		</div>
	);
};

export default ReturnTab;
