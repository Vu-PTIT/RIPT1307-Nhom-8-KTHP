import React, { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, message, Spin, Tag, Modal, Form, Input, Select } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as ThuThuService from '@/services/ThuThu';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';
import DocumentDetailView from '@/components/DocumentDetailView';

export default function BookDetailManagePage(props: any) {
	const id = props?.match?.params?.id;
	const [document, setDocument] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	// Modal Sửa sách
	const [editVisible, setEditVisible] = useState(false);
	const [editLoading, setEditLoading] = useState(false);
	const [editForm] = Form.useForm();

	const { data: categoriesRes } = useRequest(TaiLieuService.getCategories, {
		formatResult: (res) => res.data || [],
	});
	const categories: any[] = categoriesRes || [];

	const load = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await TaiLieuService.getDocumentDetail(id);
			setDocument(res.data?.data || res.data || null);
		} catch (e) {
			message.error('Không tải được chi tiết tài liệu');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id]);

	const openEditModal = () => {
		editForm.setFieldsValue({
			title: document?.title,
			author: document?.author,
			isbn: document?.isbn,
			description: document?.description,
			category_id: document?.category?.id || document?.category_id,
		});
		setEditVisible(true);
	};

	const handleEdit = async (values: any) => {
		if (!document?.id) return;
		setEditLoading(true);
		try {
			await ThuThuService.updateDocument(document.id, {
				title: values.title,
				author: values.author,
				isbn: values.isbn,
				description: values.description,
				category_id: values.category_id,
			});
			message.success('Đã cập nhật thông tin sách!');
			setEditVisible(false);
			load(); // Refresh details
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Cập nhật thất bại!');
		} finally {
			setEditLoading(false);
		}
	};

	return (
		<PageSkeleton title='Chi tiết & Chỉnh sửa sách'>
			<DocumentDetailView
				document={document}
				loading={loading}
				actions={
					<>
						<Button
							type='primary'
							icon={<EditOutlined />}
							onClick={openEditModal}
						>
							Sửa thông tin sách
						</Button>
						<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/thu-thu/kho-sach')}>
							Quay lại danh sách
						</Button>
					</>
				}
			/>

			{/* Modal Sửa sách */}
			<Modal
				title={<><EditOutlined style={{ marginRight: 8 }} />Chi tiết & Chỉnh sửa sách</>}
				visible={editVisible}
				onCancel={() => setEditVisible(false)}
				onOk={() => editForm.submit()}
				okText='Lưu thay đổi'
				cancelText='Hủy'
				confirmLoading={editLoading}
				okButtonProps={{ className: 'btn-primary-danger' }}
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
		</PageSkeleton>
	);
}
