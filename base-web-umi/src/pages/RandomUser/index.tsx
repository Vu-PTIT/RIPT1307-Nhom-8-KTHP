import type { IColumn } from '@/components/Table/typing';
import { Button, Modal, Table } from 'antd';
import { useEffect } from 'react';
import { useModel } from 'umi';
import FormRandomUser from './Form';

const RandomUser = () => {
	const { data, getDataUser, setRow, isEdit, setVisible, setIsEdit, visible } = useModel('randomuser');

	useEffect(() => {
		getDataUser();
	}, []);

	const columns: IColumn<RandomUser.Record>[] = [
		{
			title: 'Địa chỉ',
			dataIndex: 'address',
			key: 'name',
			width: 200,
		},
		{
			title: 'Số dư',
			dataIndex: 'balance',
			key: 'age',
			width: 100,
		},
		{
			title: 'Thao tác',
			width: 200,
			align: 'center',
			render: (record) => {
				return (
					<div>
						<Button
							onClick={() => {
								setVisible(true);
								setRow(record);
								setIsEdit(true);
							}}
						>
							Sửa
						</Button>
						<Button
							style={{ marginLeft: 10 }}
							onClick={() => {
								const dataLocal: any = JSON.parse(localStorage.getItem('data') as any);
								const newData = dataLocal.filter((item: any) => item.address !== record.address);
								localStorage.setItem('data', JSON.stringify(newData));
								getDataUser();
							}}
							type='primary'
						>
							Xóa
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<div>
			<Button
				type='primary'
				onClick={() => {
					setVisible(true);
					setIsEdit(false);
				}}
			>
				Thêm người dùng
			</Button>

			<Table dataSource={data} columns={columns} />

			<Modal
				destroyOnClose
				footer={false}
				title={isEdit ? 'Sửa thông tin' : 'Thêm người dùng'}
				visible={visible}
				onOk={() => {}}
				onCancel={() => {
					setVisible(false);
				}}
			>
				<FormRandomUser />
			</Modal>
		</div>
	);
};

export default RandomUser;
