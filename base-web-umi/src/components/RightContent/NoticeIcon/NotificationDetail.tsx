import { type ThongBao } from '@/services/ThongBao/typing';
import {
	BellOutlined,
	BookOutlined,
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	InfoCircleOutlined,
	SwapOutlined,
	WarningOutlined,
} from '@ant-design/icons';
import { Divider, Tag } from 'antd';
import moment from 'moment';
import React from 'react';
import styles from './NotificationDetail.module.less';

type Props = {
	record?: ThongBao.IRecord;
};

const typeConfig: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string; bg: string }
> = {
	checkout: {
		label: 'Nhận sách',
		icon: <BookOutlined />,
		color: '#1677ff',
		bg: '#e6f4ff',
	},
	checkin: {
		label: 'Trả sách',
		icon: <CheckCircleOutlined />,
		color: '#52c41a',
		bg: '#f6ffed',
	},
	new_borrow_request: {
		label: 'Yêu cầu mượn',
		icon: <SwapOutlined />,
		color: '#fa8c16',
		bg: '#fff7e6',
	},
	new_renewal_request: {
		label: 'Yêu cầu gia hạn',
		icon: <ClockCircleOutlined />,
		color: '#722ed1',
		bg: '#f9f0ff',
	},
	renewal_approved: {
		label: 'Gia hạn thành công',
		icon: <CheckCircleOutlined />,
		color: '#52c41a',
		bg: '#f6ffed',
	},
	overdue: {
		label: 'Quá hạn',
		icon: <WarningOutlined />,
		color: '#ff4d4f',
		bg: '#fff2f0',
	},
	overdue_report: {
		label: 'Báo cáo quá hạn',
		icon: <InfoCircleOutlined />,
		color: '#ff4d4f',
		bg: '#fff2f0',
	},
};

const defaultConfig = {
	label: 'Thông báo',
	icon: <BellOutlined />,
	color: '#1677ff',
	bg: '#e6f4ff',
};

const NotificationDetail: React.FC<Props> = ({ record }) => {
	if (!record) return null;

	const notifType = record.type ?? '';
	const config = typeConfig[notifType] ?? defaultConfig;

	return (
		<div className={styles.container}>
			{/* Header banner */}
			<div className={styles.banner} style={{ background: config.bg }}>
				<div className={styles.iconWrapper} style={{ background: config.color }}>
					{config.icon}
				</div>
				<div className={styles.headerText}>
					<span className={styles.typeTag} style={{ color: config.color }}>
						{config.label}
					</span>
					<h2 className={styles.title}>{record.title}</h2>
				</div>
			</div>

			<div className={styles.body}>
				{/* Message */}
				<div className={styles.messageBox}>
					<p className={styles.message}>{record.description}</p>
				</div>

				<Divider style={{ margin: '12px 0' }} />

				{/* Meta info */}
				<div className={styles.meta}>
					<div className={styles.metaItem}>
						<CalendarOutlined style={{ color: '#8c8c8c', marginRight: 6 }} />
						<span className={styles.metaLabel}>Thời gian:</span>
						<span className={styles.metaValue}>
							{moment(record.createdAt).format('HH:mm - DD/MM/YYYY')}
						</span>
					</div>
					<div className={styles.metaItem}>
						<BellOutlined style={{ color: '#8c8c8c', marginRight: 6 }} />
						<span className={styles.metaLabel}>Trạng thái:</span>
						{record.read ? (
							<Tag color='default' style={{ marginLeft: 6 }}>
								Đã đọc
							</Tag>
						) : (
							<Tag color='blue' style={{ marginLeft: 6 }}>
								Chưa đọc
							</Tag>
						)}
					</div>
					<div className={styles.metaItem}>
						<InfoCircleOutlined style={{ color: '#8c8c8c', marginRight: 6 }} />
						<span className={styles.metaLabel}>Loại:</span>
						<Tag
							style={{
								marginLeft: 6,
								color: config.color,
								background: config.bg,
								border: `1px solid ${config.color}33`,
							}}
						>
							{config.label}
						</Tag>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotificationDetail;
