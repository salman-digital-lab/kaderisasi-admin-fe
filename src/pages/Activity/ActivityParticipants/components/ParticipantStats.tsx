import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Skeleton,
  Progress,
  Collapse,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { memo } from "react";

interface ParticipantStatsProps {
  total: number;
  byStatus: Record<string, number>;
  loading?: boolean;
}

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
  DITOLAK: { color: "red", icon: <CloseCircleOutlined />, label: "Ditolak" },
};

const ParticipantStats = ({
  total,
  byStatus,
  loading,
}: ParticipantStatsProps) => {
  if (loading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  const primaryStatuses = [
    "TERDAFTAR",
    "DITERIMA",
    "LULUS KEGIATAN",
    "TIDAK LULUS",
    "TIDAK DITERIMA",
  ];
  const customStatuses = Object.keys(byStatus).filter(
    (s) => !primaryStatuses.includes(s),
  );

  return (
    <Collapse
      defaultActiveKey={[]}
      style={{ marginBottom: 16 }}
      items={[
        {
          key: "1",
          label: (
            <span>
              <UserOutlined style={{ marginRight: 8 }} />
              Statistik Peserta
              <Tag color="blue" style={{ marginLeft: 12 }}>
                {total} peserta
              </Tag>
            </span>
          ),
          children: (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8} md={6} lg={4}>
                  <Statistic
                    title="Total Peserta"
                    value={total}
                    valueStyle={{ color: "#1890ff", fontSize: 28 }}
                    prefix={<UserOutlined />}
                  />
                </Col>

                {primaryStatuses.map((status) => {
                  const count = byStatus[status] || 0;
                  const config = statusConfig[status];
                  if (!config) return null;

                  const percentage =
                    total > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <Col xs={12} sm={8} md={6} lg={4} key={status}>
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color={config.color} icon={config.icon}>
                            {config.label}
                          </Tag>
                        </div>
                        <Statistic
                          value={count}
                          suffix={
                            <span style={{ fontSize: 14, color: "#999" }}>
                              ({percentage}%)
                            </span>
                          }
                        />
                        <Progress
                          percent={percentage}
                          showInfo={false}
                          strokeColor={config.color}
                          size="small"
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>

              {customStatuses.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ marginBottom: 8, color: "#666" }}>
                    Status Kustom:
                  </div>
                  <Row gutter={[16, 8]}>
                    {customStatuses.map((status) => {
                      const count = byStatus[status] || 0;
                      const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <Col xs={12} sm={8} md={6} lg={4} key={status}>
                          <Tag color="default">{status}</Tag>
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontWeight: 500 }}>{count}</span>
                            <span style={{ color: "#999", marginLeft: 4 }}>
                              ({percentage}%)
                            </span>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
            </>
          ),
        },
      ]}
    />
  );
};

export default memo(ParticipantStats);
