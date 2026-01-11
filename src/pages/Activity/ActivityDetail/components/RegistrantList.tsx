import { Button, Space, Row, Col, Skeleton, Tag, Typography, Card } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useCallback, memo, ReactNode } from "react";
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
  { color: string; icon: ReactNode; label: string }
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
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div>
      <MembersListModal open={modalState} toggle={toggleModal} />

      {/* Summary Banner */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 24 }}
        styles={{ body: { padding: "24px" } }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space direction="vertical" size={4}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Total Peserta Terdaftar
              </Typography.Text>
              <Space align="center" size="small">
                <TeamOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />
                <Typography.Title
                  level={3}
                  style={{ margin: 0, fontWeight: 600 }}
                >
                  {total}
                </Typography.Title>
                <Typography.Text type="secondary">Orang</Typography.Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ArrowRightOutlined />}
              onClick={handleManageParticipants}
            >
              Kelola & Lihat Detail Peserta
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics by Status */}
      <div>
        <Typography.Title level={5} style={{ marginBottom: 16 }}>
          Ringkasan Status Peserta
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {primaryStatuses.map((status) => {
            const count = byStatus[status] || 0;
            const config = statusConfig[status];
            if (!config) return null;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
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
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                      >
                        {config.label}
                      </Typography.Text>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Title
                          level={3}
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {count}
                        </Typography.Title>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {total > 0 ? Math.round((count / total) * 100) : 0}%
                        </Typography.Text>
                      </div>
                    </div>
                    <div
                      style={{
                        color:
                          config.color === "blue"
                            ? "#1890ff"
                            : config.color === "green"
                              ? "#52c41a"
                              : config.color === "red"
                                ? "#ff4d4f"
                                : "#722ed1",
                        fontSize: 20,
                      }}
                    >
                      {config.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}

          {/* Custom statuses */}
          {customStatuses.map((status) => {
            const count = byStatus[status] || 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
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
                    <div style={{ width: "100%" }}>
                      <Tag
                        style={{
                          margin: "0 0 4px 0",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {status}
                      </Tag>
                      <div>
                        <Typography.Title
                          level={3}
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {count}
                        </Typography.Title>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {total > 0 ? Math.round((count / total) * 100) : 0}%
                        </Typography.Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default memo(RegistrantList);
