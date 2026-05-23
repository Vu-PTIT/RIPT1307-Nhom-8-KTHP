import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card } from 'antd';

const PageSkeleton: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
  return (
    <PageContainer title={title}>
      <Card>
        {children ? (
          children
        ) : (
          <>Đây là trang <strong>{title}</strong>. Đang trong quá trình phát triển...</>
        )}
      </Card>
    </PageContainer>
  );
};

export default PageSkeleton;
