import { useState } from 'react';
import { message } from 'antd';

export default function useBorrowModel() {
	const [cart, setCart] = useState<{ copy_code: string }[]>([]);
	const [readerId, setReaderId] = useState<string>('');

	const addBook = (code: string) => {
		const isExist = cart.some((item) => item.copy_code === code);
		if (isExist) {
			message.warning('Cuốn sách này đã quét rồi!');
		} else {
			setCart([...cart, { copy_code: code }]);
			message.success('Đã thêm vào danh sách!');
		}
	};

	const removeBook = (code: string) => {
		setCart(cart.filter((item) => item.copy_code !== code));
	};

	const clearSession = () => {
		setCart([]);
		setReaderId('');
	};

	return { cart, readerId, setReaderId, addBook, removeBook, clearSession };
}
