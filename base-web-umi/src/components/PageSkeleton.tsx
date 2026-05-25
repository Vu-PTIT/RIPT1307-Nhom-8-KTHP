import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card } from 'antd';

const PageSkeleton: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
	return (
		<PageContainer title={title} style={{ background: 'transparent' }}>
			<div style={{ background: '#f6f7f9', padding: 16, minHeight: '60vh' }}>
				{children ? (
					children
				) : (
					<>
						Đây là trang <strong>{title}</strong>. Đang trong quá trình phát triển...
					</>
				)}
			</div>
		</PageContainer>
	);
};

export default PageSkeleton;
