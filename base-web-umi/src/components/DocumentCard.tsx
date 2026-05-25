import React from 'react';
import { Card, Space, Tag, Button } from 'antd';
import { InfoCircleOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import './DocumentCard.less';
import getCoverForTitle from '../utils/coverMap';

type Props = {
	item: any;
	onDetail?: (id: string) => void;
	onWishlist?: (item: any) => void;
	onCart?: (item: any) => void;
	actions?: React.ReactNode[];
	accent?: boolean;
};

const DocumentCard: React.FC<Props> = ({ item, onDetail, onWishlist, onCart, actions, accent }) => {
	const title = item.title || item.document_title || 'Không có tiêu đề';
	const author = item.author || item.authors || '';
	// prefer explicit cover, then title-based map, then thumbnail, then default
	const mapped = getCoverForTitle(title);
	const cover = item.cover_image || mapped || item.thumbnail || '/default-cover.png';

	return (
		<Card className={`doc-card ${accent ? 'accent' : ''}`} hoverable bodyStyle={{ padding: 0 }}>
			<div className='doc-cover' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
				<img src={cover} alt={title} />
			</div>
			<div className='doc-body'>
				<h3 className='doc-title' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
					{title}
				</h3>
				<div className='doc-author'>{author}</div>
				<div className='doc-tags'>
					{item.category_name || item.category?.name ? (
						<Tag color='volcano'>{item.category_name || item.category?.name}</Tag>
					) : null}
					<Tag color={Number(item.available_copies || 0) > 0 ? 'green' : 'default'}>
						{Number(item.available_copies || 0)} bản khả dụng
					</Tag>
				</div>
			</div>

			<div className='doc-actions'>
				{actions ? (
					actions
				) : (
					<Space>
						<Button onClick={() => onDetail && onDetail(item.id || item.document_id)}>Chi tiết</Button>
						<Button icon={<HeartOutlined />} onClick={() => onWishlist && onWishlist(item)} />
						<Button type='primary' className='cta-primary' onClick={() => onCart && onCart(item)}>
							Đưa vào giỏ
						</Button>
					</Space>
				)}
			</div>
		</Card>
	);
};

export default DocumentCard;
