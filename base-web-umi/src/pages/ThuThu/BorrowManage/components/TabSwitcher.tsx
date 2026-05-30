import React from 'react';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

type TabKey = 'borrow' | 'return' | 'reserve';

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

interface TabSwitcherProps {
  activeTab: TabKey;
  onChange: (key: TabKey) => void;
}

const TABS: Tab[] = [
  { key: 'borrow', label: 'Cho mượn', icon: <BookOutlined /> },
  { key: 'return', label: 'Nhận trả', icon: <CheckCircleOutlined /> },
  { key: 'reserve', label: 'Đặt trước', icon: <ClockCircleOutlined /> },
];

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onChange }) => (
  <div className='tt-tab-switcher'>
    {TABS.map((tab) => (
      <div
        key={tab.key}
        className={`tt-tab-item${activeTab === tab.key ? ' active' : ''}`}
        role='button'
        tabIndex={0}
        onClick={() => onChange(tab.key)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(tab.key)}
      >
        {tab.icon}
        <span>{tab.label}</span>
      </div>
    ))}
  </div>
);

export default TabSwitcher;
