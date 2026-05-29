import React from 'react';
import { Input, Typography, Table, Empty } from 'antd';
import { SearchOutlined, QrcodeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Book {
	key?: React.Key;
	barcode?: string;
	title?: string;
	location?: string;
	status?: string;
}

const Checkout: React.FC = () => {
	// Dữ liệu mẫu cho bảng "Sách khả dụng"
	const dataSource: Book[] = [
		// Tạm thời để trống để hiện Empty giống Figma hoặc thêm data mẫu
	];

	const columns = [
		{ title: 'Mã vạch', dataIndex: 'barcode', key: 'barcode' },
		{ title: 'Tên sách', dataIndex: 'title', key: 'title' },
		{ title: 'Vị trí', dataIndex: 'location', key: 'location' },
		{ title: 'Trạng thái', dataIndex: 'status', key: 'status' },
	];

	return (
		<div>
			{/* Search Input */}
			<Input
				size='large'
				placeholder='Tìm sách để cho mượn...'
				prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
				style={{
					borderRadius: 8,
					height: 50,
					marginBottom: 24,
					background: '#fcfcfc',
				}}
			/>

			{/* QR Scanning Area - Ô nét đứt giống Figma */}
			{/* <div 
        style={{
          border: '2px dashed #d9d9d9',
          borderRadius: 12,
          padding: '60px 20px',
          textAlign: 'center',
          background: '#fafafa',
          cursor: 'pointer',
          marginBottom: 40,
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e3000f')}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
      >
        <QrcodeOutlined style={{ fontSize: 64, color: '#8c8c8c', marginBottom: 16 }} />
        <div>
          <Title level={5} style={{ margin: 0, color: '#595959' }}>
            Quét mã QR/Mã vạch
          </Title>
          <Text type="secondary">hoặc tìm kiếm thủ công ở trên</Text>
        </div>
      </div> */}

			{/* Sách khả dụng Section */}
			<div style={{ marginTop: 20 }}>
				<Title level={5} style={{ marginBottom: 16, fontWeight: 600 }}>
					Sách khả dụng
				</Title>

				<Table
					dataSource={dataSource}
					columns={columns}
					pagination={false}
					locale={{
						emptyText: <Empty description='Không có dữ liệu sách' />,
					}}
					style={{ borderRadius: 8, overflow: 'hidden' }}
				/>
			</div>
		</div>
	);
};

export default Checkout;
