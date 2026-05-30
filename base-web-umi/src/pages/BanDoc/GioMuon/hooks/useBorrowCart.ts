import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as MuonSach from '@/services/MuonSach';
import { getApiError } from '@/utils/getApiError';

interface CartItem {
  id: string;
  document_id?: string;
  title?: string;
  document_title?: string;
  author?: string;
  document_author?: string;
  cover_image?: string;
  available_copies?: number;
}

export function useBorrowCart(onCheckoutSuccess?: () => void) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const res = await MuonSach.getMyCart();
      setCartItems(res.data?.items || res.data || []);
    } catch (e: any) {
      message.error(getApiError(e, 'Không tải được giỏ mượn'));
    } finally {
      setCartLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      await MuonSach.removeFromCart(itemId);
      setCartItems((prev) => prev.filter((it) => it.id !== itemId));
      message.success('Đã xoá khỏi giỏ mượn');
    } catch (e: any) {
      message.error(getApiError(e, 'Xoá thất bại'));
    }
  }, []);

  const checkout = useCallback(async () => {
    if (cartItems.length === 0) {
      message.warning('Giỏ mượn đang trống!');
      return;
    }
    setCheckoutLoading(true);
    try {
      await MuonSach.checkoutCart();
      message.success('Đã gửi yêu cầu mượn sách thành công!');
      setCartItems([]);
      onCheckoutSuccess?.();
    } catch (e: any) {
      message.error(getApiError(e, 'Gửi yêu cầu thất bại!'));
    } finally {
      setCheckoutLoading(false);
    }
  }, [cartItems, onCheckoutSuccess]);


  return { cartItems, cartLoading, checkoutLoading, loadCart, removeFromCart, checkout };
}
