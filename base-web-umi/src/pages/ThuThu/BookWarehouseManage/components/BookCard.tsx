import React, { useState } from 'react';
import {
	Button, Tooltip, Modal, Form,
	Input, InputNumber, Select, message, Popconfirm,
} from 'antd';
import {
	InfoCircleOutlined, PlusOutlined, DeleteOutlined, CopyOutlined,
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

	const handleAddCopy = async (values: any) => {
		setAddCopyLoading(true);
		try {
			await ThuThuService.addDocumentCopy(book.id, {
				quantity: values.quantity || 1,
				condition: values.condition || 'good',
			});
			message.success(`Đã thêm ${values.quantity} bản sao vào "${book.title}"`);
			setAddCopyVisible(false);
			addCopyForm.resetFields();
			onRefresh?.();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Thêm bản sao thất bại!');
		} finally {
			setAddCopyLoading(false);
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
				onDetail={() => onDetail(book.id)}
				actions={[
					<Button
						key="detail"
						className="detail-btn small"
						onClick={() => onDetail(book.id)}
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
							title={`Xóa sách "${book.title}"? Tất cả bản sao sẽ bị xóa và không thể hoàn tác!`}
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
				visible={addCopyVisible}
				onCancel={() => { setAddCopyVisible(false); addCopyForm.resetFields(); }}
				onOk={() => addCopyForm.submit()}
				okText='Thêm bản sao'
				cancelText='Hủy'
				confirmLoading={addCopyLoading}
				okButtonProps={{ className: 'btn-primary-danger' }}
			>

				<Form form={addCopyForm} layout='vertical' onFinish={handleAddCopy} style={{ marginTop: 16 }}>
					<Form.Item
						name='quantity'
						label='Số lượng bản sao'
						rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                        initialValue={1}
					>
						<InputNumber min={1} max={100} style={{ width: '100%' }} size='large' />
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
		</>
	);
};

export default BookCard;
