import React from 'react';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

type TabKey = 'borrow' | 'reserve';

interface Tab {
  key: TabKey;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface TabSwitcherProps {
  activeTab: TabKey;
  onChange: (key: TabKey) => void;
}

const TABS: Tab[] = [
  { key: 'borrow', label: 'Cho mượn', subtitle: 'Tạo phiếu mới', icon: <BookOutlined /> },
  { key: 'reserve', label: 'Đặt trước', subtitle: 'Xử lý yêu cầu', icon: <ClockCircleOutlined /> },
];

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onChange }) => (
  <div className='library-stats-switch' style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
    {TABS.map((tab) => (
      <div
        key={tab.key}
        className={`library-stat clickable ${activeTab === tab.key ? 'active' : ''}`}
        role='button'
        tabIndex={0}
        onClick={() => onChange(tab.key)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(tab.key)}
      >
        {tab.icon}
        <div>
          <span>{tab.subtitle}</span>
          <strong>{tab.label}</strong>
        </div>
      </div>
    ))}
  </div>
);

export default TabSwitcher;
