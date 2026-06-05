import React, { useState } from 'react';
import { Radio, Row, Col, message } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import StatCards from './components/StatCards';
import LogList, { LogItem } from './components/LogList';
import CheckinInputCard from './components/CheckinInputCard';
import { getAllCheckinLogs, getCheckinStats, manualCheckin } from '@/services/ThuThu';
import { getApiError } from '@/utils/getApiError';

type FilterType = 'all' | 'in' | 'out';

const CheckinLogs: React.FC = () => {
  const [checkinCode, setCheckinCode] = useState('');
  const [checkoutCode, setCheckoutCode] = useState('');
  const [actionType, setActionType] = useState<'in' | 'out' | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: statsData, refresh: refreshStats } = useRequest(getCheckinStats, {
    formatResult: (res) => res.data,
  });

  const { data: logsApiData, loading: logsLoading, refresh: refreshLogs } = useRequest(
    () => getAllCheckinLogs({ page, page_size: pageSize }),
    {
      refreshDeps: [page, pageSize],
      formatResult: (res) => res.data,
    },
  );

  const { run: runManualCheckin, loading: actionLoading } = useRequest(
    (code: string, type: 'in' | 'out') => manualCheckin({ user_id: code, check_type: type }),
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
        message.error(`❌ ${getApiError(err, 'Không tìm thấy người dùng!')}`);
        setActionType(null);
      },
    },
  );

  const handleCheck = (type: 'in' | 'out') => {
    const code = (type === 'in' ? checkinCode : checkoutCode).trim();
    if (!code) {
      message.warning('Vui lòng nhập mã sinh viên hoặc mã thẻ!');
      return;
    }
    setActionType(type);
    runManualCheckin(code, type);
  };

  const stats = statsData || { currently_in_library: 0, today_checkin: 0, total_logs: 0 };
  const logs = logsApiData?.items || logsApiData || [];
  const logsTotal = logsApiData?.total || 0;

  return (
    <PageSkeleton
      title='Kiểm soát ra vào'
      subtitle='Theo dõi nhật ký ra vào thư viện trực tiếp'
    >
      <div className='library-panel'>
        <StatCards
          currentInLibrary={stats.currently_in_library}
          todayCheckin={stats.today_checkin}
          totalLogs={stats.total_logs}
        />

        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <CheckinInputCard
              title={<><LoginOutlined style={{ color: '#52c41a', marginRight: 8 }} />Check-in (Vào thư viện)</>}
              placeholder='Nhập mã thẻ để vào...'
              value={checkinCode}
              onChange={setCheckinCode}
              onConfirm={() => handleCheck('in')}
              loading={actionLoading && actionType === 'in'}
              confirmLabel='Vào'
              confirmIcon={<LoginOutlined />}
              confirmStyle={{ background: '#52c41a', borderColor: '#52c41a' }}
            />
          </Col>
          <Col xs={24} md={12}>
            <CheckinInputCard
              title={<><LogoutOutlined style={{ color: '#f5222d', marginRight: 8 }} />Check-out (Ra về)</>}
              placeholder='Nhập mã thẻ để ra...'
              value={checkoutCode}
              onChange={setCheckoutCode}
              onConfirm={() => handleCheck('out')}
              loading={actionLoading && actionType === 'out'}
              confirmLabel='Ra'
              confirmIcon={<LogoutOutlined />}
              confirmStyle={{ background: '#f5222d', borderColor: '#f5222d' }}
            />
          </Col>
        </Row>



        <LogList 
          data={logs} 
          loading={logsLoading} 
          pagination={{
            current: page,
            pageSize: pageSize,
            total: logsTotal,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s || 10);
            },
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} lượt`
          }}
        />
      </div>
    </PageSkeleton>
  );
};

export default CheckinLogs;
