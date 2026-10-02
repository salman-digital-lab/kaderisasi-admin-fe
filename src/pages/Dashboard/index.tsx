import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import LoadErrorAlert from "../../components/common/LoadErrorAlert";
import { useRequest } from "ahooks";
import {
  UserOutlined,
  ScheduleOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/services/dashboard";
import PageHeader from "../../components/common/PageHeader";
import { NAV_LABELS } from "../../constants/navigation";
import { usePermissions } from "../../stores/authStore";
import { APP_COLORS } from "../../theme/tokens";

interface StatsCardProps {
  title: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  /** Destination with the full list; omitted when the user cannot open it. */
  to?: string;
  linkLabel: string;
}

const StatsCard = React.memo(
  ({ title, value, loading, icon, to, linkLabel }: StatsCardProps) => (
    <Card
      style={{ height: "100%" }}
      actions={
        to
          ? [
              <Link key="open" to={to}>
                {linkLabel}
              </Link>,
            ]
          : undefined
      }
    >
      <Statistic
        title={title}
        value={value}
        loading={loading}
        prefix={
          <span style={{ color: APP_COLORS.primary, marginRight: 4 }}>
            {icon}
          </span>
        }
        styles={{ content: { fontWeight: 600 } }}
      />
    </Card>
  ),
);

StatsCard.displayName = "StatsCard";

const DashboardPage = () => {
  const permissions = usePermissions();
  const { data, loading, refresh } = useRequest(getDashboardStats, {
    cacheKey: "dashboard-stats",
    staleTime: 60000,
  });
  const failed = !loading && !data;

  return (
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.dashboard}
        description="Ringkasan data utama Sistem Kaderisasi BMKA."
      />
      {failed && (
        <LoadErrorAlert title="Ringkasan gagal dimuat" onRetry={refresh} />
      )}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8}>
          <StatsCard
            title="Total Anggota"
            value={data?.totalProfiles}
            loading={loading}
            icon={<UserOutlined />}
            to={permissions.includes("members.read") ? "/member" : undefined}
            linkLabel="Lihat anggota"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatsCard
            title="Total Kegiatan"
            value={data?.totalActivities}
            loading={loading}
            icon={<ScheduleOutlined />}
            to={
              permissions.includes("activities.read") ? "/activity" : undefined
            }
            linkLabel="Lihat kegiatan"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatsCard
            title="Total Permintaan Curhat"
            value={data?.totalRuangCurhats}
            loading={loading}
            icon={<WechatOutlined />}
            to={
              permissions.includes("counseling.read")
                ? "/ruang-curhat"
                : undefined
            }
            linkLabel="Lihat permintaan"
          />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
