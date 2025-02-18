import {
  Button,
  Card,
  Descriptions,
  DescriptionsProps,
  Space,
  Tag,
  Dropdown,
  MenuProps,
  Modal,
  InputNumber,
  Form,
  Input,
} from "antd";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DownOutlined,
} from "@ant-design/icons";
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
      children: dayjs(data?.achievement_date).format("DD MMMM YYYY"),
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
        ? dayjs(data?.approved_at).format("DD MMMM YYYY")
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
    <>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Space>
          <Button>
            <Link to="/achievement">
              <ArrowLeftOutlined /> Kembali
            </Link>
          </Button>
          {data?.status === ACHIEVEMENT_STATUS_ENUM.PENDING && (
            <Dropdown
              menu={{
                items: UPDATE_STATUS_MENU?.map((item) => ({
                  ...item,
                  onClick: () => handleStatusUpdate(Number(item?.key || "0")),
                })) as MenuProps["items"],
              }}
            >
              <Button loading={approveLoading}>
                <Space>
                  Ubah Status
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          )}
        </Space>

        <Card title="Informasi Dasar" loading={loading}>
          <Descriptions column={2} items={basicInfo} bordered />
        </Card>
        <Card title="Detail Prestasi" loading={loading}>
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Descriptions column={2} items={achievementInfo} bordered />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={async () => {
                if (data?.proof) {
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${data.proof}`,
                    );
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = data.proof;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    console.error("Error downloading file:", error);
                  }
                }
              }}
            >
              Download Bukti
            </Button>
          </Space>
        </Card>

        <Card title="Informasi Persetujuan" loading={loading}>
          <Descriptions column={2} items={approvalInfo} bordered />
        </Card>
      </Space>

      <Modal
        title="Masukkan Skor Prestasi"
        open={isScoreModalOpen}
        onCancel={() => {
          setIsScoreModalOpen(false);
          form.resetFields();
        }}
        onOk={() => {
          form.validateFields().then((values) => {
            Modal.confirm({
              title: "Konfirmasi Persetujuan",
              content: (
                <>
                  <span
                    style={{ color: "red" }}
                  >{`Aksi anda tidak dapat diubah setelah disetujui`}</span>
                  <br />
                  <br />
                  <span>{`Apakah anda yakin ingin menyetujui prestasi ini dengan skor `}<strong>{values.score}</strong>?</span>
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
        <Form form={form} layout="vertical">
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
          rejectForm.validateFields().then((values) => {
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
        <Form form={rejectForm} layout="vertical">
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
    </>
  );
};

export default AchievementDetail;
