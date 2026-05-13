import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card } from 'antd';

const PageSkeleton: React.FC<{ title: string }> = ({ title }) => {
  return (
    <PageContainer title={title}>
      <Card>
        Đây là trang <strong>{title}</strong>. Đang trong quá trình phát triển...
      </Card>
    </PageContainer>
  );
};

export default PageSkeleton;
