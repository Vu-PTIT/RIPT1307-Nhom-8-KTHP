import React from 'react';
import { Button, Empty, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SettingsTableProps {
	settings: any[];
	loading: boolean;
	onEdit: (record: any) => void;
}

const SettingsTable: React.FC<SettingsTableProps> = ({ settings, loading, onEdit }) => {
	const columns = [
		{
			title: 'Khoá cài đặt',
			dataIndex: 'key',
			key: 'key',
			width: 220,
			align: 'center',
			render: (v: string, record: any) => {
				const keyVal = v ?? record.setting_key ?? '';
				return (
					<Tag style={{ fontFamily: 'monospace', fontSize: 13, padding: '4px 10px' }}>{keyVal}</Tag>
				);
			},
		},
		{
			title: 'Giá trị hiện tại',
			dataIndex: 'value',
			key: 'value',
			align: 'center',
			render: (v: string, record: any) => {
				const val = v ?? record.setting_value ?? '';
				return (
					<Text
						style={{
							display: 'inline-block',
							maxWidth: 360,
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-all',
						}}
					>
						{val || <Text type='secondary'>—</Text>}
					</Text>
				);
			},
		},
		{
			title: 'Mô tả',
			dataIndex: 'description',
			key: 'description',
			align: 'center',
			render: (v: string) =>
				v ? (
					<Text type='secondary' style={{ fontSize: 13 }}>{v}</Text>
				) : (
					<Text type='secondary'>—</Text>
				),
		},
		{
			title: 'Cập nhật lúc',
			dataIndex: 'updated_at',
			key: 'updated_at',
			width: 150,
			align: 'center',
			render: (v: string) =>
				v ? (
					<Text style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YYYY HH:mm')}</Text>
				) : (
					<Text type='secondary'>—</Text>
				),
		},
		{
			title: 'Thao tác',
			key: 'action',
			width: 100,
			align: 'center',
			render: (_: any, record: any) => (
				<Tooltip title='Chỉnh sửa'>
					<Button
						type='primary'
						icon={<EditOutlined />}
						size='small'
						onClick={() => onEdit(record)}
						style={{ background: '#c90000', borderColor: '#c90000', borderRadius: 6 }}
					>
						Sửa
					</Button>
				</Tooltip>
			),
		},
	];

	return (
		<Spin spinning={loading}>
			{settings.length === 0 && !loading ? (
				<Empty description='Không có cài đặt nào' style={{ padding: '48px 16px' }} />
			) : (
				<Table
					dataSource={settings}
					columns={columns}
					rowKey={(r: any) => String(r.key)}
					pagination={settings.length > 10 ? { pageSize: 10 } : false}
					size='middle'
				/>
			)}
		</Spin>
	);
};

export default SettingsTable;
