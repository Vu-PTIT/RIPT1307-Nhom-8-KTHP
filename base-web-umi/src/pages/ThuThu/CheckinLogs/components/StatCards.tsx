import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { UsergroupAddOutlined, LoginOutlined, HistoryOutlined } from '@ant-design/icons';

interface StatCardsProps {
  currentInLibrary: number;
  todayCheckin: number;
  totalLogs: number;
}

const StatCards: React.FC<StatCardsProps> = ({ currentInLibrary, todayCheckin, totalLogs }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {/* Ô 1: Hiện tại trong thư viện */}
      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Statistic
            title={<span style={{ color: '#8c8c8c' }}>Hiện tại trong thư viện</span>}
            value={currentInLibrary}
            prefix={<UsergroupAddOutlined style={{ color: '#52c41a', backgroundColor: '#f6ffed', padding: 8, borderRadius: 8, marginRight: 8 }} />}
          />
        </Card>
      </Col>

      {/* Ô 2: Check-in hôm nay */}
      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Statistic
            title={<span style={{ color: '#8c8c8c' }}>Check-in hôm nay</span>}
            value={todayCheckin}
            prefix={<LoginOutlined style={{ color: '#ff4d4f', backgroundColor: '#fff1f0', padding: 8, borderRadius: 8, marginRight: 8 }} />}
          />
        </Card>
      </Col>

      {/* Ô 3: Tổng nhật ký */}
      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Statistic
            title={<span style={{ color: '#8c8c8c' }}>Tổng nhật ký</span>}
            value={totalLogs}
            prefix={<HistoryOutlined style={{ color: '#722ed1', backgroundColor: '#f9f0ff', padding: 8, borderRadius: 8, marginRight: 8 }} />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatCards;