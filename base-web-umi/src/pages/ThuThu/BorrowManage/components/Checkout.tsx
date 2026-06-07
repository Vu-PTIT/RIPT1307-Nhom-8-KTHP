import React, { useState, useRef } from 'react';
import {
	Input, Typography, Table, Button, Space, Tag, message, Modal, Form,
	Select, Spin, Empty, InputRef, Tooltip, Avatar, Row, Col
} from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, DeleteOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import { searchCopyByCode, searchReaders, createBorrowLibrarian, getDocumentCopies, getAllBorrowsLibrarian, getBorrowDetailLibrarian } from '@/services/ThuThu';
import { searchDocuments } from '@/services/TaiLieu';
import { getApiError } from '@/utils/getApiError';
import moment from 'moment';
import dayjs from 'dayjs';
import ReaderSelector, { ReaderInfo } from './ReaderSelector';

const { Title, Text } = Typography;
const { Option } = Select;

interface CopyInfo {
	id: string;
	copy_code: string;
	document_title: string;
	author?: string;
	cover_image?: string;
	status: string;
	condition: string;
}

const makeResponsiveColumns = (columns: any[]) => columns.map(col => ({
	...col,
	onCell: (record: any) => ({
		'data-label': col.title,
		...(col.onCell ? col.onCell(record) : {})
	})
}));

