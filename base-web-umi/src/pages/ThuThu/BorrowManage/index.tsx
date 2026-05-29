import React, { useState } from 'react';
import { Typography, Card } from 'antd';
import { BookOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Checkout from './components/Checkout';

const { Title, Text } = Typography;

const BorrowManage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'borrow' | 'return'>('borrow');

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Header Section */}
			<div style={{ marginBottom: 20 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Xử lý mượn trả
				</Title>
			</div>

			<Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
				{/* Custom Toggle Buttons - Giống Figma */}
				<div
					style={{
						display: 'flex',
						background: '#f0f0f0',
						borderRadius: 8,
						padding: 4,
						marginBottom: 24,
					}}
				>
					<div
						onClick={() => setActiveTab('borrow')}
						style={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '12px 0',
							cursor: 'pointer',
							borderRadius: 6,
							fontWeight: 600,
							transition: 'all 0.3s',
							backgroundColor: activeTab === 'borrow' ? '#e3000f' : 'transparent', // Màu đỏ PTIT
							color: activeTab === 'borrow' ? '#fff' : '#595959',
						}}
					>
						<BookOutlined style={{ marginRight: 8, fontSize: 18 }} /> Cho mượn
					</div>
					<div
						onClick={() => setActiveTab('return')}
						style={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '12px 0',
							cursor: 'pointer',
							borderRadius: 6,
							fontWeight: 600,
							transition: 'all 0.3s',
							backgroundColor: activeTab === 'return' ? '#e3000f' : 'transparent',
							color: activeTab === 'return' ? '#fff' : '#595959',
						}}
					>
						<CheckCircleOutlined style={{ marginRight: 8, fontSize: 18 }} /> Nhận trả
					</div>
				</div>

				{/* Nội dung thay đổi theo Tab */}
				{activeTab === 'borrow' ? (
					<Checkout />
				) : (
					<div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
						<CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
						<p>Giao diện Nhận trả sách đang được cập nhật...</p>
					</div>
				)}
			</Card>
		</div>
	);
};

export default BorrowManage;
