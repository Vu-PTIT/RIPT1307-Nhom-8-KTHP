import React from 'react';
import { Empty, List, Tag } from 'antd';
import { CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';
import './BorrowedBookList.less';

type BorrowedBookListProps = {
	items: any[];
	loading?: boolean;
	emptyDescription?: string;
	actionRender?: (item: any) => React.ReactNode;
};

const objIdRegex = /^[a-fA-F0-9]{24}$/;

const formatDate = (value?: string) => {
	if (!value) return 'Không rõ';
	const date = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('vi-VN');
};

const daysLate = (value?: string) => {
	if (!value) return 0;
	const due = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	due.setHours(0, 0, 0, 0);
	return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
};

const getCover = (item: any) => {
	const title = item.document_title || item.title;
	let cover = item.cover_image || getCoverForTitle(title) || item.thumbnail || '/default-cover.png';
	if (typeof cover === 'string' && objIdRegex.test(cover)) {
		cover = `${ipLibrary}/documents/covers/${cover}`;
	}
	return cover;
};

const getStatus = (item: any) => {
	if (item.return_date || item.status === 'returned') {
		return { className: 'neutral', label: 'Đã trả', lateDays: 0 };
	}
	const lateDays = daysLate(item.due_date || item.record_due_date);
	if (item.status === 'overdue' || lateDays > 0) {
		return { className: 'danger', label: 'Quá hạn', lateDays };
	}
	return { className: 'neutral', label: 'Đang mượn', lateDays: 0 };
};

const BorrowedBookList: React.FC<BorrowedBookListProps> = ({
	items,
	loading,
	emptyDescription = 'Không có sách đang mượn',
	actionRender,
}) => {
	if (!items.length && !loading) {
		return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />;
	}

	return (
		<List
			className='borrowed-book-list'
			loading={loading}
			dataSource={items}
			renderItem={(item: any) => {
				const title = item.document_title || item.title || 'Không rõ tên sách';
				const status = getStatus(item);
				const dueDate = item.due_date || item.record_due_date;
				return (
					<List.Item className={`borrowed-book-card ${status.className === 'danger' ? 'overdue' : ''}`}>
						<div className='borrowed-book-cover' style={{ backgroundImage: `url(${getCover(item)})` }} />
						<div className='borrowed-book-main'>
							<div className='borrowed-book-heading'>
								<div>
									<h3>{title}</h3>
									<p>{item.author || item.document_author || 'Chưa rõ tác giả'}</p>
								</div>
								<div className='borrowed-book-status'>
									<Tag className={`library-status-tag ${status.className}`}>{status.label}</Tag>
									{actionRender ? actionRender(item) : null}
								</div>
							</div>

							<div className='borrowed-book-dates'>
								<div>
									<span>Ngày mượn</span>
									<strong>
										<CalendarOutlined /> {formatDate(item.borrow_date)}
									</strong>
								</div>
								<div>
									<span>Hạn trả</span>
									<strong className={status.className === 'danger' ? 'danger' : ''}>
										<CalendarOutlined /> {formatDate(dueDate)}
									</strong>
								</div>
								<div>
									<span>Mã bản sao</span>
									<strong>{item.copy_code || 'Không rõ'}</strong>
								</div>
							</div>

							{status.lateDays > 0 ? (
								<div className='borrowed-book-warning'>
									<ExclamationCircleOutlined /> Quá hạn {status.lateDays} ngày
								</div>
							) : null}
						</div>
					</List.Item>
				);
			}}
		/>
	);
};

export default BorrowedBookList;
