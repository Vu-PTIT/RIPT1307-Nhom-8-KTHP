import React from 'react';
import { Card, Input, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface CheckinInputCardProps {
  title: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel: string;
  confirmIcon: React.ReactNode;
  confirmStyle?: React.CSSProperties;
}

const CheckinInputCard: React.FC<CheckinInputCardProps> = ({
  title,
  placeholder,
  value,
  onChange,
  onConfirm,
  loading,
  confirmLabel,
  confirmIcon,
  confirmStyle,
}) => (
  <Card
    title={title}
    bordered={false}
    style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
  >
    <div className='tt-checkin-input-row'>
      <Input
        size='large'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onConfirm}
        prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
      />
      <Button
        type='primary'
        size='large'
        icon={confirmIcon}
        onClick={onConfirm}
        loading={loading}
        style={confirmStyle}
      >
        {confirmLabel}
      </Button>
    </div>
  </Card>
);

export default CheckinInputCard;
