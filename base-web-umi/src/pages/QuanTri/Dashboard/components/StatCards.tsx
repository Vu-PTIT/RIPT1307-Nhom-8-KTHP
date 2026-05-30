import React from 'react';
import { Col, Row, Spin } from 'antd';
import {
	TeamOutlined, BookOutlined, SwapOutlined, LoginOutlined,
} from '@ant-design/icons';

interface StatCardItem {
	title: string;
	value: number;
	icon: React.ReactNode;
	color: string;
}

interface StatCardsProps {
	summary?: {
		total_users?: number;
		total_documents?: number;
		active_borrows?: number;
		total_checkins_today?: number;
	};
	loading?: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ summary, loading }) => {
	const cards: StatCardItem[] = [
		{
			title: 'Tổng người dùng',
			value: summary?.total_users ?? 0,
			icon: <TeamOutlined />,
			color: '#c90000',
		},
		{
			title: 'Tổng tài liệu',
			value: summary?.total_documents ?? 0,
			icon: <BookOutlined />,
			color: '#1a56a8',
		},
		{
			title: 'Đang mượn',
			value: summary?.active_borrows ?? 0,
			icon: <SwapOutlined />,
			color: '#d4860a',
		},
		{
			title: 'Check-in hôm nay',
			value: summary?.total_checkins_today ?? 0,
			icon: <LoginOutlined />,
			color: '#1e7c44',
		},
	];

	return (
		<Spin spinning={!!loading}>
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
				{cards.map((card) => (
					<Col xs={24} sm={12} lg={6} key={card.title}>
						<div
							className='library-stat'
							style={{ border: '1px solid var(--library-line)', borderRadius: 10 }}
						>
							<span
								className='library-stat-icon'
								style={{ background: `${card.color}18`, color: card.color }}
							>
								{card.icon}
							</span>

							<div>
								<span>{card.title}</span>
								<strong style={{ fontSize: 26 }}>{card.value.toLocaleString()}</strong>
							</div>
						</div>
					</Col>
				))}
			</Row>
		</Spin>
	);
};

export default StatCards;
