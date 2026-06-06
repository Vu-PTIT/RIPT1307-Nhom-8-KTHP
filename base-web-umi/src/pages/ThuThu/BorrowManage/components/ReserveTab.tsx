import React, { useState } from 'react';
import { Card, Button, Tag, message, Empty, Typography, Popconfirm, Spin, Row, Col, Table, Avatar, Image } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import { getAllBorrowsLibrarian, confirmReservation, cancelReservation } from '@/services/ThuThu';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';

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

	const renderSlip = (record: any) => {
		const id = String(record.id);
		const isProcessing = processingId === id;
		const items = record.items || record.copy_codes?.map((code: string) => ({ copy_code: code, document_title: 'Đang tải...' })) || [];
		
		const avatarSrc = record.reader_avatar ? `${ipLibrary}/auth/avatars/${record.reader_avatar}` : undefined;
		const initial = (record.reader_username || 'U').charAt(0).toUpperCase();

		return (
			<Card
				key={id}
				style={{ marginBottom: 20, borderRadius: 8, borderColor: '#f0f0f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
						<Text strong style={{ fontSize: 16 }}>Phiếu đặt trước: {id.slice(-6).toUpperCase()}</Text>
					</div>
				}
				extra={
					<Text type="secondary" style={{ fontSize: 13 }}>
						Tạo lúc: {dayjs(record.created_at).format('DD/MM/YYYY HH:mm')}
					</Text>
				}
			>
				<Row gutter={[24, 16]}>
					<Col xs={24} md={8}>
						<div style={{ backgroundColor: '#fafafa', padding: 16, borderRadius: 6, height: '100%' }}>
							<div style={{ marginBottom: 16, fontWeight: 600 }}>
								<UserOutlined style={{ marginRight: 6 }} /> Thông tin độc giả
							</div>
							<div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
								{avatarSrc ? (
									<Avatar src={avatarSrc} size={50} />
								) : (
									<Avatar style={{ backgroundColor: '#87d068' }} size={50}>{initial}</Avatar>
								)}
								<div>
									<div style={{ marginBottom: 4 }}>
										<Text type="secondary">Tên:</Text> <Text strong>{record.reader_username}</Text>
									</div>
									<div>
										<Text type="secondary">Email:</Text> <Text>{record.reader_email}</Text>
									</div>
								</div>
							</div>
							<div style={{ marginBottom: 8 }}>
								<Text type="secondary">Dự kiến lấy:</Text> <Text strong style={{ color: '#1890ff' }}>{dayjs(record.borrow_date).format('DD/MM/YYYY')}</Text>
							</div>
							<div style={{ marginBottom: 8 }}>
								<Text type="secondary">Hạn trả:</Text> <Text strong style={{ color: '#d46b08' }}>{dayjs(record.due_date).format('DD/MM/YYYY')}</Text>
							</div>
						</div>
					</Col>
					
					<Col xs={24} md={16}>
						<div style={{ marginBottom: 12, fontWeight: 600 }}>
							<BookOutlined style={{ marginRight: 6 }} /> Danh sách sách mượn ({record.item_count} cuốn)
						</div>
						<Table
							dataSource={items}
							rowKey="copy_code"
							pagination={false}
							size="small"
							bordered
							columns={[
								{
									title: 'Ảnh',
									key: 'cover_image',
									width: 60,
									align: 'center',
									render: (_: any, itemRecord: any) => {
										const title = itemRecord.document_title;
										const mapped = getCoverForTitle(title);
										let cover = itemRecord.cover_image || mapped || '/default-cover.png';
										const objIdRegex = /^[a-fA-F0-9]{24}$/;
										if (typeof cover === 'string' && objIdRegex.test(cover)) {
											cover = `${ipLibrary}/documents/covers/${cover}`;
										}
										return cover ? (
											<Image src={cover} width={40} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} fallback='/default-cover.png' />
										) : (
											<div style={{ width: 40, height: 50, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: 4 }}>
												<BookOutlined style={{ color: '#bfbfbf' }} />
											</div>
										);
									}
								},
								{
									title: 'Mã vạch',
									dataIndex: 'copy_code',
									width: 120,
									align: 'center',
									render: (val: string) => <Tag color="blue">{val}</Tag>,
								},
								{
									title: 'Tên sách',
									dataIndex: 'document_title',
									align: 'center',
									render: (val: string) => <Text strong>{val}</Text>,
								},
								{
									title: 'Thể loại',
									dataIndex: 'category_name',
									align: 'center',
									render: (val: string) => val ? <Tag>{val}</Tag> : <Text type="secondary">—</Text>,
								},
								{
									title: 'Tác giả',
									dataIndex: 'author',
									align: 'center',
									render: (val: string) => val || <Text type="secondary">—</Text>,
								}
							]}
							style={{ marginBottom: 16 }}
						/>
						
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 'auto' }}>
							<Popconfirm
								title='Hủy đơn đặt trước này?'
								onConfirm={() => handleCancel(id)}
								okText='Hủy đơn'
								cancelText='Bỏ qua'
								okButtonProps={{ danger: true }}
							>
								<Button
									danger
									icon={<CloseCircleOutlined />}
									loading={isProcessing}
								>
									Hủy đơn
								</Button>
							</Popconfirm>
							<Button
								type='primary'
								icon={<CheckCircleOutlined />}
								loading={isProcessing}
								onClick={() => handleConfirm(id)}
								style={{ background: '#52c41a', borderColor: '#52c41a' }}
							>
								Xác nhận giao sách
							</Button>
						</div>
					</Col>
				</Row>
			</Card>
		);
	};

	return (
		<div style={{ padding: '0 4px' }}>
			<div style={{ fontWeight: 600, marginBottom: 20, fontSize: 16 }}>
				<ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Các phiếu đặt trước đang chờ xử lý
			</div>
			
			<Spin spinning={loading && !processingId}>
				{(!pendingBorrows || pendingBorrows.length === 0) && !loading ? (
					<Empty 
						description='Không có đơn đặt trước nào' 
						style={{ margin: '60px 0', padding: '40px 0', background: '#fafafa', borderRadius: 8 }} 
					/>
				) : (
					<div>
						{pendingBorrows?.map(renderSlip)}
					</div>
				)}
			</Spin>
		</div>
	);
};

export default ReserveTab;

