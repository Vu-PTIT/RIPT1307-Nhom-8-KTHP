import React, { useEffect, useState } from 'react';
import { Button, Empty, message, Spin, Form, Input, Select, Upload, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as ThuThuService from '@/services/ThuThu';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';

export default function BookDetailManagePage(props: any) {
	const id = props?.match?.params?.id;
	const [document, setDocument] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [editLoading, setEditLoading] = useState(false);
	const [editForm] = Form.useForm();
	const [fileList, setFileList] = useState<any[]>([]);

	const [previewImage, setPreviewImage] = useState<string>('');

	const { data: categoriesRes } = useRequest(TaiLieuService.getCategories, {
		formatResult: (res) => res.data || [],
	});
	const categories: any[] = categoriesRes || [];

	const load = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await TaiLieuService.getDocumentDetail(id);
			const doc = res.data?.data || res.data || null;
			setDocument(doc);
			if (doc) {
				editForm.setFieldsValue({
					title: doc.title,
					author: doc.author,
					isbn: doc.isbn,
					description: doc.description,
					category_id: doc.category?.id || doc.category_id,
				});
			}
		} catch (e) {
			message.error('Không tải được chi tiết tài liệu');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id]);

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
			if (fileList.length > 0 && fileList[0].originFileObj) {
				await ThuThuService.uploadCover(document.id, fileList[0].originFileObj);
			}
			message.success('Đã cập nhật thông tin sách!');
			setFileList([]);
			setPreviewImage('');
			load(); // Refresh details
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Cập nhật thất bại!');
		} finally {
			setEditLoading(false);
		}
	};

	const getCoverUrl = () => {
		let cover = document?.cover_image || getCoverForTitle(document?.title) || document?.thumbnail || '/default-cover.png';
		const objIdRegex = /^[a-fA-F0-9]{24}$/;
		if (typeof cover === 'string' && objIdRegex.test(cover)) {
			cover = `${ipLibrary}/documents/covers/${cover}`;
		}
		return cover;
	};

	return (
		<PageSkeleton title='Chi tiết & Chỉnh sửa sách'>
			<div className='library-panel'>
				<Spin spinning={loading}>
					{!document ? (
						<div className='library-empty-state'>
							<Empty description='Không tìm thấy tài liệu' />
						</div>
					) : (
						<Form form={editForm} layout='vertical' onFinish={handleEdit}>
							<Row gutter={[32, 32]}>
								<Col xs={24} md={8} lg={6}>
									<div style={{ textAlign: 'center', marginBottom: 24 }}>
										<Upload
											showUploadList={false}
											maxCount={1}
											beforeUpload={() => false}
											onChange={({ fileList }) => {
												setFileList(fileList);
												if (fileList.length > 0 && fileList[0].originFileObj) {
													const reader = new FileReader();
													reader.onload = (e) => setPreviewImage(e.target?.result as string);
													reader.readAsDataURL(fileList[0].originFileObj);
												} else {
													setPreviewImage('');
												}
											}}
											accept="image/*"
										>
											<div className='library-detail-cover' style={{ cursor: 'pointer', position: 'relative' }}>
												<img 
													alt={document.title} 
													src={previewImage || getCoverUrl()} 
													style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
												/>
												<div style={{
													position: 'absolute',
													bottom: 0, left: 0, right: 0,
													background: 'rgba(0,0,0,0.6)',
													color: '#fff',
													padding: '12px 0',
													borderBottomLeftRadius: 8,
													borderBottomRightRadius: 8,
													fontSize: 14,
													fontWeight: 500,
													backdropFilter: 'blur(4px)',
												}}>
													<UploadOutlined style={{ marginRight: 6 }} /> Thay đổi ảnh bìa
												</div>
											</div>
										</Upload>
									</div>
								</Col>
								<Col xs={24} md={16} lg={18}>
									<div style={{ padding: '0 12px' }}>
										<div style={{ display: 'flex', gap: '16px', marginBottom: 16, flexWrap: 'wrap' }}>
											<div style={{ flex: '1 1 200px' }}>
												<Form.Item name='title' label='Tên sách' rules={[{ required: true }]}>
													<Input size='large' />
												</Form.Item>
											</div>
											<div style={{ flex: '1 1 200px' }}>
												<Form.Item name='author' label='Tác giả' rules={[{ required: true }]}>
													<Input size='large' />
												</Form.Item>
											</div>
										</div>
										
										<div style={{ display: 'flex', gap: '16px', marginBottom: 16, flexWrap: 'wrap' }}>
											<div style={{ flex: '1 1 200px' }}>
												<Form.Item name='isbn' label='ISBN'>
													<Input size='large' />
												</Form.Item>
											</div>
											<div style={{ flex: '1 1 200px' }}>
												{categories.length > 0 && (
													<Form.Item name='category_id' label='Danh mục'>
														<Select size='large' placeholder='Chọn danh mục'>
															{categories.map((c) => (
																<Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
															))}
														</Select>
													</Form.Item>
												)}
											</div>
										</div>

										<Form.Item name='description' label='Mô tả'>
											<Input.TextArea rows={4} />
										</Form.Item>

										<div style={{ display: 'flex', gap: '32px', marginBottom: 24 }}>
											<div>
												<span style={{ color: '#888' }}>Tổng số bản: </span>
												<strong style={{ fontSize: 16 }}>{document.total_copies ?? 0}</strong>
											</div>
											<div>
												<span style={{ color: '#888' }}>Bản còn lại: </span>
												<strong style={{ fontSize: 16, color: Number(document.available_copies) > 0 ? '#52c41a' : '#f5222d' }}>
													{document.available_copies ?? 0}
												</strong>
											</div>
										</div>

										<Divider />

										<div style={{ display: 'flex', gap: '12px' }}>
											<Button
												type='primary'
												htmlType='submit'
												icon={<SaveOutlined />}
												loading={editLoading}
												className='btn-primary-danger'
											>
												Lưu thay đổi
											</Button>
											<Button icon={<ArrowLeftOutlined />} onClick={() => history.push(history.location.pathname.split('/').slice(0, -1).join('/'))}>
												Quay lại danh sách
											</Button>
										</div>
									</div>
								</Col>
							</Row>
						</Form>
					)}
				</Spin>
			</div>
		</PageSkeleton>
	);
}
