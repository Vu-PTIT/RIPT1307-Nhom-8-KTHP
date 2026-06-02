import React from 'react';
import { Descriptions, Empty, Spin, Tag } from 'antd';
import getCoverForTitle from '@/utils/coverMap';
import { ipLibrary } from '@/utils/ip';

interface DocumentDetailViewProps {
	document: any;
	loading: boolean;
	actions?: React.ReactNode;
}

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ document, loading, actions }) => {
	return (
		<div className='library-panel'>
			<Spin spinning={loading}>
				{!document ? (
					<div className='library-empty-state'>
						<Empty description='Không tìm thấy tài liệu' />
					</div>
				) : (
					<div className='library-detail'>
						<div className='library-detail-cover'>
							{(() => {
								let cover =
									document.cover_image ||
									getCoverForTitle(document.title) ||
									document.thumbnail ||
									'/default-cover.png';

								const objIdRegex = /^[a-fA-F0-9]{24}$/;
								if (typeof cover === 'string' && objIdRegex.test(cover)) {
									cover = `${ipLibrary}/documents/covers/${cover}`;
								}
								return <img alt={document.title} src={cover} />;
							})()}
						</div>
						<div className='library-detail-main'>
							<div className='library-detail-header'>
								<div>
									<h2>{document.title}</h2>
									<div className='library-detail-author'>{document.author || 'Chưa rõ tác giả'}</div>
								</div>
								<div>
									{document.category?.name ? (
										<Tag className='library-status-tag neutral'>{document.category.name}</Tag>
									) : null}
									<Tag
										className={`library-status-tag ${
											Number(document.available_copies || 0) > 0 ? 'success' : 'danger'
										}`}
									>
										{Number(document.available_copies || 0) > 0
											? `Còn ${document.available_copies || 0} bản`
											: 'Hết bản'}
									</Tag>
								</div>
							</div>

							<Descriptions bordered column={1} size='small'>
								<Descriptions.Item label='ISBN'>{document.isbn || 'Chưa có'}</Descriptions.Item>
								<Descriptions.Item label='Danh mục'>{document.category?.name || 'Chưa có'}</Descriptions.Item>
								<Descriptions.Item label='Mô tả'>{document.description || 'Chưa có mô tả'}</Descriptions.Item>
								<Descriptions.Item label='Tổng bản'>{document.total_copies ?? 0}</Descriptions.Item>
								<Descriptions.Item label='Bản còn lại'>{document.available_copies ?? 0}</Descriptions.Item>
							</Descriptions>

							<div className='library-detail-actions'>
								{actions}
							</div>
						</div>
					</div>
				)}
			</Spin>
		</div>
	);
};

export default DocumentDetailView;
