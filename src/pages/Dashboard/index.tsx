import { Card, Col, Row, Statistic } from "antd";
import { useRequest } from "ahooks";
import { UserOutlined } from "@ant-design/icons";
import { getProfiles } from "../../api/services/member";
import { getActivities } from "../../api/services/activity";

const DashboardPage = () => {
  const { data: profileData, loading: profileLoading } = useRequest(() =>
    getProfiles({ page: "1", per_page: "10" }),
  );

  const { data: activityData, loading: activityLoading } = useRequest(() =>
    getActivities({ page: "1", per_page: "10" }),
  );

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card bordered={false}>
          <Statistic
            title="Jumlah Pengguna"
            value={profileData?.meta.total}
            loading={profileLoading}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card bordered={false}>
          <Statistic
            title="Jumlah Kegiatan"
            value={activityData?.meta.total}
            loading={activityLoading}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardPage;
