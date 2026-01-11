import { Card, Col, Row, Statistic, Typography } from "antd";
import { useRequest } from "ahooks";
import {
  UserOutlined,
  AppstoreOutlined,
  TeamOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { getProfiles } from "../../api/services/member";
import { getActivities } from "../../api/services/activity";
import { getClubs } from "../../api/services/club";
import { getRuangCurhats } from "../../api/services/ruangcurhat";

const { Text } = Typography;

const DashboardPage = () => {
  const { data: profileData, loading: profileLoading } = useRequest(() =>
    getProfiles({ page: "1", per_page: "1" }),
  );

  const { data: activityData, loading: activityLoading } = useRequest(() =>
    getActivities({ page: "1", per_page: "1" }),
  );

  const { data: clubData, loading: clubLoading } = useRequest(() =>
    getClubs({ page: "1", per_page: "1" }),
  );

  const { data: curhatData, loading: curhatLoading } = useRequest(() =>
    getRuangCurhats({
      page: "1",
      per_page: "1",
    }),
  );

  // Compact Stats Card Component
  const StatsCard = ({ title, value, loading, icon }: any) => (
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
  );

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
            value={profileData?.meta.total}
            loading={profileLoading}
            icon={<UserOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Kegiatan"
            value={activityData?.meta.total}
            loading={activityLoading}
            icon={<AppstoreOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Unit Kegiatan"
            value={clubData?.meta.total}
            loading={clubLoading}
            icon={<TeamOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="Total Request Curhat"
            value={curhatData?.meta.total}
            loading={curhatLoading}
            icon={<MessageOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
