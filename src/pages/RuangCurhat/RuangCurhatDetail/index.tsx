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
import { Link, useParams } from "react-router-dom";
import { ArrowLeftOutlined, DownOutlined } from "@ant-design/icons";
import { useState } from "react";

import {
  getRuangCurhat,
  putRuangCurhat,
} from "../../../api/services/ruangcurhat";
import {
  renderProblemOwner,
  renderProblemStatus,
  renderProblemStatusColor,
} from "../../../constants/render";

import { UPDATE_STATUS_MENU } from "./utils/constants";
import EditCounselorModal from "./components/EditCounselorModal";

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

  const { loading: editLoading, runAsync } = useRequest(putRuangCurhat, {
    manual: true,
  });

  const basicInfo: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Pendaftar ",
      children: data?.publicUser.email,
    },
    {
      key: "2",
      label: "Kepemilikan ",
      children: renderProblemOwner(data?.problem_ownership),
    },
    {
      key: "4",
      label: "Status",
      children: (
        <Tag color={renderProblemStatusColor(data?.status)}>
          {renderProblemStatus(data?.status)}
        </Tag>
      ),
    },
  ];

  const problemOwnerData: DescriptionsProps["items"] = [
    {
      key: "3",
      label: "Nama",
      span: 3,
      children: data?.owner_name,
    },
    {
      key: "5",
      label: "Deskripsi",
      span: 3,
      children: data?.problem_description,
    },
  ];

  const counselorData: DescriptionsProps["items"] = [
    {
      key: "3",
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
      key: "5",
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
      <Space>
        <Button>
          <Link to="/ruang-curhat">
            <ArrowLeftOutlined /> Kembali
          </Link>
        </Button>
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
      </Space>
      <Card title="Informasi Dasar" loading={loading}>
        <Descriptions items={basicInfo} bordered />
      </Card>
      <Card title="Detil Pemilik Masalah" loading={loading}>
        <Descriptions items={problemOwnerData} bordered />
      </Card>

      <Card
        title="Konselor"
        loading={loading}
        extra={
          <Button type="primary" onClick={() => toggleModal()}>
            Ubah Konselor
          </Button>
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
