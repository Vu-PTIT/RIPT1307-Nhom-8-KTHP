import React, { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, message, Spin, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import BorrowedBookList from '@/components/BorrowedBookList';
import * as MuonSach from '@/services/MuonSach';

const RecordStatus: Record<string, { className: string; label: string }> = {
	active: { className: 'warning', label: 'Đang mượn' },
	returned: { className: 'success', label: 'Đã trả hết' },
	overdue: { className: 'danger', label: 'Quá hạn' },
	completed: { className: 'success', label: 'Hoàn thành' },
};

export default function BorrowDetailPage(props: any) {
	const id = props?.match?.params?.id;
	const [record, setRecord] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const load = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await MuonSach.getBorrowDetail(id);
			setRecord(res.data || null);
		} catch (e) {
			message.error('Không tải được chi tiết phiếu mượn');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id]);

	return (
		<PageSkeleton title='Chi tiết phiếu mượn'>
			<div className='library-panel'>
				<Spin spinning={loading}>
					{!record ? (
						<div className='library-empty-state'>
							<Empty description='Không tìm thấy phiếu mượn' />
						</div>
					) : (
						<div className='borrow-detail-stack'>
							<Descriptions bordered column={{ xs: 1, sm: 2 }} size='small'>
								<Descriptions.Item label='Trạng thái'>
									{(() => {
										const s = RecordStatus[record.status] || { className: 'neutral', label: record.status };
										return <Tag className={`library-status-tag ${s.className}`}>{s.label}</Tag>;
									})()}
								</Descriptions.Item>
								<Descriptions.Item label='Ngày mượn'>{record.borrow_date}</Descriptions.Item>
								<Descriptions.Item label='Hạn trả'>{record.due_date}</Descriptions.Item>
							</Descriptions>

							<div>
								<h3 className='library-section-title'>Danh sách sách mượn</h3>
								<BorrowedBookList items={record.items || []} emptyDescription='Phiếu này chưa có sách mượn' />
							</div>

							<div>
								<Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/ban-doc/lich-su-muon')}>
									Quay lại lịch sử mượn
								</Button>
							</div>
						</div>
					)}
				</Spin>
			</div>
		</PageSkeleton>
	);
}
