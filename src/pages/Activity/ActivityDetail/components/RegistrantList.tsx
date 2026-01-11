import { Card, Button, Space, Row, Col, Statistic, Skeleton, Tag } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useCallback, memo } from "react";
import { useRequest, useToggle } from "ahooks";
import { useParams, useNavigate } from "react-router-dom";

import {
  getActivity,
  getRegistrantStatistics,
} from "../../../../api/services/activity";

import MembersListModal from "./Modal/MembersListModal";

// Status configuration for display
const statusConfig: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  TERDAFTAR: {
    color: "blue",
    icon: <ClockCircleOutlined />,
    label: "Terdaftar",
  },
  DITERIMA: {
    color: "green",
    icon: <CheckCircleOutlined />,
    label: "Diterima",
  },
  "LULUS KEGIATAN": {
    color: "purple",
    icon: <TrophyOutlined />,
    label: "Lulus Kegiatan",
  },
  "TIDAK LULUS": {
    color: "red",
    icon: <CloseCircleOutlined />,
    label: "Tidak Lulus",
  },
  "TIDAK DITERIMA": {
    color: "red",
    icon: <CloseCircleOutlined />,
    label: "Tidak Diterima",
  },
};

const RegistrantList = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [modalState, { toggle: toggleModal }] = useToggle();

  // Fetch activity details
  const { loading: activityLoading } = useRequest(
    () => getActivity(Number(id)),
    {
      cacheKey: `activity-${id}`,
    },
  );

  // Fetch participant statistics
  const { data: stats, loading: statsLoading } = useRequest(
    () => getRegistrantStatistics(id),
    {
      refreshDeps: [id],
    },
  );

  // Navigate to full participant management page
  const handleManageParticipants = useCallback(() => {
    navigate(`/activity/${id}/participants`);
  }, [navigate, id]);

  const primaryStatuses = [
    "TERDAFTAR",
    "DITERIMA",
    "LULUS KEGIATAN",
    "TIDAK LULUS",
    "TIDAK DITERIMA",
  ];
  const byStatus = stats?.by_status || {};
  const total = stats?.total || 0;
  const customStatuses = Object.keys(byStatus).filter(
    (s) => !primaryStatuses.includes(s),
  );

  if (statsLoading || activityLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <MembersListModal open={modalState} toggle={toggleModal} />

      {/* Header Card */}
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Statistic
              title="Total Peserta"
              value={total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={handleManageParticipants}
            >
              Kelola Peserta <ArrowRightOutlined />
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics by Status */}
      <Card title="Statistik Berdasarkan Status" size="small">
        <Row gutter={[16, 16]}>
          {primaryStatuses.map((status) => {
            const count = byStatus[status] || 0;
            const config = statusConfig[status];
            if (!config) return null;

            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #f0f0f0",
                    background: "#fafafa",
                  }}
                >
                  <Tag
                    color={config.color}
                    icon={config.icon}
                    style={{ marginBottom: 8 }}
                  >
                    {config.label}
                  </Tag>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 600 }}>
                      {count}
                    </span>
                    <span
                      style={{ fontSize: 12, color: "#999", marginLeft: 4 }}
                    >
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              </Col>
            );
          })}

          {/* Custom statuses */}
          {customStatuses.map((status) => {
            const count = byStatus[status] || 0;
            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #f0f0f0",
                    background: "#fafafa",
                  }}
                >
                  <Tag color="default" style={{ marginBottom: 8 }}>
                    {status}
                  </Tag>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 600 }}>
                      {count}
                    </span>
                    <span
                      style={{ fontSize: 12, color: "#999", marginLeft: 4 }}
                    >
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </Space>
  );
};

export default memo(RegistrantList);
