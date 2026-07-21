import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Modal,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";

import { putClub } from "../../../../api/services/club";
import type { Club } from "../../../../types/model/club";
import type {
  ClubChecklistItem,
  ClubReadiness,
  ClubSection,
} from "../../utils/club-workspace";

const { Paragraph, Text, Title } = Typography;

const REGISTRATION_STATUS: Record<
  ClubReadiness["registrationState"],
  { color: string; label: string }
> = {
  not_configured: { color: "default", label: "Belum disiapkan" },
  needs_attention: { color: "warning", label: "Perlu diperbaiki" },
  ready: { color: "processing", label: "Siap dibuka" },
  open: { color: "success", label: "Pendaftaran dibuka" },
  expired: { color: "warning", label: "Tanggal berakhir" },
};

type ClubOverviewProps = {
  club: Club;
  readiness: ClubReadiness;
  isNewDraft: boolean;
  onUpdated: (club: Club) => void;
  onNavigate: (section: ClubSection) => void;
};

type ChecklistProps = {
  items: ClubChecklistItem[];
  onNavigate: (section: ClubSection) => void;
};

const Checklist = ({ items, onNavigate }: ChecklistProps) => (
  <List
    dataSource={items}
    renderItem={(item) => (
      <List.Item
        actions={[
          <Button
            key={item.key}
            type="link"
            onClick={() => onNavigate(item.section)}
          >
            {item.complete ? "Lihat" : "Lengkapi"}
          </Button>,
        ]}
      >
        <List.Item.Meta
          avatar={
            item.complete ? (
              <CheckCircleFilled
                style={{ color: "#52c41a" }}
                aria-label="Selesai"
              />
            ) : (
              <ClockCircleOutlined
                style={{ color: "#8c8c8c" }}
                aria-label="Belum selesai"
              />
            )
          }
          title={
            <Space size="small" wrap>
              <Text>{item.label}</Text>
              {item.priority === "required" ? (
                <Tag color="blue">Wajib</Tag>
              ) : item.priority === "recommended" ? (
                <Tag>Disarankan</Tag>
              ) : null}
            </Space>
          }
          description={item.description}
        />
      </List.Item>
    )}
  />
);

const ClubOverview = ({
  club,
  readiness,
  isNewDraft,
  onUpdated,
  onNavigate,
}: ClubOverviewProps) => {
  const [modal, modalContextHolder] = Modal.useModal();
  const registrationStatus = REGISTRATION_STATUS[readiness.registrationState];
  const completedProfileItems = readiness.profileItems.filter(
    (item) => item.complete,
  ).length;
  const profileProgress = Math.round(
    (completedProfileItems / readiness.profileItems.length) * 100,
  );
  const { loading: updatingVisibility, runAsync: updateVisibility } =
    useRequest((isShow: boolean) => putClub(club.id, { is_show: isShow }), {
      manual: true,
      onSuccess: (updatedClub) => onUpdated({ ...club, ...updatedClub }),
    });

  const publishClub = (): void => {
    if (readiness.missingRecommendedItems.length === 0) {
      void updateVisibility(true);
      return;
    }

    modal.confirm({
      title: "Publikasikan profil yang belum lengkap?",
      content: (
        <Space direction="vertical" size="small">
          <Text>
            Klub tetap dapat ditayangkan. Beberapa informasi yang disarankan
            belum tersedia:
          </Text>
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            {readiness.missingRecommendedItems.map((item) => (
              <li key={item.key}>{item.label}</li>
            ))}
          </ul>
        </Space>
      ),
      okText: "Tetap Publikasikan",
      cancelText: "Lengkapi Profil",
      onCancel: () => onNavigate("profile"),
      onOk: () => updateVisibility(true),
    });
  };

  const unpublishClub = (): void => {
    modal.confirm({
      title: "Sembunyikan klub dari halaman publik?",
      content:
        "Data klub tetap tersimpan dan dapat diedit, tetapi profilnya tidak terlihat oleh pengguna.",
      okText: "Sembunyikan Klub",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () => updateVisibility(false),
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      {modalContextHolder}
      {isNewDraft ? (
        <Alert
          type="info"
          showIcon
          title="Draf klub berhasil dibuat"
          description="Pilih jalur yang sesuai: publikasikan profil saja, atau siapkan pendaftaran online terlebih dahulu. Progres dapat dilanjutkan kapan saja."
        />
      ) : null}

      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Ringkasan Pengaturan
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Gunakan daftar berikut untuk melihat apa yang sudah siap dan tindakan
          berikutnya.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Jalur 1 · Publikasikan Profil"
            extra={
              <Tag color={club.is_show ? "success" : "default"}>
                {club.is_show ? "Sudah tayang" : "Masih draf"}
              </Tag>
            }
            style={{ height: "100%" }}
          >
            <Paragraph>
              Cocok untuk klub yang hanya membutuhkan halaman informasi publik
              tanpa pendaftaran online.
            </Paragraph>
            <Progress
              percent={profileProgress}
              aria-label={`${completedProfileItems} dari ${readiness.profileItems.length} item profil selesai`}
            />
            <Checklist items={readiness.profileItems} onNavigate={onNavigate} />
            <Space wrap>
              {club.is_show ? (
                <Button
                  danger
                  icon={<EyeInvisibleOutlined />}
                  loading={updatingVisibility}
                  onClick={unpublishClub}
                >
                  Sembunyikan Klub
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  loading={updatingVisibility}
                  onClick={publishClub}
                >
                  Publikasikan Klub
                </Button>
              )}
              <Button
                icon={<ArrowRightOutlined />}
                onClick={() => onNavigate("profile")}
              >
                Edit Profil
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Jalur 2 · Pendaftaran Online"
            extra={
              <Tag color={registrationStatus.color}>
                {registrationStatus.label}
              </Tag>
            }
            style={{ height: "100%" }}
          >
            <Paragraph>
              Pilih jalur ini jika calon anggota perlu mengisi form dan ditinjau
              oleh admin.
            </Paragraph>
            <Checklist
              items={readiness.registrationItems}
              onNavigate={onNavigate}
            />
            <Button
              type={
                readiness.registrationState === "open" ? "default" : "primary"
              }
              icon={<FormOutlined />}
              onClick={() => onNavigate("registration")}
            >
              {readiness.registrationState === "open"
                ? "Kelola Pendaftaran"
                : "Siapkan Pendaftaran"}
            </Button>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default ClubOverview;
