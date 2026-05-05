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
				<h1 className='hero-title'>Welcome to {unitName}</h1>
				<p className='hero-subtitle'>
					Your powerful platform for building and managing modern web applications. 
					Start setting up your product by exploring the dashboard and configuring your settings.
				</p>
				<Space size='middle' style={{ marginTop: 32 }}>
					<Button type='primary' size='large' icon={<RocketOutlined />} shape='round'>
						Get Started
					</Button>
					<Button ghost size='large' icon={<SettingOutlined />} shape='round'>
						Configure
					</Button>
				</Space>
			</div>

			<div className='stats-grid'>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.1s' }}>
					<div className='stat-label'>Total Users</div>
					<div className='stat-value'>
						<UserOutlined style={{ marginRight: 12, color: '#6366f1' }} />
						{data.length}
					</div>
				</div>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.2s' }}>
					<div className='stat-label'>Active Database</div>
					<div className='stat-value'>
						<DatabaseOutlined style={{ marginRight: 12, color: '#a855f7' }} />
						Connected
					</div>
				</div>
				<div className='stat-card fade-in-up' style={{ animationDelay: '0.3s' }}>
					<div className='stat-label'>App Version</div>
					<div className='stat-value'>1.2.4</div>
				</div>
			</div>

			<div className='action-section fade-in-up' style={{ animationDelay: '0.4s' }}>
				<h2 className='section-title'>Quick Actions</h2>
				<Row gutter={[24, 24]}>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							Manage Users
						</Button>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							System Settings
						</Button>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Button block size='large' style={{ height: 80, borderRadius: 16 }}>
							View Reports
						</Button>
					</Col>
				</Row>
			</div>
		</div>
	);
};

export default TrangChu;
