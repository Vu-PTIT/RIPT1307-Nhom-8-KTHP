import { Button, Col, Row, Space } from 'antd';
import './style.less';
import { unitName } from '@/services/base/constant';
import { useModel } from 'umi';
import { RocketOutlined, SettingOutlined, UserOutlined, DatabaseOutlined } from '@ant-design/icons';

const TrangChu = () => {
	const { data } = useModel('randomuser');

	return (
		<div className='home-container'>
			<div className='hero-section fade-in-up'>
				<h1 className='hero-title'>Chào mừng đến với {unitName}</h1>
				<p className='hero-subtitle'>
					Nền tảng mạnh mẽ giúp bạn quản lý các ứng dụng hiện đại.
					Bắt đầu ngay bằng cách khám phá bảng điều khiển và thiết lập hệ thống.
				</p>
				<Space size='middle' style={{ marginTop: 32 }}>
					<Button type='primary' size='large' icon={<RocketOutlined />} shape='round'>
						Bắt đầu ngay
					</Button>
					<Button ghost size='large' icon={<SettingOutlined />} shape='round'>
						Cấu hình
					</Button>
				</Space>
			</div>

			<div className='stats-grid'>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.1s' }}>
					<div className='stat-label'>Tổng người dùng</div>
					<div className='stat-value'>
						<UserOutlined style={{ marginRight: 12, color: '#6366f1' }} />
						{data.length}
					</div>
				</div>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.2s' }}>
					<div className='stat-label'>Trạng thái dữ liệu</div>
					<div className='stat-value'>
						<DatabaseOutlined style={{ marginRight: 12, color: '#a855f7' }} />
						Đã kết nối
					</div>
				</div>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.3s' }}>
					<div className='stat-label'>Phiên bản</div>
					<div className='stat-value'>1.2.4</div>
				</div>
			</div>

			<div className='action-section fade-in-up' style={{ animationDelay: '0.4s' }}>
				<h2 className='section-title'>Thao tác nhanh</h2>
				<Row gutter={[24, 24]}>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							Quản lý người dùng
						</Button>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							Cài đặt hệ thống
						</Button>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							Xem báo cáo
						</Button>
					</Col>
				</Row>
			</div>
		</div>
	);
};

export default TrangChu;
