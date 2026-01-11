import { Button, Space, Row, Col, Skeleton, Tag, Typography } from "antd";
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
      <div
        style={{
          background: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: 8,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space direction="vertical" size={4}>
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                Total Peserta Terdaftar
              </Typography.Text>
              <Space align="center" size="small">
                <TeamOutlined style={{ fontSize: 28, color: "#1890ff" }} />
                <Typography.Title
                  level={2}
                  style={{ margin: 0, color: "#1890ff" }}
                >
                  {total}
                </Typography.Title>
                <Typography.Text type="secondary">Orang</Typography.Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleManageParticipants}
            >
              Kelola & Lihat Detail Peserta
            </Button>
          </Col>
        </Row>
      </div>

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

            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e8e8e8",
                    background: "#fff",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.3s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "#d9d9d9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e8e8e8";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        marginRight: 8,
                        display: "flex",
                        padding: 6,
                        background: `${config.color === "blue" ? "#e6f7ff" : config.color === "green" ? "#f6ffed" : config.color === "red" ? "#fff1f0" : "#f9f0ff"}`,
                        borderRadius: "50%",
                        color:
                          config.color === "blue"
                            ? "#1890ff"
                            : config.color === "green"
                              ? "#52c41a"
                              : config.color === "red"
                                ? "#ff4d4f"
                                : "#722ed1",
                      }}
                    >
                      {config.icon}
                    </div>
                    <Typography.Text
                      strong
                      style={{ fontSize: 13, lineHeight: 1.2 }}
                    >
                      {config.label}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                      {count}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {percentage}% dari total
                    </Typography.Text>
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
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e8e8e8",
                    background: "#fff",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Tag
                      style={{
                        margin: 0,
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {status}
                    </Tag>
                  </div>
                  <div>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                      {count}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {percentage}% dari total
                    </Typography.Text>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default memo(RegistrantList);
