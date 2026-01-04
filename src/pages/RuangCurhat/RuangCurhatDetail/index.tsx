import { useRequest, useToggle } from "ahooks";
import {
  Button,
  Card,
  Descriptions,
  DescriptionsProps,
  Dropdown,
  Flex,
  MenuProps,
  Space,
  Tag,
  Typography,
  Input,
} from "antd";
import { useParams } from "react-router-dom";
import { DownOutlined } from "@ant-design/icons";
import { useState } from "react";

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
import { getProfileByUserId } from "../../../api/services/member";

const { TextArea } = Input;
const { Title } = Typography;

export function RuangCurhatDetail() {
  const { id } = useParams<{ id: string }>();
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [modalIsOpen, { toggle: toggleModal }] = useToggle();

  const { data, loading, refresh } = useRequest(
    () => getRuangCurhat({ id: id || "" }),
    {
      onSuccess: (data) => setAdditionalNotes(data?.additional_notes || ""),
    },
  );

  const { data: profileData } = useRequest(
    () => getProfileByUserId(String(data?.publicUser.id)),
    {
      ready: !!data?.publicUser.id,
    },
  );

  const { loading: editLoading, runAsync } = useRequest(putRuangCurhat, {
    manual: true,
  });

  const basicInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Email Pendaftar",
      children: profileData?.profile[0].publicUser?.email,
    },
    {
      key: "2",
      label: "Nama Pendaftar",
      children: profileData?.profile[0].name,
    },
    {
      key: "3",
      label: "Nomor WhatsApp",
      children: profileData?.profile[0].whatsapp,
    },
    {
      key: "5",
      label: "Universitas",
      children: profileData?.profile[0].university?.name || "-",
    },
    {
      key: "6",
      label: "Angkatan",
      children: profileData?.profile[0].intake_year || "-",
    },
    {
      key: "7",
      label: "Jenis Kelamin",
      children:
        profileData?.profile[0].gender === "F" ? "Perempuan" : "Laki-Laki",
    },
    {
      key: "8",
      label: "Jenjang Kaderisasi",
      children: renderUserLevel(profileData?.profile[0].level),
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
      children: data?.owner_name || profileData?.profile[0].name,
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
    <Flex vertical gap="middle">
      <EditCounselorModal
        counselorId={data?.counselor_id}
        isOpen={modalIsOpen}
        run={runAsync}
        toggle={toggleModal}
        dataRefresh={refresh}
      />
      <Card title="Informasi Pendaftar" loading={loading}>
        <Descriptions items={basicInfo} bordered />
      </Card>
      <Card title="Informasi Masalah" loading={loading}>
        <Descriptions items={problemOwnerData} bordered />
      </Card>

      <Card
        title="Konselor"
        loading={loading}
        extra={
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
        }
      >
        <Descriptions items={counselorData} bordered />
      </Card>

      <Card loading={loading}>
        <Title level={5}>Catatan</Title>
        <TextArea
          rows={4}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
        />
        <Button
          type="primary"
          style={{ marginTop: "1rem" }}
          loading={editLoading}
          onClick={() =>
            runAsync({
              id: id || "",
              data: { status: data?.status, additional_notes: additionalNotes },
            }).finally(refresh)
          }
        >
          {additionalNotes && additionalNotes.length
            ? "Ubah Catatan"
            : "Tambahkan Catatan"}
        </Button>
      </Card>
    </Flex>
  );
}
