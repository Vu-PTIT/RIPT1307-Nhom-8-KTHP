import React, { useState } from 'react';
import { Button, Form, message, Typography } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import { getLibrarySettings, updateLibrarySetting } from '@/services/QuanTri';
import SettingsTable from './components/SettingsTable';
import SettingEditModal from './components/SettingEditModal';

const { Text } = Typography;

/** Normalise API response: array or key-value object → flat array */
const normaliseSettings = (raw: any): any[] => {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	return Object.entries(raw).map(([key, value]) => ({
		key,
		value: typeof value === 'object' ? JSON.stringify(value) : String(value),
	}));
};

const Settings: React.FC = () => {
	const [form] = Form.useForm();
	const [editingKey, setEditingKey] = useState<any>(null);
	const [submitting, setSubmitting] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);

	const { data: settingsRes, loading, refresh } = useRequest(getLibrarySettings, {
		formatResult: (res) => res.data || res,
	});

	const settings = normaliseSettings(settingsRes);

	const openEdit = (record: any) => {
		setEditingKey(record);
		form.setFieldsValue({
			setting_value: record.value ?? record.setting_value ?? '',
			description: record.description ?? '',
		});
		setModalVisible(true);
	};

	const handleSave = async () => {
		if (!editingKey) return;
		try {
			const values = await form.validateFields();
			setSubmitting(true);
			await updateLibrarySetting(editingKey.key, {
				setting_value: values.setting_value,
				description: values.description || undefined,
			});
			message.success(`✅ Đã cập nhật cài đặt "${editingKey.key}"!`);
			setModalVisible(false);
			refresh();
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			message.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<PageSkeleton
			title='Cài đặt hệ thống'
			subtitle='Quản lý các tham số cấu hình thư viện: thời hạn mượn, số lượng tối đa, thông báo...'
		>
			<div className='library-panel'>
				{/* Toolbar */}
				<div className='library-action-bar' style={{ marginBottom: 16 }}>
					<div className='library-action-left'>
						<SettingOutlined style={{ color: '#c90000', fontSize: 18 }} />
						<Text style={{ fontWeight: 600, fontSize: 15 }}>
							{settings.length > 0 ? `${settings.length} tham số cài đặt` : 'Đang tải...'}
						</Text>
					</div>
					<div className='library-action-right'>
						<Button icon={<ReloadOutlined />} onClick={refresh}>
							Làm mới
						</Button>
					</div>
				</div>

				<SettingsTable settings={settings} loading={loading} onEdit={openEdit} />
			</div>

			<SettingEditModal
				open={modalVisible}
				editingKey={editingKey}
				form={form}
				submitting={submitting}
				onOk={handleSave}
				onCancel={() => setModalVisible(false)}
			/>
		</PageSkeleton>
	);
};

export default Settings;
