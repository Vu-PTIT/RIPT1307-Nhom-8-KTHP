import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { useModel } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import { updateUserInfo, uploadUserAvatar } from '@/services/base/api';
import { getCurrentBorrowCount, getMyBorrows } from '@/services/MuonSach';
import { ipLibrary } from '@/utils/ip';
import moment from 'moment';
import ProfileForm from './components/ProfileForm';
import { getApiError } from '@/utils/getApiError';

export default function TaiKhoanPage() {
  const { initialState, setInitialState } = useModel('@@initialState');
  const user: any = initialState?.currentUser || {};
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [borrowStats, setBorrowStats] = useState({ current: 0, returned: 0 });

  const displayName = user?.full_name || user?.fullName || user?.name || user?.username || 'Người dùng';
  const email = user?.email || 'Chưa cập nhật';
  let roleName = user?.role?.name || user?.role_name || 'Thành viên';
  if (roleName.toLowerCase() === 'admin') roleName = 'Quản trị viên';
  else if (roleName.toLowerCase() === 'librarian') roleName = 'Thủ thư';
  else if (roleName.toLowerCase() === 'member') roleName = 'Độc giả';
  const avatarSrc = user?.avatar ? `${ipLibrary}/auth/avatars/${user.avatar}` : undefined;

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        full_name: displayName,
        gender: user?.gender || user?.gioi_tinh || user?.sex,
        date_of_birth: user?.date_of_birth ? moment(user?.date_of_birth) : undefined,
        phone: user?.phone,
        member_code: user?._id || user?.id,
        avatar: avatarSrc || undefined,
      });
    }
  }, [user, avatarSrc, form]);

  useEffect(() => {
    if (!user || !(user._id || user.id)) return;
    const fetchStats = async () => {
      try {
        const [countRes, allBorrowsRes] = await Promise.all([
          getCurrentBorrowCount(),
          getMyBorrows(),
        ]);
        const returned = (allBorrowsRes?.data || []).filter((b: any) => b.status === 'returned').length;
        setBorrowStats({ current: countRes?.data?.current_borrowed || 0, returned });
      } catch { /* silent */ }
    };
    fetchStats();
  }, [user]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      let newAvatarId = user?.avatar;
      const avatarField = values.avatar;
      if (avatarField && typeof avatarField === 'object' && avatarField.fileList?.length > 0) {
        const file = avatarField.fileList[0].originFileObj;
        if (file) {
          const res = await uploadUserAvatar(file);
          if (res?.data?.avatar) newAvatarId = res.data.avatar;
        }
      }
      const payload = {
        full_name: values.full_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
        phone: values.phone,
      };
      await updateUserInfo(payload);
      message.success('Cập nhật thông tin thành công');
      if (initialState) {
        const updated = { ...initialState.currentUser, ...payload, avatar: newAvatarId } as any;
        setInitialState({ ...initialState, currentUser: updated });
      }
    } catch (e: any) {
      message.error(getApiError(e, 'Có lỗi xảy ra khi cập nhật thông tin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageSkeleton title='Thông tin cá nhân'>
      <div className='library-panel' style={{ padding: 32 }}>
        <ProfileForm
          form={form}
          displayName={displayName}
          email={email}
          roleName={roleName}
          borrowStats={borrowStats}
          loading={loading}
          onFinish={onFinish}
        />
      </div>
    </PageSkeleton>
  );
}
