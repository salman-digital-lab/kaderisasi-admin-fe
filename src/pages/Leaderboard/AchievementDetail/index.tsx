import {
  Button,
  Card,
  Descriptions,
  DescriptionsProps,
  Space,
  Tag,
  notification,
  Dropdown,
  MenuProps,
} from "antd";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import dayjs from "dayjs";

import {
  getAchievement,
  approveAchievement,
} from "../../../api/services/achievement";
import { getProfileByUserId } from "../../../api/services/member";
import {
  renderAchievementStatus,
  renderAchievementStatusColor,
  renderAchievementType,
} from "../../../constants/render";
import { ACHIEVEMENT_STATUS_ENUM } from "../../../types/constants/achievement";

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
      label: "Status",
      children: (
        <Tag color={renderAchievementStatusColor(data?.status)}>
          {renderAchievementStatus(data?.status)}
        </Tag>
      ),
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
      label: "Disetujui Oleh",
      children: data?.approver?.display_name || "-",
    },
    {
      key: "2",
      label: "Tanggal Persetujuan",
      children: data?.approved_at
        ? dayjs(data?.approved_at).format("DD MMMM YYYY")
        : "-",
    },
  ];

  return (
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
                onClick: () =>
                  runAsync({
                    id: id || "",
                    status: Number(item?.key || "0"),
                  }).then(() => {
                    notification.success({
                      message: "Berhasil",
                      description: "Status prestasi berhasil diubah",
                    });
                    refresh();
                  }),
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
        <Descriptions items={basicInfo} bordered />
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
                  const response = await fetch(`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${data.proof}`);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = data.proof;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Error downloading file:', error);
                }
              }
            }}
          >
            Download Bukti
          </Button>
        </Space>
      </Card>

      <Card title="Informasi Persetujuan" loading={loading}>
        <Descriptions items={approvalInfo} bordered />
      </Card>
    </Space>
  );
};

export default AchievementDetail;
