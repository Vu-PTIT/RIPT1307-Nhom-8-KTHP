import React, { useState } from 'react';
import { Typography, Radio, Input, Button, message, Row, Col, Card } from 'antd';
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import StatCards from './components/StatCards';
import LogList, { LogItem } from './components/LogList';
import { getAllCheckinLogs, getCheckinStats, manualCheckin } from '@/services/ThuThu';

const { Title, Text } = Typography;

const CheckinLogs: React.FC = () => {
	const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
	const [checkinCode, setCheckinCode] = useState('');
	const [checkoutCode, setCheckoutCode] = useState('');
	const [actionType, setActionType] = useState<'in' | 'out' | null>(null);

	// Lấy thống kê
	const { data: statsData, refresh: refreshStats } = useRequest(getCheckinStats, {
		formatResult: (res) => res.data,
	});

	// Lấy danh sách log
	const { data: logsData, loading: logsLoading, refresh: refreshLogs } = useRequest(
		() => getAllCheckinLogs({ check_type: filter === 'all' ? undefined : filter, page_size: 100 }),
		{
			refreshDeps: [filter],
			formatResult: (res) => res.data as LogItem[],
		},
	);

	// Xử lý khi nhấn nút Vào/Ra hoặc gõ xong ấn Enter
	const { run: runManualCheckin, loading: actionLoading } = useRequest(
		(code: string, type: 'in' | 'out') => {
			return manualCheckin({ user_id: code, check_type: type });
		},
		{
			manual: true,
			onSuccess: (res, params) => {
				const item = res.data;
				const type = params[1];
				const actionName = type === 'in' ? 'Check-in (Vào)' : 'Check-out (Ra)';
				message.success(`✅ ${actionName} thành công: ${item?.username || params[0]}`);
				
				if (type === 'in') setCheckinCode('');
				else setCheckoutCode('');
				
				setActionType(null);
				refreshStats();
				refreshLogs();
			},
			onError: (err: any) => {
				const detail = err?.response?.data?.detail || 'Không tìm thấy người dùng!';
				message.error(`❌ ${detail}`);
				setActionType(null);
			},
		},
	);

	const handleAccessCheck = (type: 'in' | 'out') => {
		const code = type === 'in' ? checkinCode : checkoutCode;
		if (!code.trim()) {
			message.warning('Vui lòng nhập mã sinh viên hoặc mã thẻ!');
			return;
		}
		setActionType(type);
		runManualCheckin(code.trim(), type);
	};

	const stats = statsData || { currently_in_library: 0, today_checkin: 0, total_logs: 0 };
	const logs = logsData || [];

	return (
		<div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
			{/* Header trang */}
			<div style={{ marginBottom: 20 }}>
				<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
					Kiểm soát ra vào
				</Title>
				<Text type='secondary'>Theo dõi nhật ký ra vào thư viện trực tiếp</Text>
			</div>

			{/* 1. Khu vực hiển thị 3 Thẻ thống kê */}
			<StatCards
				currentInLibrary={stats.currently_in_library}
				todayCheckin={stats.today_checkin}
				totalLogs={stats.total_logs}
			/>

			{/* 2. KHU VỰC Ô NHẬP MÃ ĐỂ CHECKIN/CHECKOUT */}
			<Row gutter={24} style={{ marginBottom: 24 }}>
				<Col xs={24} md={12}>
					<Card 
						title={<><LoginOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Check-in (Vào thư viện)</>}
						bordered={false}
						style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
						headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
					>
						<div style={{ display: 'flex', width: '100%' }}>
							<Input
								size='large'
								placeholder='Nhập mã thẻ để vào...'
								value={checkinCode}
								onChange={(e) => setCheckinCode(e.target.value)}
								onPressEnter={() => handleAccessCheck('in')}
								prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
								style={{ borderRadius: '8px 0 0 8px', borderRight: 0 }}
							/>
							<Button
								type='primary'
								size='large'
								icon={<LoginOutlined />}
								onClick={() => handleAccessCheck('in')}
								loading={actionLoading && actionType === 'in'}
								style={{ background: '#52c41a', borderColor: '#52c41a', borderRadius: '0 8px 8px 0', fontWeight: 600 }}
							>
								Vào
							</Button>
						</div>
					</Card>
				</Col>
				<Col xs={24} md={12}>
					<Card 
						title={<><LogoutOutlined style={{ color: '#f5222d', marginRight: 8 }} /> Check-out (Ra về)</>}
						bordered={false}
						style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
						headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
					>
						<div style={{ display: 'flex', width: '100%' }}>
							<Input
								size='large'
								placeholder='Nhập mã thẻ để ra...'
								value={checkoutCode}
								onChange={(e) => setCheckoutCode(e.target.value)}
								onPressEnter={() => handleAccessCheck('out')}
								prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
								style={{ borderRadius: '8px 0 0 8px', borderRight: 0 }}
							/>
							<Button
								type='primary'
								size='large'
								icon={<LogoutOutlined />}
								onClick={() => handleAccessCheck('out')}
								loading={actionLoading && actionType === 'out'}
								style={{ background: '#f5222d', borderColor: '#f5222d', borderRadius: '0 8px 8px 0', fontWeight: 600 }}
							>
								Ra
							</Button>
						</div>
					</Card>
				</Col>
			</Row>

			{/* 3. Thanh Filter Trạng thái */}
			<div style={{ marginBottom: 16 }}>
				<Radio.Group
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					buttonStyle='solid'
					size='middle'
				>
					<Radio.Button value='all' style={{ borderRadius: '6px 0 0 6px' }}>
						Tất cả ({logs.length})
					</Radio.Button>
					<Radio.Button value='in'>
						Trong thư viện ({stats.currently_in_library})
					</Radio.Button>
					<Radio.Button value='out' style={{ borderRadius: '0 6px 6px 0' }}>
						Đã ra về
					</Radio.Button>
				</Radio.Group>
			</div>

			{/* 4. Danh sách Nhật ký kết quả */}
			<LogList data={logs} loading={logsLoading} />
		</div>
	);
};

export default CheckinLogs;

