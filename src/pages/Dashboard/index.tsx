import React from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { useRequest } from "ahooks";
import {
  UserOutlined,
  AppstoreOutlined,
  TeamOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { getDashboardStats } from "../../api/services/dashboard";

const { Text } = Typography;

interface StatsCardProps {
  title: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
}

// Extracted outside DashboardPage to prevent recreation on every render
const StatsCard = React.memo(
  ({ title, value, loading, icon }: StatsCardProps) => (
    <Card
      variant="outlined"
      style={{
        height: "100%",
        borderRadius: 0,
      }}
      styles={{ body: { padding: "16px" } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {title}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Statistic
              value={value}
              loading={loading}
              valueStyle={{ fontWeight: 600, fontSize: 24, color: "#1f1f1f" }}
            />
          </div>
        </div>
        <div
          style={{
            color: "#8c8c8c",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  ),
);

StatsCard.displayName = "StatsCard";

const DashboardPage = () => {
  // Single API call with caching
  const { data, loading } = useRequest(getDashboardStats, {
    cacheKey: "dashboard-stats",
    staleTime: 60000, // 60 seconds - data considered fresh, no refetch
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 12,
      }}
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Pengguna"
            value={data?.totalProfiles}
            loading={loading}
            icon={<UserOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Kegiatan"
            value={data?.totalActivities}
            loading={loading}
            icon={<AppstoreOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Unit Kegiatan"
            value={data?.totalClubs}
            loading={loading}
            icon={<TeamOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Request Curhat"
            value={data?.totalRuangCurhats}
            loading={loading}
            icon={<MessageOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
