import React from 'react';
import { Form, Input, Modal, Tag, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;
const { TextArea } = Input;

interface SettingEditModalProps {
	open: boolean;
	editingKey: any | null;
	form: ReturnType<typeof Form.useForm>[0];
	submitting: boolean;
	onOk: () => void;
	onCancel: () => void;
}

const SettingEditModal: React.FC<SettingEditModalProps> = ({
	open,
	editingKey,
	form,
	submitting,
	onOk,
	onCancel,
}) => {
	React.useEffect(() => {
		if (open && editingKey) {
			form.setFieldsValue({
				setting_value: editingKey.value ?? editingKey.setting_value ?? '',
				description: editingKey.description ?? '',
			});
		}
	}, [open, editingKey, form]);

	return (
		<Modal
			title={
				<span>
					<EditOutlined style={{ marginRight: 8, color: '#c90000' }} />
					Chỉnh sửa cài đặt:{' '}
					<Tag style={{ fontFamily: 'monospace', marginLeft: 4 }}>{editingKey?.key}</Tag>
				</span>
			}
			visible={open}
			onOk={onOk}
			onCancel={onCancel}
			okText='Lưu thay đổi'
			cancelText='Huỷ'
			confirmLoading={submitting}
			okButtonProps={{ style: { background: '#c90000', borderColor: '#c90000' } }}
			destroyOnClose
		>
			<Form form={form} layout='vertical' style={{ marginTop: 16 }}>
				<Form.Item
					label='Giá trị mới'
					name='setting_value'
					rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
				>
					<TextArea
						rows={3}
						placeholder='Nhập giá trị mới...'
						style={{ fontFamily: 'monospace' }}
					/>
				</Form.Item>
				<Form.Item label='Mô tả (tuỳ chọn)' name='description'>
					<Input placeholder='Mô tả ý nghĩa của cài đặt này...' />
				</Form.Item>
			</Form>

			{editingKey?.description && (
				<Paragraph type='secondary' style={{ fontSize: 13, marginTop: 4 }}>
					💡 {editingKey.description}
				</Paragraph>
			)}
		</Modal>
	);
};

export default SettingEditModal;
