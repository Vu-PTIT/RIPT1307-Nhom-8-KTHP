import React, { useState, useRef } from 'react';
import {
	Input, Typography, Table, Button, Space, Tag, message, Modal, Form,
	Select, Spin, Empty, InputRef, Tooltip, Avatar, Row, Col
} from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import { searchCopyByCode, searchReaders, createBorrowLibrarian, getDocumentCopies } from '@/services/ThuThu';
import { searchDocuments } from '@/services/TaiLieu';
import { getApiError } from '@/utils/getApiError';
import moment from 'moment';

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

const CheckoutTab: React.FC = () => {
	const [selectedCopies, setSelectedCopies] = useState<CopyInfo[]>([]);
	const [searchingCopy, setSearchingCopy] = useState(false);

	// Reader search state
	const [readerKeyword, setReaderKeyword] = useState('');
	const [selectedReader, setSelectedReader] = useState<{ id: string; username: string; email: string } | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

	// Tìm reader
	const { data: readersData, loading: searchingReader } = useRequest(
		() => searchReaders({ keyword: readerKeyword, page_size: 10 }),
		{
			refreshDeps: [readerKeyword],
			debounceInterval: 400,
			ready: readerKeyword.length >= 2,
			formatResult: (res) => res.data?.items || [],
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
			setReaderKeyword('');
			setIsConfirmModalVisible(false);
		} catch (err: any) {
			message.error(getApiError(err, 'Tạo phiếu mượn thất bại!'));
		} finally {
			setSubmitting(false);
		}
	};


	const copiesColumns = [
		{
			title: 'Mã vạch',
			dataIndex: 'copy_code',
			key: 'copy_code',
			width: 120,
			render: (val: string) => <Tag>{val}</Tag>,
		},
		{
			title: 'Tên sách',
			dataIndex: 'document_title',
			key: 'document_title',
		},
		{
			title: 'Tác giả',
			dataIndex: 'author',
			key: 'author',
			render: (val?: string) => val || '—',
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			width: 120,
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
				{/* Cột Trái: Chọn Độc giả */}
				<Col xs={24} md={9} lg={8}>
					<div className='tt-checkout-section'>
						<div className='tt-section-title'>
							<UserOutlined /> Độc giả
						</div>
						{selectedReader ? (
						<div className='tt-reader-selected'>
							<Avatar className='tt-reader-avatar' size="large">
								{selectedReader.username.charAt(0).toUpperCase()}
							</Avatar>
							<div className='tt-reader-info' style={{ flex: 1 }}>
								<div className='name'>{selectedReader.username}</div>
								<div className='email'>{selectedReader.email}</div>
							</div>
							<Button size='small' type='text' danger onClick={() => setSelectedReader(null)}>
								Đổi
							</Button>
						</div>

						) : (
							<Select
								showSearch
								size='large'
								className='w-100'
								placeholder='Tìm kiếm theo tên hoặc email độc giả...'
								filterOption={false}
								onSearch={setReaderKeyword}
								loading={searchingReader}
								notFoundContent={
									readerKeyword.length < 2 ? (
										<Text type='secondary'>Nhập ít nhất 2 ký tự...</Text>
									) : searchingReader ? (
										<Spin size='small' />
									) : (
										<Empty description='Không tìm thấy' />
									)
								}
								onSelect={(_: string, opt: any) => {
									setSelectedReader({ id: opt.value, username: opt.username, email: opt.email });
									setReaderKeyword('');
								}}
							>
								{(readersData || []).map((r: any) => (
									<Option key={String(r.id)} value={String(r.id)} username={r.username} email={r.email}>
										<div>
											<span style={{ fontWeight: 500 }}>{r.username}</span>
											<Text type='secondary' style={{ marginLeft: 8, fontSize: 12 }}>
												{r.email}
											</Text>
										</div>
									</Option>
								))}
							</Select>
						)}
					</div>
				</Col>

				{/* Cột Phải: Chọn sách */}
				<Col xs={24} md={15} lg={16}>
					<div style={{ marginBottom: 20 }}>
						<div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, display: 'flex', alignItems: 'center' }}>
							<SearchOutlined style={{ marginRight: 6 }} /> Chọn sách cho mượn
						</div>
						<div className='tt-checkin-input-row'>
							<Select
								showSearch
								size='large'
								className='w-100'
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
				</Col>
			</Row>

			{/* Danh sách sách đã chọn */}
			<div style={{ marginTop: 12 }}>
				<div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
					Sách được chọn ({selectedCopies.length})
				</div>
				<Table
					dataSource={selectedCopies}
					columns={copiesColumns}
					rowKey='copy_code'
					pagination={false}
					locale={{ emptyText: <Empty description='Chưa có sách nào' /> }}
					style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
					size='middle'
				/>
			</div>

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
		</div>
	);
};

export default CheckoutTab;
