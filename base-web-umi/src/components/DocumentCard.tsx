import React from 'react';
import { Card, Tag, Button, Tooltip } from 'antd';
import { InfoCircleOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import './DocumentCard.less';
import getCoverForTitle from '../utils/coverMap';
import { ipLibrary } from '@/utils/ip';

type Props = {
	item: any;
	onDetail?: (id: string) => void;
	onWishlist?: (item: any) => void;
	onCart?: (item: any) => void;
	actions?: React.ReactNode[];
	accent?: boolean;
	layout?: 'card' | 'list';
};

const DocumentCard: React.FC<Props> = ({ item, onDetail, onWishlist, onCart, actions, accent, layout = 'card' }) => {
	const title = item.title || item.document_title || 'Không có tiêu đề';
	const author = item.author || item.authors || '';
	const category = item.category_name || item.category?.name;
	const rawAvailable = item.available_copies ?? item.document_available_copies;
	const hasAvailability = rawAvailable !== undefined && rawAvailable !== null;
	const available = Number(rawAvailable || 0);
	const canBorrow = !hasAvailability || available > 0;
	// prefer explicit cover, then title-based map, then thumbnail, then default
	const mapped = getCoverForTitle(title);
	let cover = item.cover_image || mapped || item.thumbnail || '/default-cover.png';

	// If backend stored the cover as a GridFS ObjectId string (24 hex chars),
	// serve it through the backend files endpoint.
	const objIdRegex = /^[a-fA-F0-9]{24}$/;
	if (typeof cover === 'string' && objIdRegex.test(cover)) {
		// ipLibrary already points to e.g. http://localhost:8000/api/v1
		cover = `${ipLibrary}/documents/covers/${cover}`;
	}

	return (
		<Card
			className={`doc-card ${accent ? 'accent' : ''} ${layout === 'list' ? 'list' : ''}`}
			hoverable
			bodyStyle={{ padding: 0 }}
		>
			<div className='doc-spine' />
			<div
				className='doc-cover'
				onClick={() => onDetail && onDetail(item.id || item.document_id)}
				style={{ backgroundImage: `url(${cover})` }}
				role='button'
				tabIndex={0}
				aria-label={`Xem chi tiết ${title}`}
			>
				<div className={`doc-availability ${canBorrow ? 'available' : 'unavailable'}`}>
					{canBorrow ? `${hasAvailability ? available : 'Có'} bản sẵn sàng` : 'Hết bản'}
				</div>
			</div>

			{layout === 'list' ? (
				<div className='doc-body'>
					<h3 className='doc-title' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
						{title}
					</h3>
					<div className='doc-author'>{author}</div>
					<div className='doc-tags'>
						{category ? <Tag className='category-tag'>{category}</Tag> : null}
						<Tag className={canBorrow ? 'available-tag' : 'unavailable-tag'}>
							{canBorrow ? `${hasAvailability ? available : 'Có'} bản khả dụng` : 'Hết bản'}
						</Tag>
					</div>

					<div className='doc-actions'>
						{actions ? (
							<div className='actions-custom'>{actions}</div>
						) : (
							<>
								<div className='actions-left'>
									<Button className='detail-btn' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
										<InfoCircleOutlined />
										&nbsp;Chi tiết
									</Button>
								</div>
								<div className='actions-right'>
									<Tooltip title='Lưu yêu thích'>
										<Button
											className='icon-btn'
											icon={<HeartOutlined />}
											onClick={() => onWishlist && onWishlist(item)}
											aria-label='Lưu yêu thích'
										/>
									</Tooltip>
									<Tooltip title={canBorrow ? 'Thêm vào giỏ mượn' : 'Hiện không còn bản'}>
										<Button
											className='icon-btn borrow-btn'
											icon={<ShoppingCartOutlined />}
											onClick={() => onCart && onCart(item)}
											disabled={!canBorrow}
											aria-label='Thêm vào giỏ mượn'
										/>
									</Tooltip>
								</div>
							</>
						)}
					</div>
				</div>
			) : (
				<>
					<div className='doc-body'>
						<h3 className='doc-title' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
							{title}
						</h3>
						<div className='doc-author'>{author}</div>
						<div className='doc-tags'>
							{category ? <Tag className='category-tag'>{category}</Tag> : null}
							<Tag className={canBorrow ? 'available-tag' : 'unavailable-tag'}>
								{canBorrow ? `${hasAvailability ? available : 'Có'} bản khả dụng` : 'Hết bản'}
							</Tag>
						</div>
					</div>

					<div className='doc-actions'>
						{actions ? (
							<div className='actions-custom'>{actions}</div>
						) : (
							<>
								<div className='actions-left'>
									<Button className='detail-btn' onClick={() => onDetail && onDetail(item.id || item.document_id)}>
										<InfoCircleOutlined />
										&nbsp;Chi tiết
									</Button>
								</div>
								<div className='actions-right'>
									<Tooltip title='Lưu yêu thích'>
										<Button
											className='icon-btn'
											icon={<HeartOutlined />}
											onClick={() => onWishlist && onWishlist(item)}
											aria-label='Lưu yêu thích'
										/>
									</Tooltip>
									<Tooltip title={canBorrow ? 'Thêm vào giỏ mượn' : 'Hiện không còn bản'}>
										<Button
											className='icon-btn borrow-btn'
											icon={<ShoppingCartOutlined />}
											onClick={() => onCart && onCart(item)}
											disabled={!canBorrow}
											aria-label='Thêm vào giỏ mượn'
										/>
									</Tooltip>
								</div>
							</>
						)}
					</div>
				</>
			)}
		</Card>
	);
};

export default DocumentCard;
