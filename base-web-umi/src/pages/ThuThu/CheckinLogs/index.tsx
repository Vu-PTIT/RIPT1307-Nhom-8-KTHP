import React, { useState } from 'react';
import { Typography, Radio, Input, Button, message } from 'antd';
import { EnterOutlined, UserOutlined } from '@ant-design/icons';
import StatCards from './components/StatCards';
import LogList, { LogItem } from './components/LogList';

const { Title, Text } = Typography;

const CheckinLogs: React.FC = () => {
	// Bộ dữ liệu giả lập (Mock data) khớp chính xác với ảnh Demo thiết kế
	const mockLogs: LogItem[] = [
		{ id: '1', name: 'Nguyễn Văn An', status: 'IN', checkInTime: '10/05 08:30', duration: '373h 55m' },
		{
			id: '2',
			name: 'Trần Thị Bình',
			status: 'OUT',
			checkInTime: '10/05 09:15',
			checkOutTime: '10/05 11:45',
			duration: '2h 30m',
		},
		{
			id: '3',
			name: 'Nguyễn Văn An',
			status: 'OUT',
			checkInTime: '09/05 14:00',
			checkOutTime: '09/05 17:30',
			duration: '3h 30m',
		},
	];

	const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
	const [studentCode, setStudentCode] = useState('');

	// Xử lý khi nhấn nút Xác nhận hoặc gõ xong ấn Enter
	const handleAccessCheck = () => {
		if (!studentCode.trim()) {
			message.warning('Vui lòng nhập mã sinh viên hoặc mã thẻ!');
			return;
		}

		// Ghi nhận thành công (Tạm thời hiển thị thông báo alert của Antd)
		message.success(`Đã ghi nhận giao dịch thành công cho mã: ${studentCode.trim().toUpperCase()}`);
		setStudentCode(''); // Xóa sạch dữ liệu trong ô sau khi bấm để sẵn sàng nhận mã tiếp theo
	};

	// Xử lý lọc dữ liệu theo nút bấm
	const filteredData = mockLogs.filter((log) => {
		if (filter === 'in') return log.status === 'IN';
		if (filter === 'out') return log.status === 'OUT';
		return true;
	});

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
			<StatCards currentInLibrary={1} todayCheckin={0} totalLogs={3} />

			{/* 🛠️ 2. KHU VỰC Ô NHẬP MÃ ĐỂ CHECKIN/CHECKOUT (MỚI BỔ SUNG) */}
			<div
				style={{
					background: '#fff',
					padding: '20px',
					borderRadius: 12,
					marginBottom: 24,
					boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
				}}
			>
				<div style={{ marginBottom: 12, fontWeight: 600, color: '#262626', fontSize: 15 }}>
					Ghi nhận lượt ra vào trực tiếp
				</div>
				<div style={{ display: 'flex', width: '100%', maxWidth: 500 }}>
					<Input
						size='large'
						placeholder='Nhập mã sinh viên hoặc quét mã thẻ...'
						value={studentCode}
						onChange={(e) => setStudentCode(e.target.value)}
						onPressEnter={handleAccessCheck}
						prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
						style={{
							borderRadius: '8px 0 0 8px', // Bo góc bên trái
							borderRight: 0, // Ẩn viền phải để dính liền với nút bấm
						}}
					/>
					<Button
						type='primary'
						size='large'
						icon={<EnterOutlined />}
						onClick={handleAccessCheck}
						style={{
							background: '#e3000f',
							borderColor: '#e3000f',
							borderRadius: '0 8px 8px 0', // Bo góc bên phải
							fontWeight: 600,
						}}
					>
						Xác nhận
					</Button>
				</div>
			</div>

			{/* 3. Thanh Filter Trạng thái */}
			<div style={{ marginBottom: 16 }}>
				<Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)} buttonStyle='solid' size='middle'>
					<Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)} buttonStyle='solid' size='middle'>
						<Radio.Button value='all' style={{ borderRadius: '6px 0 0 6px' }}>
							Tất cả
						</Radio.Button>
						<Radio.Button value='in'>Trong thư viện (1)</Radio.Button>
						<Radio.Button value='out' style={{ borderRadius: '0 6px 6px 0' }}>
							Đã ra về
						</Radio.Button>
					</Radio.Group>
				</Radio.Group>
			</div>

			{/* 4. Danh sách Nhật ký kết quả */}
			<LogList data={filteredData} />
		</div>
	);
};

export default CheckinLogs;
