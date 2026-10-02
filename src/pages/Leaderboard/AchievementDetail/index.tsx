import { ResponsiveDescriptions as Descriptions } from "../../../components/common/Responsive/ResponsiveDescriptions";
import { validateFieldsAndFocus } from "../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import {
  Button,
  Card,
  DescriptionsProps,
  Space,
  Tag,
  Dropdown,
  MenuProps,
  InputNumber,
  Form,
  Input,
  Flex,
  Typography,
} from "antd";
import PageHeader from "../../../components/common/PageHeader";
import { useParams } from "react-router-dom";
import { DownloadOutlined, DownOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import dayjs from "dayjs";
import { useState } from "react";

import {
  getAchievement,
  approveAchievement,
} from "../../../api/services/achievement";
import { getProfileByUserId } from "../../../api/services/member";
import {
  renderAchievementStatus,
  renderAchievementStatusColor,
  renderAchievementType,
  renderUserLevel,
} from "../../../constants/render";
import { ACHIEVEMENT_STATUS_ENUM } from "../../../types/constants/achievement";
import { handleError } from "../../../api/errorHandling";
import { DATE_FORMAT } from "../../../utils/date-format";
const UPDATE_STATUS_MENU = [
  {
    key: ACHIEVEMENT_STATUS_ENUM.APPROVED,
    label: "Setujui",
  },
  {
    key: ACHIEVEMENT_STATUS_ENUM.REJECTED,
    label: "Tolak",
  },
];

const AchievementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const { data, loading, refresh } = useRequest(() =>
    getAchievement({ id: id || "" }),
  );

  const { data: profileData } = useRequest(
    () => getProfileByUserId(String(data?.user_id)),
    {
      ready: !!data?.user_id,
    },
  );

  const { loading: approveLoading, runAsync } = useRequest(approveAchievement, {
    manual: true,
  });

  const basicInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Email Pendaftar",
      children: data?.user?.email,
    },
    {
      key: "2",
      label: "Nama Pendaftar",
      children: profileData?.profile[0]?.name,
    },
    {
      key: "3",
      label: "Kampus/Universitas",
      children: profileData?.profile[0]?.university?.name || "-",
    },
    {
      key: "4",
      label: "Jenjang",
      children: renderUserLevel(profileData?.profile[0]?.level),
    },
  ];

  const achievementInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Nama Prestasi",
      children: data?.name,
    },
    {
      key: "3",
      label: "Tanggal Prestasi",
      children: dayjs(data?.achievement_date).format(DATE_FORMAT),
    },
    {
      key: "4",
      label: "Jenis Prestasi",
      children: renderAchievementType(data?.type),
    },
    {
      key: "5",
      label: "Skor",
      children: data?.score,
    },
    {
      key: "2",
      label: "Deskripsi",
      children: data?.description,
    },
  ];

  const approvalInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Status",
      children: (
        <Tag color={renderAchievementStatusColor(data?.status)}>
          {renderAchievementStatus(data?.status)}
        </Tag>
      ),
    },
    {
      key: "2",
      label: "Catatan",
      children: data?.remark,
    },
    {
      key: "3",
      label: "Disetujui Oleh",
      children: data?.approver?.display_name || "-",
    },
    {
      key: "4",
      label: "Tanggal Persetujuan",
      children: data?.approved_at
        ? dayjs(data?.approved_at).format(DATE_FORMAT)
        : "-",
    },
  ];

  const handleStatusUpdate = (status: number) => {
    if (status === ACHIEVEMENT_STATUS_ENUM.APPROVED) {
      setIsScoreModalOpen(true);
    } else {
      setIsRejectModalOpen(true);
    }
  };

  const handleApproveAchievement = (
    status: number,
    score?: number,
    remark?: string,
  ) => {
    runAsync({
      id: id || "",
      status: status,
      score: score,
      remark: remark,
    })
      .then(() => {
        setIsScoreModalOpen(false);
        setIsRejectModalOpen(false);
        form.resetFields();
        rejectForm.resetFields();
        refresh();
      })
      .catch((error) => {
        handleError(error);
      });
  };

  return (
    <div className="page-container">
      <PageHeader
        back={{ to: "/achievement", label: "Kembali ke daftar prestasi" }}
        title={data?.name || "Detail Prestasi"}
        extra={
          <>
            <Button
              icon={<DownloadOutlined />}
              disabled={!data?.proof}
              onClick={() => {
                window.open(
                  `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${data?.proof}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              Unduh bukti
            </Button>
            {data?.status === ACHIEVEMENT_STATUS_ENUM.PENDING && (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: UPDATE_STATUS_MENU?.map((item) => ({
                    ...item,
                    onClick: () => handleStatusUpdate(Number(item?.key || "0")),
                  })) as MenuProps["items"],
                }}
              >
                <Button type="primary" loading={approveLoading}>
                  <Space>
                    Ubah status
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}
          </>
        }
      />
      <Flex vertical gap={12}>
        <Card title="Informasi Dasar" loading={loading}>
          <Descriptions column={2} bordered size="small" items={basicInfo} />
        </Card>
        <Card title="Detail Prestasi" loading={loading}>
          <Descriptions
            column={2}
            bordered
            size="small"
            items={achievementInfo}
          />
        </Card>
        <Card title="Informasi Persetujuan" loading={loading}>
          <Descriptions column={2} bordered size="small" items={approvalInfo} />
        </Card>
      </Flex>

      <Modal
        title="Masukkan Skor Prestasi"
        open={isScoreModalOpen}
        onCancel={() => {
          setIsScoreModalOpen(false);
          form.resetFields();
        }}
        onOk={() => {
          validateFieldsAndFocus(form).then((values) => {
            Modal.confirm({
              title: "Konfirmasi Persetujuan",
              content: (
                <>
                  <Typography.Paragraph type="danger">
                    Keputusan tidak dapat diubah setelah disetujui.
                  </Typography.Paragraph>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    Setujui prestasi ini dengan skor{" "}
                    <strong>{values.score}</strong>?
                  </Typography.Paragraph>
                </>
              ),
              onOk: () => {
                handleApproveAchievement(
                  ACHIEVEMENT_STATUS_ENUM.APPROVED,
                  values.score,
                );
              },
            });
          });
        }}
      >
        <Form
          scrollToFirstError={{ focus: true }}
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="score"
            label="Skor"
            rules={[
              { required: true, message: "Mohon masukkan skor" },
              {
                type: "number",
                min: 0,
                message: "Skor harus lebih besar dari 0",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Masukkan Alasan Penolakan"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        onOk={() => {
          validateFieldsAndFocus(rejectForm).then((values) => {
            Modal.confirm({
              title: "Konfirmasi Penolakan",
              content: "Apakah Anda yakin ingin menolak prestasi ini?",
              onOk: () => {
                handleApproveAchievement(
                  ACHIEVEMENT_STATUS_ENUM.REJECTED,
                  undefined,
                  values.remark,
                );
              },
            });
          });
        }}
      >
        <Form
          scrollToFirstError={{ focus: true }}
          form={rejectForm}
          layout="vertical"
        >
          <Form.Item
            name="remark"
            label="Alasan Penolakan"
            rules={[
              { required: true, message: "Mohon masukkan alasan penolakan" },
              { min: 10, message: "Alasan penolakan minimal 10 karakter" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Masukkan alasan penolakan prestasi ini"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AchievementDetail;
