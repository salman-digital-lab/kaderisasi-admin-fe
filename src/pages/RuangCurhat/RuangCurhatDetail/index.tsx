import { ResponsiveDescriptions as Descriptions } from "../../../components/common/Responsive/ResponsiveDescriptions";
import { useRequest, useToggle } from "ahooks";
import {
  Button,
  DescriptionsProps,
  Dropdown,
  Flex,
  MenuProps,
  Space,
  Tag,
  Typography,
  Input,
  Divider,
} from "antd";
import { useParams } from "react-router-dom";
import { DownOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

import {
  getRuangCurhat,
  putRuangCurhat,
} from "../../../api/services/ruangcurhat";
import {
  renderProblemOwner,
  renderProblemStatus,
  renderProblemStatusColor,
  renderUserLevel,
} from "../../../constants/render";

import { UPDATE_STATUS_MENU } from "./utils/constants";
import EditCounselorModal from "./components/EditCounselorModal";
import { usePermissions } from "../../../stores/authStore";

const { TextArea } = Input;
const { Title } = Typography;

export function RuangCurhatDetail() {
  const { id } = useParams<{ id: string }>();
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [modalIsOpen, { toggle: toggleModal }] = useToggle();
  const permissions = usePermissions();
  const canManage = permissions.includes("counseling.manage");

  const { data, refresh } = useRequest(() => getRuangCurhat({ id: id || "" }), {
    onSuccess: (data) => setAdditionalNotes(data?.additional_notes || ""),
  });

  const { loading: editLoading, runAsync } = useRequest(putRuangCurhat, {
    manual: true,
  });

  const profile = data?.publicUser.profile;

  const basicInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Email Pendaftar",
      children: data?.publicUser.email,
    },
    {
      key: "2",
      label: "Nama Pendaftar",
      children: profile?.name,
    },
    {
      key: "3",
      label: "Nomor WhatsApp",
      children: profile?.whatsapp,
    },
    {
      key: "5",
      label: "Universitas",
      children: data?.university?.name || "-",
    },
    {
      key: "6",
      label: "Angkatan",
      children: profile?.intake_year || "-",
    },
    {
      key: "7",
      label: "Jenis Kelamin",
      children: profile?.gender === "F" ? "Perempuan" : "Laki-Laki",
    },
    {
      key: "8",
      label: "Tanggal Lahir",
      children: profile?.birth_date
        ? dayjs(profile.birth_date).locale("id").format("DD MMMM YYYY")
        : "-",
    },
    {
      key: "9",
      label: "Jenjang Kaderisasi",
      children: renderUserLevel(profile?.level),
    },
  ];

  const problemOwnerData: DescriptionsProps["items"] = [
    {
      key: "1",
      span: 1,
      label: "Kepemilikan Masalah",
      children: renderProblemOwner(data?.problem_ownership),
    },
    {
      key: "2",
      span: 2,
      label: "Nama Pemilik Masalah",
      children: data?.owner_name || profile?.name,
    },
    {
      key: "4",
      label: "Kategori Masalah",
      span: 1,
      children: data?.problem_category,
    },
    {
      key: "4",
      label: "Preferensi Teknik Penanganan",
      span: 2,
      children: data?.handling_technic,
    },
    {
      key: "5",
      label: "Deskripsi Masalah",
      span: 3,
      children: data?.problem_description,
    },
  ];

  const counselorData: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Status",
      children: (
        <Tag color={renderProblemStatusColor(data?.status)}>
          {renderProblemStatus(data?.status)}
        </Tag>
      ),
    },
    {
      key: "2",
      label: "Preferensi Jenis Kelamin",
      span: 3,
      children: data?.counselor_gender,
    },
    {
      key: "3",
      label: "Nama Konselor",
      span: 3,
      children: data?.adminUser?.display_name,
    },
    {
      key: "4",
      label: "Email",
      span: 3,
      children: data?.adminUser?.email,
    },
  ];

  return (
    <Flex vertical gap="large" style={{ padding: 12 }}>
      {canManage && (
        <EditCounselorModal
          counselorId={data?.counselor_id}
          isOpen={modalIsOpen}
          run={runAsync}
          toggle={toggleModal}
          dataRefresh={refresh}
        />
      )}
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Informasi Pendaftar
        </Title>
        <Descriptions items={basicInfo} bordered size="small" />
      </div>
      <Divider style={{ margin: 0 }} />

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Informasi Masalah
        </Title>
        <Descriptions items={problemOwnerData} bordered size="small" />
      </div>

      <Divider style={{ margin: 0 }} />

      <div>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 12 }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Konselor
          </Title>
          {canManage && (
            <Space>
              <Dropdown
                menu={{
                  items: UPDATE_STATUS_MENU?.map((item) => ({
                    ...item,
                    onClick: () =>
                      runAsync({
                        id: id || "",
                        data: { status: Number(item?.key || "0") },
                      }).finally(refresh),
                  })) as MenuProps["items"],
                }}
              >
                <Button loading={editLoading}>
                  <Space>
                    Ubah Status
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
              <Button type="primary" onClick={() => toggleModal()}>
                Ubah Konselor
              </Button>
            </Space>
          )}
        </Flex>
        <Descriptions items={counselorData} bordered size="small" />
      </div>
      <Divider style={{ margin: 0 }} />

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Catatan
        </Title>
        <TextArea
          rows={4}
          value={additionalNotes}
          readOnly={!canManage}
          onChange={(e) => setAdditionalNotes(e.target.value)}
        />
        {canManage && (
          <Button
            type="primary"
            style={{ marginTop: "1rem" }}
            loading={editLoading}
            onClick={() =>
              runAsync({
                id: id || "",
                data: {
                  status: data?.status,
                  additional_notes: additionalNotes,
                },
              }).finally(refresh)
            }
          >
            {additionalNotes && additionalNotes.length
              ? "Ubah Catatan"
              : "Tambahkan Catatan"}
          </Button>
        )}
      </div>
    </Flex>
  );
}
