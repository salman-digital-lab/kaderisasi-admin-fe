import {
  Input,
  Col,
  Row,
  Card,
  Form,
  Button,
  Space,
  Table,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRequest, useToggle } from "ahooks";
import { useParams } from "react-router-dom";

import {
  getActivity,
  getExportRegistrants,
  getRegistrants,
} from "../../../../api/services/activity";

import { generateTableSchema } from "../constants/schema";

import MembersListModal from "./Modal/MembersListModal";
import ChangeStatusModal from "./Modal/ChangesStatusModal";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../constants/options";

type FieldType = {
  fullname?: string;
  status?: string;
};

const RegistrantList = () => {
  const { id } = useParams<{ id: string }>();

  const [form] = Form.useForm<FieldType>();

  const [modalState, { toggle: toggleModal }] = useToggle();
  const [modalChangeStatusState, { toggle: toggleChangeStatusModal }] =
    useToggle();

  const [parameters, setParameter] = useState({
    page: 1,
    per_page: 10,
    name: "",
    status: "",
  });

  const [mandatoryData, setMandatoryData] = useState<string[]>([]);
  const [customSelectionStatus, setCustomSelectionStatus] = useState<string[]>(
    [],
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleExportRegistrants = async () => {
    const data = await getExportRegistrants(id);
    if (data) {
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export-pendaftar.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const { data, loading, refresh } = useRequest(
    () =>
      getRegistrants(id, {
        page: String(parameters.page),
        per_page: String(parameters.per_page),
        name: parameters.name,
        status: parameters.status,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      if (data && data.additional_config.mandatory_profile_data) {
        setMandatoryData(
          data.additional_config.mandatory_profile_data.map(
            (item) => item.name,
          ),
        );
      }
      if (data && data.additional_config.custom_selection_status) {
        setCustomSelectionStatus(
          data.additional_config.custom_selection_status,
        );
      }
    },
  });

  useEffect(() => {
    if (!modalState && !modalChangeStatusState)
      setTimeout(() => {
        refresh();
      }, 1000);
  }, [modalState, modalChangeStatusState]);

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <MembersListModal open={modalState} toggle={toggleModal} />
      <ChangeStatusModal
        open={modalChangeStatusState}
        toggle={toggleChangeStatusModal}
        selectedRegistrationID={selectedRowKeys}
        customSelectionStatus={customSelectionStatus}
      />
      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={(val) =>
            setParameter((prev) => ({
              ...prev,
              name: val.fullname || "",
              page: 1,
              status: val.status || "",
            }))
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Nama Pendaftar" name="fullname">
                <Input placeholder="Nama Pendaftar" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Status Pendaftaran" name="status">
                <Select
                  options={[
                    ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
                    ...(customSelectionStatus?.map((val) => ({
                      label: val,
                      value: val,
                    })) || []),
                  ]}
                  placeholder="Status Pendaftaran"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Space>
              <Button
                onClick={() => toggleChangeStatusModal()}
                icon={<EditOutlined />}
                disabled={!selectedRowKeys.length}
              >
                Ubah Status
              </Button>
              <Button
                onClick={handleExportRegistrants}
                icon={<DownloadOutlined />}
              >
                Export Peserta
              </Button>
              <Button onClick={() => toggleModal()} icon={<PlusOutlined />}>
                Tambah Peserta
              </Button>
              <Button
                icon={<SearchOutlined />}
                type="primary"
                htmlType="submit"
              >
                Cari
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={generateTableSchema(mandatoryData)}
          dataSource={data?.data}
          pagination={{
            current: data?.meta.current_page,
            pageSize: data?.meta.per_page,
            showSizeChanger: true,
            total: data?.meta.total,
          }}
          loading={loading}
          onChange={(pagination) =>
            setParameter((prev) => ({
              ...prev,
              page: pagination.current || 1,
              per_page: pagination.pageSize || 10,
            }))
          }
          rowSelection={{
            type: "checkbox",
            onChange: (newSelectedRowKeys: React.Key[]) => {
              setSelectedRowKeys(newSelectedRowKeys);
            },
            getCheckboxProps: (record) => ({
              disabled: record.status === "LULUS KEGIATAN",
            }),
            selectedRowKeys,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </Space>
  );
};

export default RegistrantList;