const CheckoutTab: React.FC = () => {
	const [selectedCopies, setSelectedCopies] = useState<CopyInfo[]>([]);
	const [searchingCopy, setSearchingCopy] = useState(false);

	const [selectedReader, setSelectedReader] = useState<ReaderInfo | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

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

	// Danh sách phiếu mượn vừa tạo
	const { data: activeBorrows, loading: borrowsLoading, refresh: refreshActiveBorrows } = useRequest(
		() => getAllBorrowsLibrarian({ status: 'borrowed', page_size: 20 }),
		{
			formatResult: (res) => res.data || [],
		},
	);

	// Tìm sách
	const [bookKeyword, setBookKeyword] = useState('');
	const { data: booksData, loading: searchingBook } = useRequest(
		() => searchDocuments({ keyword: bookKeyword, page_size: 10 }),
		{
			refreshDeps: [bookKeyword],
			debounceInterval: 400,
			ready: bookKeyword.length >= 2,
			formatResult: (res) => res.data?.items || [],
		},
	);

	// Chọn sách
	const handleSelectBook = async (docId: string, option: any) => {
		setSearchingCopy(true);
		try {
			// Find available copies
			const res = await getDocumentCopies(docId);
			const copies = res.data || [];

			// Check if already added, try to find another available copy that is not in selectedCopies
			const availableCopy = copies.find((c: any) => c.status === 'available' && !selectedCopies.some((sc) => sc.copy_code === c.copy_code));

			if (!availableCopy) {
				if (copies.some((c: any) => c.status === 'available')) {
					message.warning('Bạn đã thêm tất cả các bản sao khả dụng của sách này!');
				} else {
					message.error('Sách này hiện không còn bản sao nào khả dụng!');
				}
				return;
			}

			// Limit check
			if (selectedReader) {
				const maxBooks = selectedReader.max_books_allowed ?? 5;
				const currentBorrowed = selectedReader.active_borrows_count ?? 0;
				if (currentBorrowed + selectedCopies.length >= maxBooks) {
					message.error(`Giới hạn mượn của độc giả là ${maxBooks} cuốn (Đang mượn: ${currentBorrowed}, Trong phiếu: ${selectedCopies.length}). Không thể thêm.`);
					setSearchingCopy(false);
					return;
				}
			}

			// Add the first available copy
			setSelectedCopies((prev) => [...prev, {
				id: availableCopy.id,
				copy_code: availableCopy.copy_code,
				document_title: option.title,
				author: option.author,
				status: availableCopy.status,
				condition: availableCopy.condition,
			}]);
			message.success(`Đã thêm: ${option.title} (Mã: ${availableCopy.copy_code})`);
			setBookKeyword('');
		} catch (err) {
			message.error('Lỗi khi lấy thông tin bản sao!');
		} finally {
			setSearchingCopy(false);
		}
	};

	// Mở modal xác nhận
	const handleOpenConfirm = () => {
		if (!selectedReader) {
			message.warning('Vui lòng chọn độc giả!');
			return;
		}
		if (selectedCopies.length === 0) {
			message.warning('Vui lòng thêm ít nhất 1 cuốn sách!');
			return;
		}
		setIsConfirmModalVisible(true);
	};

	// Xác nhận cho mượn
	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			await createBorrowLibrarian({
				reader_id: selectedReader.id,
				copy_codes: selectedCopies.map((c) => c.copy_code),
			});
			message.success(`✅ Tạo phiếu mượn thành công cho: ${selectedReader?.username}`);
			setSelectedCopies([]);
			setSelectedReader(null);
			setIsConfirmModalVisible(false);
			refreshActiveBorrows();
		} catch (err: any) {
			message.error(getApiError(err, 'Tạo phiếu mượn thất bại!'));
		} finally {
			setSubmitting(false);
		}
	};

	const borrowColumns: any = [
		{ title: 'Độc giả', dataIndex: 'reader_username', key: 'reader_username', align: 'center', render: (v: string) => <strong>{v}</strong> },
		{ title: 'Email', dataIndex: 'reader_email', key: 'reader_email', align: 'center', render: (v: string) => <Text type='secondary'>{v}</Text> },
		{ title: 'Ngày mượn', dataIndex: 'borrow_date', key: 'borrow_date', align: 'center', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
		{
			title: 'Hạn trả',
			dataIndex: 'due_date',
			key: 'due_date',
			align: 'center',
			render: (v: string) => {
				const isOverdue = dayjs(v).isBefore(dayjs());
				return <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>{dayjs(v).format('DD/MM/YYYY')}</span>;
			},
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			align: 'center',
			render: (v: string) => {
				const map: any = {
					borrowed: { label: 'Đang mượn', color: 'processing' },
					returned: { label: 'Đã trả', color: 'success' },
					pending: { label: 'Chờ duyệt', color: 'warning' },
					overdue: { label: 'Quá hạn', color: 'error' }
				};
				return <Tag color={map[v]?.color || 'default'}>{map[v]?.label || v}</Tag>;
			},
		},
		{ title: 'Số cuốn', dataIndex: 'item_count', key: 'item_count', align: 'center', render: (v: number) => `${v} cuốn` },
		{
			title: 'Hành động',
			key: 'action',
			align: 'center',
			render: (_: any, record: any) => (
				<Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
					Chi tiết
				</Button>
			)
		}
	];

	const copiesColumns: any = [
		{
			title: 'Mã vạch',
			dataIndex: 'copy_code',
			key: 'copy_code',
			width: 120,
			align: 'center',
			render: (val: string) => <Tag>{val}</Tag>,
		},
		{
			title: 'Tên sách',
			dataIndex: 'document_title',
			key: 'document_title',
			align: 'center',
		},
		{
			title: 'Tác giả',
			dataIndex: 'author',
			key: 'author',
			align: 'center',
			render: (val?: string) => val || '—',
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			width: 120,
			align: 'center',
			render: (val: string) => (
				<Tag color={val === 'available' ? 'success' : 'default'}>
					{val === 'available' ? 'Khả dụng' : val}
				</Tag>
			),
		},
		{
			title: 'Hành động',
			key: 'action',
			width: 90,
			align: 'center' as const,
			render: (_: any, record: CopyInfo) => (
				<Tooltip title='Xóa khỏi danh sách'>
					<Button
						type='text'
						danger
						icon={<DeleteOutlined />}
						onClick={() => setSelectedCopies((prev) => prev.filter((c) => c.copy_code !== record.copy_code))}
					/>
				</Tooltip>
			),
		},
	];

	return (
		<div>
			<Row gutter={24}>
				{/* Cột Trái: Chọn Độc giả và Nhập sách */}
				<Col xs={24} md={9} lg={8}>
					<ReaderSelector selectedReader={selectedReader} onSelectReader={setSelectedReader} />
					
					{selectedReader && (
						<div style={{ marginTop: 24 }}>
							<div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, display: 'flex', alignItems: 'center' }}>
								<SearchOutlined style={{ marginRight: 6 }} /> Chọn sách cho mượn
							</div>
							<div className='tt-checkin-input-row'>
								<Select
									showSearch
									size='large'
									className='w-100'
									style={{ width: '100%' }}
									placeholder='Tìm kiếm sách theo tên...'
									filterOption={false}
									onSearch={setBookKeyword}
									loading={searchingBook || searchingCopy}
									value={null}
									notFoundContent={
										bookKeyword.length < 2 ? (
											<Text type='secondary'>Nhập ít nhất 2 ký tự...</Text>
										) : searchingBook ? (
											<Spin size='small' />
										) : (
											<Empty description='Không tìm thấy sách' />
										)
									}
									onSelect={handleSelectBook}
								>
									{(booksData || []).map((b: any) => (
										<Option key={String(b.id)} value={String(b.id)} title={b.title} author={b.author}>
											<div style={{ display: 'flex', justifyContent: 'space-between' }}>
												<div>
													<span style={{ fontWeight: 500 }}>{b.title}</span>
													<Text type='secondary' style={{ marginLeft: 8, fontSize: 12 }}>
														{b.author}
													</Text>
												</div>
												<Text type={b.available_copies > 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
													Khả dụng: {b.available_copies}
												</Text>
											</div>
										</Option>
									))}
								</Select>
							</div>
						</div>
					)}
				</Col>

				{/* Cột Phải: Sách được chọn */}
				<Col xs={24} md={15} lg={16}>
					<div style={{ marginBottom: 20 }}>
						{!selectedReader ? (
							<div style={{ padding: '40px 0', textAlign: 'center', background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9' }}>
								<Empty description="Vui lòng chọn độc giả trước" />
							</div>
						) : (
							<div>
								<div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>
									Sách được chọn ({selectedCopies.length})
								</div>
								<Table
									className="library-responsive-table"
									dataSource={selectedCopies}
									columns={makeResponsiveColumns(copiesColumns)}
									rowKey='copy_code'
									pagination={false}
									locale={{ emptyText: <Empty description='Chưa có sách nào' /> }}
									style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
									size='middle'
								/>
							</div>
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
					{selectedCopies.length > 0 && (
						<Text strong style={{ fontSize: 15 }}>
							Tổng số sách: <span style={{ color: '#c90000', fontSize: 16 }}>{selectedCopies.length}</span> cuốn
							<span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
							Ngày phải trả dự kiến: <span style={{ color: '#c90000' }}>{moment().add(14, 'days').format('DD/MM/YYYY')}</span>
						</Text>
					)}
					{!selectedReader && selectedCopies.length > 0 && (
						<div style={{ color: '#faad14', marginTop: 4, fontSize: 13 }}>
							⚠️ Vui lòng chọn độc giả trước khi xác nhận
						</div>
					)}
				</div>
				<div>
					<Button
						type='primary'
						size='large'
						icon={<CheckCircleOutlined />}
						onClick={handleOpenConfirm}
						disabled={selectedCopies.length === 0}
						className='btn-primary-danger'
						style={{ minWidth: 200, height: 48, fontSize: 16, fontWeight: 600 }}
					>
						XÁC NHẬN CHO MƯỢN
					</Button>
				</div>
			</div>

			{/* Modal Xác nhận phiếu mượn */}
			<Modal
				title={
					<div style={{ fontSize: 18, fontWeight: 600, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
						Xác nhận phiếu mượn
					</div>
				}
				visible={isConfirmModalVisible}
				onOk={handleSubmit}
				onCancel={() => setIsConfirmModalVisible(false)}
				confirmLoading={submitting}
				okText="Xác nhận"
				cancelText="Hủy"
				okButtonProps={{ className: 'btn-primary-danger', size: 'large' }}
				cancelButtonProps={{ size: 'large' }}
				width={600}
				centered
			>
				{selectedReader && (
					<div style={{ marginBottom: 16 }}>
						<Text type="secondary">Độc giả:</Text>
						<div style={{ fontWeight: 500, fontSize: 16, marginTop: 4 }}>
							{selectedReader.username} <Text type="secondary" style={{ fontSize: 14 }}>({selectedReader.email})</Text>
						</div>
					</div>
				)}
				<div style={{ marginBottom: 16 }}>
					<Text type="secondary">Danh sách sách mượn ({selectedCopies.length} cuốn):</Text>
					<div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
						{selectedCopies.map((c, index) => (
							<div key={c.copy_code} style={{
								padding: '8px 12px',
								borderBottom: index < selectedCopies.length - 1 ? '1px solid #f0f0f0' : 'none',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}>
								<div>
									<div style={{ fontWeight: 500 }}>{c.document_title}</div>
									<div style={{ fontSize: 12, color: '#8c8c8c' }}>{c.author}</div>
								</div>
								<Tag>{c.copy_code}</Tag>
							</div>
						))}
					</div>
				</div>
				<div style={{ backgroundColor: '#fffbe6', padding: '12px 16px', borderRadius: 6, border: '1px solid #ffe58f' }}>
					<Text strong>Ngày phải trả dự kiến:</Text>{' '}
					<Text strong style={{ color: '#d46b08', fontSize: 16 }}>
						{moment().add(14, 'days').format('DD/MM/YYYY')}
					</Text>
				</div>
			</Modal>

			{/* Danh sách phiếu mượn vừa tạo */}
			<div style={{ marginTop: 32 }}>
				<div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>
					Phiếu mượn vừa tạo
				</div>
				<Table
					className="library-responsive-table"
					dataSource={activeBorrows || []}
					columns={makeResponsiveColumns(borrowColumns)}
					loading={borrowsLoading}
					rowKey={(r: any) => String(r.id)}
					scroll={{ x: 700 }}
					pagination={{ pageSize: 10, showSizeChanger: false }}
					locale={{ emptyText: <Empty description='Không có phiếu mượn nào' /> }}
					style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
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
							<Tag color={
								borrowDetail.status === 'borrowed' ? 'processing' :
								borrowDetail.status === 'returned' ? 'success' :
								borrowDetail.status === 'pending' ? 'warning' :
								borrowDetail.status === 'overdue' ? 'error' : 'default'
							}>
								{borrowDetail.status === 'borrowed' ? 'Đang mượn' :
								 borrowDetail.status === 'returned' ? 'Đã trả' :
								 borrowDetail.status === 'pending' ? 'Chờ duyệt' :
								 borrowDetail.status === 'overdue' ? 'Quá hạn' : borrowDetail.status}
							</Tag>
						</div>

						<Text strong>Danh sách sách mượn ({borrowDetail.items?.length || 0} cuốn):</Text>
						<Table
							className="library-responsive-table"
							dataSource={borrowDetail.items || []}
							rowKey="id"
							pagination={false}
							size="small"
							style={{ marginTop: 8 }}
							columns={makeResponsiveColumns([
								{ title: 'Mã vạch', dataIndex: 'copy_code', align: 'center', render: (v: string) => <Tag>{v}</Tag> },
								{ title: 'Tên sách', dataIndex: 'document_title', align: 'center' },
								{
									title: 'Trạng thái',
									dataIndex: 'status',
									align: 'center',
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
									align: 'center',
									render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—'
								}
							])}
						/>
					</div>
				) : (
					<Empty description="Không tìm thấy thông tin phiếu mượn" />
				)}
			</Modal>
		</div>
	);
};

export default CheckoutTab;
