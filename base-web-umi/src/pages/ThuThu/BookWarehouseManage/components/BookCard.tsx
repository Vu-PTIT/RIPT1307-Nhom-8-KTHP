import React, { useState } from 'react';
import {
	Button, Tooltip, Modal, Form,
	Input, Select, message, Popconfirm,
} from 'antd';
import {
	InfoCircleOutlined, PlusOutlined, EditOutlined,
	DeleteOutlined, CopyOutlined,
} from '@ant-design/icons';
import * as ThuThuService from '@/services/ThuThu';
import DocumentCard from '@/components/DocumentCard';

export interface BookData {
	id: string;
	title: string;
	author: string;
	category: string;
	availableCount: number;
	totalCount?: number;
	image: string;
	isbn?: string;
	description?: string;
	category_id?: string;
}

interface BookCardProps {
	book: BookData;
	categories?: { id: string; name: string }[];
	onDetail: (id: string) => void;
	onRefresh?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, categories = [], onDetail, onRefresh }) => {
	const isOutOfStock = book.availableCount === 0;

	// Modal Thêm bản sao
	const [addCopyVisible, setAddCopyVisible] = useState(false);
	const [addCopyLoading, setAddCopyLoading] = useState(false);
	const [addCopyForm] = Form.useForm();

	// Modal Sửa sách
	const [editVisible, setEditVisible] = useState(false);
	const [editLoading, setEditLoading] = useState(false);
	const [editForm] = Form.useForm();

	const handleAddCopy = async (values: any) => {
		setAddCopyLoading(true);
		try {
			await ThuThuService.addDocumentCopy(book.id, {
				copy_code: values.copy_code,
				condition: values.condition || 'good',
			});
			message.success(`Đã thêm bản sao "${values.copy_code}" vào "${book.title}"`);
			setAddCopyVisible(false);
			addCopyForm.resetFields();
			onRefresh?.();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Thêm bản sao thất bại!');
		} finally {
			setAddCopyLoading(false);
		}
	};

	const handleEdit = async (values: any) => {
		setEditLoading(true);
		try {
			await ThuThuService.updateDocument(book.id, {
				title: values.title,
				author: values.author,
				isbn: values.isbn,
				description: values.description,
				category_id: values.category_id,
			});
			message.success('Đã cập nhật thông tin sách!');
			setEditVisible(false);
			onRefresh?.();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Cập nhật thất bại!');
		} finally {
			setEditLoading(false);
		}
	};

	const handleDelete = async () => {
		try {
			await ThuThuService.deleteDocument(book.id);
			message.success(`Đã xóa sách "${book.title}"`);
			onRefresh?.();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Xóa thất bại!');
		}
	};

	const openEditModal = () => {
		editForm.setFieldsValue({
			title: book.title,
			author: book.author,
			isbn: book.isbn,
			description: book.description,
			category_id: book.category_id,
		});
		setEditVisible(true);
	};

	return (
		<>
			<DocumentCard
				item={{
					id: book.id,
					title: book.title,
					author: book.author,
					category_name: book.category,
					available_copies: book.availableCount,
					cover_image: book.image,
				}}
				onDetail={openEditModal}
				actions={[
					<Button
						key="detail"
						className="detail-btn small"
						onClick={openEditModal}
					>
						<InfoCircleOutlined /> Chi tiết & Sửa
					</Button>,
					<Tooltip title='Thêm bản sao mới' key="add">
						<Button
							className="icon-btn"
							icon={<PlusOutlined />}
							onClick={() => setAddCopyVisible(true)}
						/>
					</Tooltip>,
					<Tooltip title='Xóa đầu sách' key="delete">
						<Popconfirm
							title={`Xóa sách "${book.title}"?`}
							description='Xóa tất cả bản sao và không thể hoàn tác!'
							onConfirm={handleDelete}
							okText='Xóa'
							cancelText='Hủy'
							okButtonProps={{ danger: true }}
						>
							<Button danger className="icon-btn remove-btn" icon={<DeleteOutlined />} />
						</Popconfirm>
					</Tooltip>
				]}
			/>

			{/* Modal Thêm bản sao */}
			<Modal
				title={<><CopyOutlined style={{ marginRight: 8 }} />Thêm bản sao — {book.title}</>}
				open={addCopyVisible}
				onCancel={() => { setAddCopyVisible(false); addCopyForm.resetFields(); }}
				onOk={() => addCopyForm.submit()}
				okText='Thêm bản sao'
				cancelText='Hủy'
				confirmLoading={addCopyLoading}
				okButtonProps={{ style: { background: '#e3000f', borderColor: '#e3000f' } }}
			>
				<Form form={addCopyForm} layout='vertical' onFinish={handleAddCopy} style={{ marginTop: 16 }}>
					<Form.Item
						name='copy_code'
						label='Mã bản sao (barcode)'
						rules={[{ required: true, message: 'Vui lòng nhập mã bản sao!' }]}
					>
						<Input placeholder='Ví dụ: TL001-001' size='large' />
					</Form.Item>
					<Form.Item name='condition' label='Tình trạng' initialValue='good'>
						<Select size='large'>
							<Select.Option value='good'>Tốt</Select.Option>
							<Select.Option value='fair'>Khá</Select.Option>
							<Select.Option value='damaged'>Hỏng</Select.Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal Sửa sách */}
			<Modal
				title={<><EditOutlined style={{ marginRight: 8 }} />Chi tiết & Chỉnh sửa sách</>}
				open={editVisible}
				onCancel={() => setEditVisible(false)}
				onOk={() => editForm.submit()}
				okText='Lưu thay đổi'
				cancelText='Hủy'
				confirmLoading={editLoading}
				okButtonProps={{ style: { background: '#e3000f', borderColor: '#e3000f' } }}
				width={600}
			>
				<Form form={editForm} layout='vertical' onFinish={handleEdit} style={{ marginTop: 16 }}>
					<Form.Item name='title' label='Tên sách' rules={[{ required: true }]}>
						<Input size='large' />
					</Form.Item>
					<Form.Item name='author' label='Tác giả' rules={[{ required: true }]}>
						<Input size='large' />
					</Form.Item>
					<Form.Item name='isbn' label='ISBN'>
						<Input size='large' />
					</Form.Item>
					{categories.length > 0 && (
						<Form.Item name='category_id' label='Danh mục'>
							<Select size='large' placeholder='Chọn danh mục'>
								{categories.map((c) => (
									<Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
								))}
							</Select>
						</Form.Item>
					)}
					<Form.Item name='description' label='Mô tả'>
						<Input.TextArea rows={3} />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
};

export default BookCard;
