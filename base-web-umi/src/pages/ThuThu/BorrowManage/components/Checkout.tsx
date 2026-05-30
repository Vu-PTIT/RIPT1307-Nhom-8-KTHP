import React, { useState, useRef } from 'react';
import {
	Input, Typography, Table, Button, Space, Tag, message, Modal, Form,
	Select, Spin, Empty, InputRef, Tooltip, Avatar,
} from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import { searchCopyByCode, searchReaders, createBorrowLibrarian } from '@/services/ThuThu';
import { getApiError } from '@/utils/getApiError';
import dayjs from 'dayjs';


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
	const barcodeRef = useRef<InputRef>(null);
	const [barcodeInput, setBarcodeInput] = useState('');
	const [selectedCopies, setSelectedCopies] = useState<CopyInfo[]>([]);
	const [searchingCopy, setSearchingCopy] = useState(false);

	// Reader search state
	const [readerKeyword, setReaderKeyword] = useState('');
	const [selectedReader, setSelectedReader] = useState<{ id: string; username: string; email: string } | null>(null);
	const [submitting, setSubmitting] = useState(false);

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

	// Quét mã vạch / nhập mã
	const handleBarcodeSearch = async () => {
		const code = barcodeInput.trim();
		if (!code) return;
		if (selectedCopies.some((c) => c.copy_code === code)) {
			message.warning('Mã vạch này đã được thêm!');
			setBarcodeInput('');
			return;
		}
		setSearchingCopy(true);
		try {
			const res = await searchCopyByCode(code);
			const copy: CopyInfo = res.data;
			if (copy.status !== 'available') {
				message.error(`Bản sao "${code}" hiện không khả dụng (${copy.status})`);
			} else {
				setSelectedCopies((prev) => [...prev, copy]);
				message.success(`Đã thêm: ${copy.document_title}`);
			}
		} catch {
			message.error(`Không tìm thấy bản sao với mã: "${code}"`);
		} finally {
			setSearchingCopy(false);
			setBarcodeInput('');
			barcodeRef.current?.focus();
		}
	};

	// Xác nhận cho mượn
	const handleSubmit = async () => {
		if (!selectedReader) {
			message.warning('Vui lòng chọn độc giả!');
			return;
		}
		if (selectedCopies.length === 0) {
			message.warning('Vui lòng thêm ít nhất 1 cuốn sách!');
			return;
		}
		setSubmitting(true);
		try {
			await createBorrowLibrarian({
				reader_id: selectedReader.id,
				copy_codes: selectedCopies.map((c) => c.copy_code),
			});
			message.success(`✅ Tạo phiếu mượn thành công cho: ${selectedReader.username}`);
			setSelectedCopies([]);
			setSelectedReader(null);
			setReaderKeyword('');
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
			title: '',
			key: 'action',
			width: 60,
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
			{/* Chọn Độc giả */}
			<div className='tt-checkout-section'>
				<div className='tt-section-title'>
					<UserOutlined /> Độc giả
				</div>
				{selectedReader ? (
				<div className='tt-reader-selected'>
					<Avatar className='tt-reader-avatar'>
						{selectedReader.username.charAt(0).toUpperCase()}
					</Avatar>
					<div className='tt-reader-info'>
						<div className='name'>{selectedReader.username}</div>
						<div className='email'>{selectedReader.email}</div>
					</div>
					<Button size='small' type='text' danger onClick={() => setSelectedReader(null)} style={{ marginLeft: 'auto' }}>
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

			{/* Quét / nhập mã vạch */}
			<div style={{ marginBottom: 20 }}>
				<div style={{ fontWeight: 600, marginBottom: 8 }}>
					<SearchOutlined style={{ marginRight: 6 }} /> Thêm sách bằng mã vạch
				</div>
				<div className='tt-checkin-input-row'>
					<Input
						ref={barcodeRef}
						size='large'
						placeholder='Quét mã vạch hoặc nhập mã bản sao...'
						value={barcodeInput}
						onChange={(e) => setBarcodeInput(e.target.value)}
						onPressEnter={handleBarcodeSearch}
					/>
					<Button
						type='primary'
						size='large'
						icon={<PlusOutlined />}
						onClick={handleBarcodeSearch}
						loading={searchingCopy}
						className='btn-primary-danger'
					>
						Thêm
					</Button>
				</div>

			</div>

			{/* Danh sách sách đã chọn */}
			<div style={{ marginTop: 4 }}>
				<div style={{ fontWeight: 600, marginBottom: 8 }}>
					Sách được chọn ({selectedCopies.length})
				</div>
				<Table
					dataSource={selectedCopies}
					columns={copiesColumns}
					rowKey='copy_code'
					pagination={false}
					locale={{ emptyText: <Empty description='Chưa có sách nào' /> }}
					style={{ borderRadius: 8, overflow: 'hidden' }}
					size='small'
				/>
			</div>

			{/* Nút xác nhận */}
			{selectedCopies.length > 0 && (
				<div style={{ marginTop: 20, textAlign: 'right' }}>
					<Button
						type='primary'
						size='large'
						icon={<CheckCircleOutlined />}
						loading={submitting}
						onClick={handleSubmit}
						disabled={!selectedReader}
						className='btn-primary-danger'
					>
						Xác nhận cho mượn ({selectedCopies.length} cuốn)
					</Button>
					{!selectedReader && (
						<div style={{ color: '#faad14', marginTop: 8, fontSize: 13 }}>
							⚠️ Vui lòng chọn độc giả trước khi xác nhận
						</div>
					)}
				</div>
			)}

		</div>
	);
};

export default CheckoutTab;
